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


def upgrade() -> None:
    op.create_table(
        "usage_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False, index=True),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True
        ),
        sa.Column("resource_type", sa.String(100), nullable=True, index=True),
        sa.Column("resource_id", sa.String(255), nullable=True),
        sa.Column("credits_used", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("event_metadata", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
    )
    op.create_index(
        op.f("ix_usage_events_created_at"), "usage_events", ["created_at"], unique=False
    )
    op.create_index(
        op.f("ix_usage_events_event_type"), "usage_events", ["event_type"], unique=False
    )
    op.create_index(op.f("ix_usage_events_user_id"), "usage_events", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_usage_events_resource_type"), "usage_events", ["resource_type"], unique=False
    )


def downgrade() -> None:
    op.drop_table("usage_events")
