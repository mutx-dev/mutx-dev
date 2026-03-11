"""Add deployment events table

Revision ID: 8f2d6e4b9c1a
Revises: e8f636a73690
Create Date: 2026-03-12 00:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f2d6e4b9c1a"
down_revision: Union[str, None] = "e8f636a73690"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "deployment_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("deployment_id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("node_id", sa.String(length=255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["deployment_id"],
            ["deployments.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_deployment_events_deployment_id"), "deployment_events", ["deployment_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_deployment_events_deployment_id"), table_name="deployment_events")
    op.drop_table("deployment_events")
