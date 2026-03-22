import importlib.util
import os
from pathlib import Path
import subprocess
import sys

from alembic.config import Config
from alembic.script import ScriptDirectory
import sqlalchemy as sa


ROOT = Path(__file__).resolve().parents[1]
VERSIONS_DIR = ROOT / "src/api/models/migrations/versions"
CURRENT_HEAD = "7f3e2c1b4a6d"


def test_alembic_has_single_head():
    config = Config(str(ROOT / "alembic.ini"))
    script = ScriptDirectory.from_config(config)

    assert script.get_heads() == [CURRENT_HEAD]


def _load_migration_module(module_name: str, file_name: str):
    module_path = VERSIONS_DIR / file_name
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _run_alembic_upgrade(database_url: str) -> None:
    env = os.environ.copy()
    env.update(
        {
            "DATABASE_URL": database_url,
            "ENVIRONMENT": "development",
            "JWT_SECRET": "test-secret-key-that-is-long-enough-32",
            "DATABASE_REQUIRED_ON_STARTUP": "false",
            "BACKGROUND_MONITOR_ENABLED": "false",
            "ENABLE_RAG_API": "false",
        }
    )
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, (
        "alembic upgrade head failed\n"
        f"stdout:\n{result.stdout}\n"
        f"stderr:\n{result.stderr}"
    )


