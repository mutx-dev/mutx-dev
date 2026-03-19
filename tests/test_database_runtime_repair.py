from src.api import database
from src.api.models.models import AgentLog, RefreshTokenSession


class _FakeConnection:
    def __init__(self) -> None:
        self.executed: list[str] = []

    def execute(self, statement) -> None:
        self.executed.append(str(statement))


def test_runtime_schema_repair_repairs_missing_auth_objects(monkeypatch):
    existing_tables = {"agent_logs"}
    existing_columns = set()
    existing_indexes = set()
    calls: list[tuple[str, str]] = []

    monkeypatch.setattr(
        database,
        "_has_table",
        lambda _connection, table_name: table_name in existing_tables,
    )
    monkeypatch.setattr(
        database,
        "_has_column",
        lambda _connection, table_name, column_name: (table_name, column_name) in existing_columns,
    )
    monkeypatch.setattr(
        database,
        "_has_index",
        lambda _connection, table_name, index_name: (table_name, index_name) in existing_indexes,
    )
    monkeypatch.setattr(
        AgentLog.__table__,
        "create",
        lambda *args, **kwargs: calls.append(("create_table", "agent_logs")),
    )
    monkeypatch.setattr(
        RefreshTokenSession.__table__,
        "create",
        lambda *args, **kwargs: calls.append(("create_table", "refresh_token_sessions")),
    )

    connection = _FakeConnection()
    repaired_objects = database._repair_known_schema_drift(connection)

    assert connection.executed == ["ALTER TABLE agent_logs ADD COLUMN meta_data TEXT"]
    assert calls == [("create_table", "refresh_token_sessions")]
    assert repaired_objects == ["agent_logs.meta_data", "refresh_token_sessions"]


def test_runtime_schema_repair_creates_missing_refresh_token_indexes(monkeypatch):
    existing_tables = {"agent_logs", "refresh_token_sessions"}
    existing_columns = {("agent_logs", "meta_data")}
    existing_indexes = set()
    calls: list[tuple[str, str]] = []

    monkeypatch.setattr(
        database,
        "_has_table",
        lambda _connection, table_name: table_name in existing_tables,
    )
    monkeypatch.setattr(
        database,
        "_has_column",
        lambda _connection, table_name, column_name: (table_name, column_name) in existing_columns,
    )
    monkeypatch.setattr(
        database,
        "_has_index",
        lambda _connection, table_name, index_name: (table_name, index_name) in existing_indexes,
    )

    for index in RefreshTokenSession.__table__.indexes:
        monkeypatch.setattr(
            index,
            "create",
            lambda *args, _name=index.name, **kwargs: calls.append(("create_index", _name or "")),
        )

    connection = _FakeConnection()
    repaired_objects = database._repair_known_schema_drift(connection)

    assert connection.executed == []
    assert calls == [
        ("create_index", "ix_refresh_token_sessions_family_id"),
        ("create_index", "ix_refresh_token_sessions_token_jti"),
        ("create_index", "ix_refresh_token_sessions_user_id"),
    ]
    assert repaired_objects == [
        "refresh_token_sessions.ix_refresh_token_sessions_family_id",
        "refresh_token_sessions.ix_refresh_token_sessions_token_jti",
        "refresh_token_sessions.ix_refresh_token_sessions_user_id",
    ]
