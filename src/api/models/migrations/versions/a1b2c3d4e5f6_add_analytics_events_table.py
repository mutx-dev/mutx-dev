"""Add analytics events table

Revision ID: a1b2c3d4e5f6
Revises: 8f2d6e4b9c1a
Create Date: 2026-03-16 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "8f2d6e4b9c1a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("event_name", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("properties", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_analytics_events_event_name"),
        "analytics_events",
        ["event_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analytics_events_user_id"),
        "analytics_events",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analytics_events_event_type"),
        "analytics_events",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analytics_events_created_at"),
        "analytics_events",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_analytics_events_created_at"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_event_type"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_user_id"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_event_name"), table_name="analytics_events")
    op.drop_table("analytics_events")