def _column_names(inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def _index_names(inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def test_live_mode_schema_hardening_upgrade_is_idempotent_for_existing_live_schema(monkeypatch):
    module = _load_migration_module(
        "live_mode_schema_hardening",
        "0f4d7b2c9a11_live_mode_schema_hardening.py",
    )

    existing_tables = {
        "agents",
        "agent_logs",
        "commands",
        "deployment_versions",
        "webhook_delivery_logs",
        "waitlist_signups",
        "leads",
        "usage_events",
        "agent_resource_usage",
    }
    existing_columns = {
        ("agents", "api_key"),
        ("agents", "last_heartbeat"),
        ("agent_logs", "meta_data"),
    }
    existing_indexes = {
        "ix_agents_api_key",
        "ix_commands_agent_id",
        "ix_deployment_versions_deployment_id",
        "ix_webhook_delivery_logs_webhook_id",
        "ix_waitlist_signups_email",
        "ix_waitlist_signups_created_at",
        "ix_leads_email",
        "ix_leads_created_at",
        "ix_usage_events_event_type",
        "ix_usage_events_user_id",
        "ix_usage_events_resource_type",
        "ix_usage_events_created_at",
        "ix_agent_resource_usage_agent_id",
    }
    calls: list[tuple] = []

    monkeypatch.setattr(module, "_has_table", lambda table_name: table_name in existing_tables)
    monkeypatch.setattr(
        module,
        "_has_column",
        lambda table_name, column_name: (table_name, column_name) in existing_columns,
    )
    monkeypatch.setattr(
        module,
        "_has_index",
        lambda _table_name, index_name: index_name in existing_indexes,
    )
    monkeypatch.setattr(module.op, "f", lambda name: name)
    monkeypatch.setattr(
        module.op,
        "add_column",
        lambda table_name, column: calls.append(("add_column", table_name, column.name)),
    )
    monkeypatch.setattr(
        module.op,
        "create_table",
        lambda table_name, *args, **kwargs: calls.append(("create_table", table_name)),
    )
    monkeypatch.setattr(
        module.op,
        "create_index",
        lambda index_name, table_name, columns, unique=False: calls.append(
            ("create_index", index_name, table_name, tuple(columns), unique)
        ),
    )

    module.upgrade()

    assert calls == [
        ("create_table", "refresh_token_sessions"),
        (
            "create_index",
            "ix_refresh_token_sessions_user_id",
            "refresh_token_sessions",
            ("user_id",),
            False,
        ),
        (
            "create_index",
            "ix_refresh_token_sessions_token_jti",
            "refresh_token_sessions",
            ("token_jti",),
            True,
        ),
        (
            "create_index",
            "ix_refresh_token_sessions_family_id",
            "refresh_token_sessions",
            ("family_id",),
            False,
        ),
    ]


def test_repair_live_auth_schema_drift_repairs_missing_objects(monkeypatch):
    module = _load_migration_module(
        "repair_live_auth_schema_drift",
        "8b3a6f1d2c4e_repair_live_auth_schema_drift.py",
    )

    existing_tables = {"agent_logs", "users"}
    existing_columns = set()
    existing_indexes = set()
    calls: list[tuple] = []

    monkeypatch.setattr(module, "_has_table", lambda table_name: table_name in existing_tables)
    monkeypatch.setattr(
        module,
        "_has_column",
        lambda table_name, column_name: (table_name, column_name) in existing_columns,
    )
    monkeypatch.setattr(
        module,
        "_has_index",
        lambda _table_name, index_name: index_name in existing_indexes,
    )
    monkeypatch.setattr(module.op, "f", lambda name: name)

    def add_column(table_name, column):
        calls.append(("add_column", table_name, column.name))
        existing_columns.add((table_name, column.name))

    def create_table(table_name, *args, **kwargs):
        calls.append(("create_table", table_name))
        existing_tables.add(table_name)

    def create_index(index_name, table_name, columns, unique=False):
        calls.append(("create_index", index_name, table_name, tuple(columns), unique))
        existing_indexes.add(index_name)

    monkeypatch.setattr(module.op, "add_column", add_column)
    monkeypatch.setattr(module.op, "create_table", create_table)
    monkeypatch.setattr(module.op, "create_index", create_index)

    module.upgrade()

    assert calls == [
        ("add_column", "agent_logs", "meta_data"),
        ("create_table", "refresh_token_sessions"),
        (
            "create_index",
            "ix_refresh_token_sessions_user_id",
            "refresh_token_sessions",
            ("user_id",),
            False,
        ),
        (
            "create_index",
            "ix_refresh_token_sessions_token_jti",
            "refresh_token_sessions",
            ("token_jti",),
            True,
        ),
        (
            "create_index",
            "ix_refresh_token_sessions_family_id",
            "refresh_token_sessions",
            ("family_id",),
            False,
        ),
    ]


def test_user_settings_migration_uses_uuid_user_foreign_key(monkeypatch):
    module = _load_migration_module(
        "add_user_settings_table",
        "7f3e2c1b4a6d_add_user_settings_table.py",
    )

    captured: dict[str, object] = {}

    def create_table(table_name, *items, **kwargs):
        captured["table_name"] = table_name
        captured["items"] = items

    monkeypatch.setattr(module.op, "create_table", create_table)
    monkeypatch.setattr(module.op, "create_index", lambda *args, **kwargs: None)
    monkeypatch.setattr(module.op, "f", lambda name: name)

    module.upgrade()

    assert captured["table_name"] == "user_settings"
    columns = {
        item.name: item
        for item in captured["items"]
        if isinstance(item, sa.Column)
    }

    assert isinstance(columns["id"].type, sa.UUID)
    assert isinstance(columns["user_id"].type, sa.UUID)


def test_convergence_migration_converts_last_heartbeat_to_utc_aware_on_postgresql(monkeypatch):
    module = _load_migration_module(
        "converge_runtime_schema_repairs",
        "d91f0a7b6c5e_converge_runtime_schema_repairs.py",
    )

    existing_tables = {"agents", "agent_logs", "refresh_token_sessions", "usage_events", "users"}
    existing_columns = {
        ("agents", "last_heartbeat"),
        ("agent_logs", "meta_data"),
        ("usage_events", "resource_type"),
        ("usage_events", "resource_id"),
        ("usage_events", "credits_used"),
        ("usage_events", "event_metadata"),
    }
    existing_indexes = {
        "ix_refresh_token_sessions_user_id",
        "ix_refresh_token_sessions_token_jti",
        "ix_refresh_token_sessions_family_id",
        "ix_usage_events_event_type",
        "ix_usage_events_user_id",
        "ix_usage_events_resource_type",
        "ix_usage_events_created_at",
    }
    executed: list[str] = []

    monkeypatch.setattr(module, "_has_table", lambda table_name: table_name in existing_tables)
    monkeypatch.setattr(
        module,
        "_has_column",
        lambda table_name, column_name: (table_name, column_name) in existing_columns,
    )
    monkeypatch.setattr(
        module,
        "_has_index",
        lambda _table_name, index_name: index_name in existing_indexes,
    )
    monkeypatch.setattr(
        module,
        "_get_column",
        lambda table_name, column_name: {
            "name": column_name,
            "type": sa.DateTime(timezone=False),
        }
        if (table_name, column_name) == ("agents", "last_heartbeat")
        else None,
    )
    monkeypatch.setattr(module, "_is_postgresql", lambda: True)
    monkeypatch.setattr(module.op, "f", lambda name: name)
    monkeypatch.setattr(module.op, "execute", lambda statement: executed.append(str(statement)))

    module.upgrade()

    assert executed == [
        "ALTER TABLE agents ALTER COLUMN last_heartbeat TYPE TIMESTAMP WITH TIME ZONE USING last_heartbeat AT TIME ZONE 'UTC'"
    ]


def test_convergence_migration_repairs_missing_runtime_drift(monkeypatch):
    module = _load_migration_module(
        "converge_runtime_schema_repairs",
        "d91f0a7b6c5e_converge_runtime_schema_repairs.py",
    )

    existing_tables = {"agents", "agent_logs", "usage_events", "users"}
    existing_columns = set()
    existing_indexes = set()
    calls: list[tuple] = []

    monkeypatch.setattr(module, "_has_table", lambda table_name: table_name in existing_tables)
    monkeypatch.setattr(
        module,
        "_has_column",
        lambda table_name, column_name: (table_name, column_name) in existing_columns,
    )
    monkeypatch.setattr(
        module,
        "_has_index",
        lambda _table_name, index_name: index_name in existing_indexes,
    )
    monkeypatch.setattr(module, "_get_column", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(module, "_is_postgresql", lambda: False)
    monkeypatch.setattr(module.op, "f", lambda name: name)

    def add_column(table_name, column):
        calls.append(("add_column", table_name, column.name))
        existing_columns.add((table_name, column.name))

    def create_table(table_name, *args, **kwargs):
        calls.append(("create_table", table_name))
        existing_tables.add(table_name)

    def create_index(index_name, table_name, columns, unique=False):
        calls.append(("create_index", index_name, table_name, tuple(columns), unique))
        existing_indexes.add(index_name)

    monkeypatch.setattr(module.op, "add_column", add_column)
    monkeypatch.setattr(module.op, "create_table", create_table)
    monkeypatch.setattr(module.op, "create_index", create_index)

    module.upgrade()

    assert calls == [
        ("add_column", "agent_logs", "meta_data"),
        ("create_table", "refresh_token_sessions"),
        (
            "create_index",
            "ix_refresh_token_sessions_user_id",
            "refresh_token_sessions",
            ("user_id",),
            False,
        ),
        (
            "create_index",
            "ix_refresh_token_sessions_token_jti",
            "refresh_token_sessions",
            ("token_jti",),
            True,
        ),
        (
            "create_index",
            "ix_refresh_token_sessions_family_id",
            "refresh_token_sessions",
            ("family_id",),
            False,
        ),
        ("add_column", "usage_events", "resource_type"),
        ("add_column", "usage_events", "resource_id"),
        ("add_column", "usage_events", "credits_used"),
        ("add_column", "usage_events", "event_metadata"),
        (
            "create_index",
            "ix_usage_events_event_type",
            "usage_events",
            ("event_type",),
            False,
        ),
        (
            "create_index",
            "ix_usage_events_user_id",
            "usage_events",
            ("user_id",),
            False,
        ),
        (
            "create_index",
            "ix_usage_events_resource_type",
            "usage_events",
            ("resource_type",),
            False,
        ),
        (
            "create_index",
            "ix_usage_events_created_at",
            "usage_events",
            ("created_at",),
            False,
        ),
        ("add_column", "agents", "last_heartbeat"),
    ]


def test_openclaw_repair_migration_repairs_postgresql_enum_and_alert_timestamps(monkeypatch):
    module = _load_migration_module(
        "repair_openclaw_agenttype_and_alert_timestamps",
        "6c5b4a3921de_repair_openclaw_agenttype_and_alert_timestamps.py",
    )

    executed: list[str] = []

    monkeypatch.setattr(module, "_is_postgresql", lambda: True)
    monkeypatch.setattr(module, "_has_postgresql_enum_value", lambda *_args: False)
    monkeypatch.setattr(module, "_has_table", lambda table_name: table_name == "alerts")
    monkeypatch.setattr(module, "_has_column", lambda table_name, column_name: (table_name, column_name) == ("alerts", "resolved_at"))
    monkeypatch.setattr(
        module,
        "_get_column",
        lambda table_name, column_name: {
            "name": column_name,
            "type": sa.DateTime(timezone=False),
        }
        if (table_name, column_name) == ("alerts", "resolved_at")
        else None,
    )
    monkeypatch.setattr(module.op, "execute", lambda statement: executed.append(str(statement)))

    module.upgrade()

    assert executed == [
        "ALTER TYPE agenttype ADD VALUE IF NOT EXISTS 'OPENCLAW'",
        "ALTER TABLE alerts ALTER COLUMN resolved_at TYPE TIMESTAMP WITH TIME ZONE USING resolved_at AT TIME ZONE 'UTC'",
    ]


def test_openclaw_repair_migration_is_noop_when_schema_is_already_current(monkeypatch):
    module = _load_migration_module(
        "repair_openclaw_agenttype_and_alert_timestamps_noop",
        "6c5b4a3921de_repair_openclaw_agenttype_and_alert_timestamps.py",
    )

    executed: list[str] = []

    monkeypatch.setattr(module, "_is_postgresql", lambda: True)
    monkeypatch.setattr(module, "_has_postgresql_enum_value", lambda *_args: True)
    monkeypatch.setattr(module, "_has_table", lambda *_args: True)
    monkeypatch.setattr(module, "_has_column", lambda *_args: True)
    monkeypatch.setattr(
        module,
        "_get_column",
        lambda *_args: {"name": "resolved_at", "type": sa.DateTime(timezone=True)},
    )
    monkeypatch.setattr(module.op, "execute", lambda statement: executed.append(str(statement)))

    module.upgrade()

    assert executed == []


def test_alembic_upgrade_head_succeeds_on_empty_sqlite_database(tmp_path):
    db_path = tmp_path / "empty.sqlite3"
    _run_alembic_upgrade(f"sqlite:///{db_path}")

    engine = sa.create_engine(f"sqlite:///{db_path}")
    try:
        inspector = sa.inspect(engine)

        assert {"agents", "agent_logs", "refresh_token_sessions", "usage_events"} <= set(
            inspector.get_table_names()
        )
        assert {"meta_data"} <= _column_names(inspector, "agent_logs")
        assert {"last_heartbeat"} <= _column_names(inspector, "agents")
        assert {
            "resource_type",
            "resource_id",
            "credits_used",
            "event_metadata",
        } <= _column_names(inspector, "usage_events")
        assert {
            "ix_refresh_token_sessions_user_id",
            "ix_refresh_token_sessions_token_jti",
            "ix_refresh_token_sessions_family_id",
        } <= _index_names(inspector, "refresh_token_sessions")
        assert {
            "ix_usage_events_event_type",
            "ix_usage_events_user_id",
            "ix_usage_events_resource_type",
            "ix_usage_events_created_at",
        } <= _index_names(inspector, "usage_events")
    finally:
        engine.dispose()


def test_alembic_upgrade_repairs_representative_legacy_live_schema(tmp_path):
    db_path = tmp_path / "legacy.sqlite3"
    engine = sa.create_engine(f"sqlite:///{db_path}")
    try:
        with engine.begin() as connection:
            connection.execute(
                sa.text(
                    "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
                )
            )
            connection.execute(
                sa.text(
                    "INSERT INTO alembic_version (version_num) VALUES ('8b3a6f1d2c4e')"
                )
            )
            connection.execute(
                sa.text("CREATE TABLE users (id CHAR(36) NOT NULL PRIMARY KEY)")
            )
            connection.execute(
                sa.text(
                    "CREATE TABLE agents ("
                    "id CHAR(36) NOT NULL PRIMARY KEY, "
                    "user_id CHAR(36) NOT NULL, "
                    "name VARCHAR(255), "
                    "status VARCHAR(50), "
                    "created_at DATETIME, "
                    "updated_at DATETIME, "
                    "last_heartbeat DATETIME"
                    ")"
                )
            )
            connection.execute(
                sa.text(
                    "CREATE TABLE agent_logs ("
                    "id CHAR(36) NOT NULL PRIMARY KEY, "
                    "agent_id CHAR(36) NOT NULL, "
                    "level VARCHAR(20), "
                    "message TEXT, "
                    "extra_data TEXT, "
                    "timestamp DATETIME"
                    ")"
                )
            )
            connection.execute(
                sa.text(
                    "CREATE TABLE usage_events ("
                    "id CHAR(36) NOT NULL PRIMARY KEY, "
                    "event_type VARCHAR(100) NOT NULL, "
                    "user_id CHAR(36) NOT NULL, "
                    "created_at DATETIME NOT NULL"
                    ")"
                )
            )
    finally:
        engine.dispose()

    _run_alembic_upgrade(f"sqlite:///{db_path}")

    engine = sa.create_engine(f"sqlite:///{db_path}")
    try:
        inspector = sa.inspect(engine)
        assert {"meta_data"} <= _column_names(inspector, "agent_logs")
        assert {
            "resource_type",
            "resource_id",
            "credits_used",
            "event_metadata",
        } <= _column_names(inspector, "usage_events")
        assert {"last_heartbeat"} <= _column_names(inspector, "agents")
        assert "refresh_token_sessions" in inspector.get_table_names()
        assert {
            "ix_refresh_token_sessions_user_id",
            "ix_refresh_token_sessions_token_jti",
            "ix_refresh_token_sessions_family_id",
        } <= _index_names(inspector, "refresh_token_sessions")
    finally:
        engine.dispose()
