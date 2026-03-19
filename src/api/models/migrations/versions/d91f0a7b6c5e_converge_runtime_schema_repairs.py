"""Converge runtime schema repairs into Alembic-managed drift recovery.

Revision ID: d91f0a7b6c5e
Revises: 8b3a6f1d2c4e
Create Date: 2026-03-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d91f0a7b6c5e"
down_revision: Union[str, None] = "8b3a6f1d2c4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _inspector():
    return sa.inspect(_bind())


def _has_table(table_name: str) -> bool:
    return _inspector().has_table(table_name)


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = _inspector()
    if not inspector.has_table(table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _get_column(table_name: str, column_name: str):
    inspector = _inspector()
    if not inspector.has_table(table_name):
        return None
    for column in inspector.get_columns(table_name):
        if column["name"] == column_name:
            return column
    return None


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(index["name"] == index_name for index in _inspector().get_indexes(table_name))


def _create_index_if_missing(
    table_name: str,
    index_name: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    if not _has_index(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def _is_postgresql() -> bool:
    return _bind().dialect.name == "postgresql"


def _is_timezone_aware_datetime(column: dict | None) -> bool:
    if column is None:
        return False

    column_type = column.get("type")
    if isinstance(column_type, sa.DateTime):
        return bool(getattr(column_type, "timezone", False))

    return "with time zone" in str(column_type).lower()


def _ensure_agents_last_heartbeat() -> None:
    if not _has_table("agents"):
        return

    if not _has_column("agents", "last_heartbeat"):
        op.add_column(
            "agents",
            sa.Column("last_heartbeat", sa.DateTime(timezone=True), nullable=True),
        )
        return

    if _is_postgresql() and not _is_timezone_aware_datetime(
        _get_column("agents", "last_heartbeat")
    ):
        op.execute(
            sa.text(
                "ALTER TABLE agents "
                "ALTER COLUMN last_heartbeat "
                "TYPE TIMESTAMP WITH TIME ZONE "
                "USING last_heartbeat AT TIME ZONE 'UTC'"
            )
        )


def _ensure_agent_logs_meta_data() -> None:
    if _has_table("agent_logs") and not _has_column("agent_logs", "meta_data"):
        op.add_column("agent_logs", sa.Column("meta_data", sa.Text(), nullable=True))


def _ensure_refresh_token_sessions() -> None:
    if not _has_table("refresh_token_sessions"):
        op.create_table(
            "refresh_token_sessions",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("token_jti", sa.String(length=64), nullable=False),
            sa.Column("family_id", sa.String(length=64), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("replaced_by_token_jti", sa.String(length=64), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if _has_table("refresh_token_sessions"):
        _create_index_if_missing(
            "refresh_token_sessions",
            op.f("ix_refresh_token_sessions_user_id"),
            ["user_id"],
        )
        _create_index_if_missing(
            "refresh_token_sessions",
            op.f("ix_refresh_token_sessions_token_jti"),
            ["token_jti"],
            unique=True,
        )
        _create_index_if_missing(
            "refresh_token_sessions",
            op.f("ix_refresh_token_sessions_family_id"),
            ["family_id"],
        )


def _ensure_usage_events() -> None:
    if not _has_table("usage_events"):
        op.create_table(
            "usage_events",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("event_type", sa.String(length=100), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("resource_type", sa.String(length=100), nullable=True),
            sa.Column("resource_id", sa.String(length=255), nullable=True),
            sa.Column("credits_used", sa.Float(), nullable=False),
            sa.Column("event_metadata", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    else:
        if not _has_column("usage_events", "resource_type"):
            op.add_column(
                "usage_events",
                sa.Column("resource_type", sa.String(length=100), nullable=True),
            )
        if not _has_column("usage_events", "resource_id"):
            op.add_column(
                "usage_events",
                sa.Column("resource_id", sa.String(length=255), nullable=True),
            )
        if not _has_column("usage_events", "credits_used"):
            op.add_column(
                "usage_events",
                sa.Column(
                    "credits_used",
                    sa.Float(),
                    nullable=False,
                    server_default=sa.text("1.0"),
                ),
            )
        if not _has_column("usage_events", "event_metadata"):
            op.add_column(
                "usage_events",
                sa.Column("event_metadata", sa.Text(), nullable=True),
            )

    if _has_table("usage_events"):
        _create_index_if_missing(
            "usage_events",
            op.f("ix_usage_events_event_type"),
            ["event_type"],
        )
        _create_index_if_missing(
            "usage_events",
            op.f("ix_usage_events_user_id"),
            ["user_id"],
        )
        _create_index_if_missing(
            "usage_events",
            op.f("ix_usage_events_resource_type"),
            ["resource_type"],
        )
        _create_index_if_missing(
            "usage_events",
            op.f("ix_usage_events_created_at"),
            ["created_at"],
        )


def upgrade() -> None:
    _ensure_agent_logs_meta_data()
    _ensure_refresh_token_sessions()
    _ensure_usage_events()
    _ensure_agents_last_heartbeat()


def downgrade() -> None:
    pass
