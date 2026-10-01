"""U14 migration preserves legacy rows and refuses to discard new evidence."""

from __future__ import annotations

import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
import pytest
import sqlalchemy as sa


ROOT = Path(__file__).resolve().parents[2]
MIGRATION_PATH = (
    ROOT / "src/api/models/migrations/versions/c2e7a9b4d6f1_add_agent_lifecycle_authority.py"
)


def _load_migration():
    spec = importlib.util.spec_from_file_location("agent_lifecycle_migration", MIGRATION_PATH)
    assert spec is not None and spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def _create_pre_u14_tables(connection) -> None:
    connection.execute(
        sa.text("CREATE TABLE agents (id CHAR(36) PRIMARY KEY, status VARCHAR(50) NOT NULL)")
    )
    connection.execute(
        sa.text(
            "CREATE TABLE deployments ("
            "id CHAR(36) PRIMARY KEY, agent_id CHAR(36) NOT NULL, status VARCHAR(50) NOT NULL)"
        )
    )
    connection.execute(
        sa.text(
            "CREATE TABLE commands ("
            "id CHAR(36) PRIMARY KEY, agent_id CHAR(36) NOT NULL, action VARCHAR(100) NOT NULL)"
        )
    )


def _install_operations(migration, connection, monkeypatch) -> None:
    monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))


def test_upgrade_and_downgrade_skip_absent_feature_tables(monkeypatch):
    migration = _load_migration()
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            connection.execute(sa.text("CREATE TABLE unrelated (id INTEGER PRIMARY KEY)"))
            connection.execute(sa.text("INSERT INTO unrelated (id) VALUES (1)"))
            _install_operations(migration, connection, monkeypatch)

            migration.upgrade()
            migration.downgrade()

            assert set(sa.inspect(connection).get_table_names()) == {"unrelated"}
            assert connection.execute(sa.text("SELECT id FROM unrelated")).scalar_one() == 1
    finally:
        engine.dispose()


def test_upgrade_adds_lifecycle_columns_to_agents_table_without_unrelated_columns(monkeypatch):
    migration = _load_migration()
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            connection.execute(sa.text("CREATE TABLE agents (id CHAR(36) NOT NULL PRIMARY KEY)"))
            connection.execute(sa.text("INSERT INTO agents (id) VALUES ('legacy-agent')"))
            _install_operations(migration, connection, monkeypatch)

            migration.upgrade()

            inspector = sa.inspect(connection)
            columns = {item["name"] for item in inspector.get_columns("agents")}
            assert set(migration.LIFECYCLE_COLUMNS["agents"]) <= columns
            assert "status" not in columns
            assert not {"commands", "deployments"} & set(inspector.get_table_names())
            row = connection.execute(
                sa.text(
                    "SELECT id, desired_action, observed_state, target_revision, "
                    "observed_revision, observed_at FROM agents WHERE id = 'legacy-agent'"
                )
            ).one()
            assert tuple(row) == ("legacy-agent", None, None, 0, None, None)
    finally:
        engine.dispose()


def test_upgrade_on_empty_legacy_tables_leaves_evidence_null_and_replays_cleanly(
    monkeypatch,
):
    migration = _load_migration()
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            _create_pre_u14_tables(connection)
            _install_operations(migration, connection, monkeypatch)
            migration.upgrade()

            inspector = sa.inspect(connection)
            for table in ("agents", "deployments"):
                columns = {item["name"]: item for item in inspector.get_columns(table)}
                assert {
                    "desired_action",
                    "desired_state",
                    "observed_state",
                    "target_revision",
                    "observed_revision",
                    "observed_at",
                } <= set(columns)
                assert columns["target_revision"]["default"] in {"0", "'0'"}
            connection.execute(
                sa.text("INSERT INTO agents (id, status) VALUES ('legacy-agent', 'running')")
            )
            connection.execute(
                sa.text(
                    "INSERT INTO deployments (id, agent_id, status) "
                    "VALUES ('legacy-deployment', 'legacy-agent', 'ready')"
                )
            )
            agent = connection.execute(
                sa.text(
                    "SELECT status, desired_state, observed_state, target_revision, observed_at "
                    "FROM agents WHERE id = 'legacy-agent'"
                )
            ).one()
            deployment = connection.execute(
                sa.text(
                    "SELECT status, desired_state, observed_state, target_revision, observed_at "
                    "FROM deployments WHERE id = 'legacy-deployment'"
                )
            ).one()
            assert tuple(agent) == ("running", None, None, 0, None)
            assert tuple(deployment) == ("ready", None, None, 0, None)

            # A downgrade with no lifecycle intent/evidence permits a fresh upgrade.
            migration.downgrade()
            migration.upgrade()
            assert "observed_state" in {
                item["name"] for item in sa.inspect(connection).get_columns("deployments")
            }
    finally:
        engine.dispose()


def test_downgrade_refuses_to_delete_lifecycle_evidence(monkeypatch):
    migration = _load_migration()
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            _create_pre_u14_tables(connection)
            _install_operations(migration, connection, monkeypatch)
            migration.upgrade()
            connection.execute(
                sa.text(
                    "INSERT INTO agents (id, status, desired_action, desired_state, "
                    "observed_state, target_revision, observed_revision) "
                    "VALUES ('agent', 'running', 'deploy', 'running', 'running', 2, 2)"
                )
            )
            with pytest.raises(RuntimeError, match="Refusing to drop agent lifecycle"):
                migration.downgrade()

            columns = {item["name"] for item in sa.inspect(connection).get_columns("agents")}
            assert "observed_state" in columns
            evidence = connection.execute(
                sa.text("SELECT observed_state, observed_revision FROM agents WHERE id = 'agent'")
            ).one()
            assert tuple(evidence) == ("running", 2)
    finally:
        engine.dispose()


def test_upgrade_completes_compatible_partial_schema_without_losing_evidence(monkeypatch):
    migration = _load_migration()
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            _create_pre_u14_tables(connection)
            connection.execute(
                sa.text("ALTER TABLE agents ADD COLUMN desired_action VARCHAR(50) NULL")
            )
            connection.execute(
                sa.text("ALTER TABLE agents ADD COLUMN observed_state VARCHAR(50) NULL")
            )
            connection.execute(
                sa.text(
                    "INSERT INTO agents (id, status, desired_action, observed_state) "
                    "VALUES ('partial-agent', 'running', 'deploy', 'running')"
                )
            )
            _install_operations(migration, connection, monkeypatch)

            migration.upgrade()
            migration.upgrade()

            row = connection.execute(
                sa.text(
                    "SELECT desired_action, observed_state, target_revision, "
                    "observed_revision FROM agents WHERE id = 'partial-agent'"
                )
            ).one()
            assert tuple(row) == ("deploy", "running", 0, None)
            assert "target_deployment_id" in {
                column["name"] for column in sa.inspect(connection).get_columns("commands")
            }
    finally:
        engine.dispose()


def test_upgrade_rejects_incompatible_partial_schema_before_any_additions(monkeypatch):
    migration = _load_migration()
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            _create_pre_u14_tables(connection)
            connection.execute(sa.text("ALTER TABLE agents ADD COLUMN desired_action INTEGER NULL"))
            _install_operations(migration, connection, monkeypatch)

            with pytest.raises(RuntimeError, match="agents.desired_action"):
                migration.upgrade()

            assert "desired_state" not in {
                column["name"] for column in sa.inspect(connection).get_columns("agents")
            }
            assert "target_deployment_id" not in {
                column["name"] for column in sa.inspect(connection).get_columns("commands")
            }
    finally:
        engine.dispose()
