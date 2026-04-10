"""Add swarms table for multi-agent swarm management.

Revision ID: a1b2c3d4e5f6
Revises: 7f3e2c1b4a6d
Create Date: 2026-04-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "7f3e2c1b4a6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create swarms table — agent_ids stored as JSON array (text) for SQLite compatibility
    # PostgreSQL will use native ARRAY
    op.create_table(
        "swarms",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("agent_ids", sa.Text(), nullable=True),  # JSON array serialized as text
        sa.Column("min_replicas", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("max_replicas", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_swarms_user_id"), "swarms", ["user_id"], unique=False)
    op.create_index(op.f("ix_swarms_name"), "swarms", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_swarms_name"), table_name="swarms")
    op.drop_index(op.f("ix_swarms_user_id"), table_name="swarms")
    op.drop_table("swarms")
