"""Add live-mode tables and columns missing from the Alembic chain.

Revision ID: 0f4d7b2c9a11
Revises: f3b8c1d2e4f5
Create Date: 2026-03-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0f4d7b2c9a11"
down_revision: Union[str, None] = "f3b8c1d2e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return False
    columns = inspector.get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    indexes = sa.inspect(op.get_bind()).get_indexes(table_name)
    return any(index["name"] == index_name for index in indexes)


def _create_index_if_missing(
    table_name: str,
    index_name: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    if not _has_index(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    if not _has_column("agents", "api_key"):
        op.add_column("agents", sa.Column("api_key", sa.String(length=128), nullable=True))
    if not _has_column("agents", "last_heartbeat"):
        op.add_column("agents", sa.Column("last_heartbeat", sa.DateTime(), nullable=True))
    _create_index_if_missing("agents", op.f("ix_agents_api_key"), ["api_key"])

    if not _has_column("agent_logs", "meta_data"):
        op.add_column("agent_logs", sa.Column("meta_data", sa.Text(), nullable=True))

    if not _has_table("commands"):
        op.create_table(
            "commands",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("agent_id", sa.UUID(), nullable=False),
            sa.Column("action", sa.String(length=100), nullable=False),
            sa.Column("parameters", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("result", sa.Text(), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["agent_id"], ["agents.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("commands", op.f("ix_commands_agent_id"), ["agent_id"])

    if not _has_table("deployment_versions"):
        op.create_table(
            "deployment_versions",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("deployment_id", sa.UUID(), nullable=False),
            sa.Column("version", sa.Integer(), nullable=False),
            sa.Column("config_snapshot", sa.Text(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("rolled_back_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["deployment_id"], ["deployments.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing(
        "deployment_versions",
        op.f("ix_deployment_versions_deployment_id"),
        ["deployment_id"],
    )

    if not _has_table("webhook_delivery_logs"):
        op.create_table(
            "webhook_delivery_logs",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("webhook_id", sa.UUID(), nullable=False),
            sa.Column("event", sa.String(length=100), nullable=False),
            sa.Column("payload", sa.Text(), nullable=False),
            sa.Column("status_code", sa.Integer(), nullable=True),
            sa.Column("response_body", sa.Text(), nullable=True),
            sa.Column("success", sa.Boolean(), nullable=False),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("attempts", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("delivered_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["webhook_id"], ["webhooks.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing(
        "webhook_delivery_logs",
        op.f("ix_webhook_delivery_logs_webhook_id"),
        ["webhook_id"],
    )

    if not _has_table("waitlist_signups"):
        op.create_table(
            "waitlist_signups",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("source", sa.String(length=120), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("email"),
        )
    _create_index_if_missing(
        "waitlist_signups",
        op.f("ix_waitlist_signups_email"),
        ["email"],
        unique=True,
    )
    _create_index_if_missing(
        "waitlist_signups",
        op.f("ix_waitlist_signups_created_at"),
        ["created_at"],
    )

    if not _has_table("leads"):
        op.create_table(
            "leads",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=True),
            sa.Column("company", sa.String(length=255), nullable=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("source", sa.String(length=120), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing("leads", op.f("ix_leads_email"), ["email"])
    _create_index_if_missing("leads", op.f("ix_leads_created_at"), ["created_at"])

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
    for index_name, column_name in (
        (op.f("ix_usage_events_event_type"), "event_type"),
        (op.f("ix_usage_events_user_id"), "user_id"),
        (op.f("ix_usage_events_resource_type"), "resource_type"),
        (op.f("ix_usage_events_created_at"), "created_at"),
    ):
        _create_index_if_missing("usage_events", index_name, [column_name])

    if not _has_table("agent_resource_usage"):
        op.create_table(
            "agent_resource_usage",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("agent_id", sa.UUID(), nullable=False),
            sa.Column("prompt_tokens", sa.Integer(), nullable=True),
            sa.Column("completion_tokens", sa.Integer(), nullable=True),
            sa.Column("total_tokens", sa.Integer(), nullable=True),
            sa.Column("api_calls", sa.Integer(), nullable=False),
            sa.Column("cost_usd", sa.Float(), nullable=True),
            sa.Column("model", sa.String(length=100), nullable=True),
            sa.Column("extra_metadata", sa.Text(), nullable=True),
            sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
            sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["agent_id"], ["agents.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing(
        "agent_resource_usage",
        op.f("ix_agent_resource_usage_agent_id"),
        ["agent_id"],
    )

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


def downgrade() -> None:
    op.drop_index(
        op.f("ix_refresh_token_sessions_family_id"),
        table_name="refresh_token_sessions",
    )
    op.drop_index(
        op.f("ix_refresh_token_sessions_token_jti"),
        table_name="refresh_token_sessions",
    )
    op.drop_index(op.f("ix_refresh_token_sessions_user_id"), table_name="refresh_token_sessions")
    op.drop_table("refresh_token_sessions")

    op.drop_index(op.f("ix_agent_resource_usage_agent_id"), table_name="agent_resource_usage")
    op.drop_table("agent_resource_usage")

    op.drop_index(op.f("ix_usage_events_created_at"), table_name="usage_events")
    op.drop_index(op.f("ix_usage_events_resource_type"), table_name="usage_events")
    op.drop_index(op.f("ix_usage_events_user_id"), table_name="usage_events")
    op.drop_index(op.f("ix_usage_events_event_type"), table_name="usage_events")
    op.drop_table("usage_events")

    op.drop_index(op.f("ix_leads_created_at"), table_name="leads")
    op.drop_index(op.f("ix_leads_email"), table_name="leads")
    op.drop_table("leads")

    op.drop_index(op.f("ix_waitlist_signups_created_at"), table_name="waitlist_signups")
    op.drop_index(op.f("ix_waitlist_signups_email"), table_name="waitlist_signups")
    op.drop_table("waitlist_signups")

    op.drop_index(
        op.f("ix_webhook_delivery_logs_webhook_id"),
        table_name="webhook_delivery_logs",
    )
    op.drop_table("webhook_delivery_logs")

    op.drop_index(
        op.f("ix_deployment_versions_deployment_id"),
        table_name="deployment_versions",
    )
    op.drop_table("deployment_versions")

    op.drop_index(op.f("ix_commands_agent_id"), table_name="commands")
    op.drop_table("commands")

    op.drop_column("agent_logs", "meta_data")

    op.drop_index(op.f("ix_agents_api_key"), table_name="agents")
    op.drop_column("agents", "last_heartbeat")
    op.drop_column("agents", "api_key")
