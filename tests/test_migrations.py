import importlib.util
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


def test_alembic_has_single_head():
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    script = ScriptDirectory.from_config(config)

    assert script.get_heads() == ["8b3a6f1d2c4e"]


def _load_migration_module(module_name: str, file_name: str):
    module_path = (
        Path(__file__).resolve().parents[1]
        / "src/api/models/migrations/versions"
        / file_name
    )
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


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
