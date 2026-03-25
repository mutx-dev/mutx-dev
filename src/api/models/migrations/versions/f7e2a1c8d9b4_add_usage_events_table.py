"""Add usage_events table for telemetry and quota enforcement

Revision ID: f7e2a1c8d9b4
Revises:
Create Date: 2026-03-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "f7e2a1c8d9b4"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    indexes = sa.inspect(op.get_bind()).get_indexes(table_name)
    return any(index["name"] == index_name for index in indexes)


def upgrade() -> None:
    if not _has_table("usage_events"):
        op.create_table(
            "usage_events",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("event_type", sa.String(100), nullable=False, index=True),
            sa.Column(
                "user_id",
                UUID(as_uuid=True),
                sa.ForeignKey("users.id"),
                nullable=False,
                index=True,
            ),
            sa.Column("resource_type", sa.String(100), nullable=True, index=True),
            sa.Column("resource_id", sa.String(255), nullable=True),
            sa.Column("credits_used", sa.Float(), nullable=False, server_default="1.0"),
            sa.Column("event_metadata", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        )

    for index_name, column_name in (
        (op.f("ix_usage_events_created_at"), "created_at"),
        (op.f("ix_usage_events_event_type"), "event_type"),
        (op.f("ix_usage_events_user_id"), "user_id"),
        (op.f("ix_usage_events_resource_type"), "resource_type"),
    ):
        if not _has_index("usage_events", index_name):
            op.create_index(index_name, "usage_events", [column_name], unique=False)


def downgrade() -> None:
    # This orphan branch is merged back into the main chain by a later revision.
    # Leave teardown to the canonical migration path to avoid dropping shared tables.
    pass
