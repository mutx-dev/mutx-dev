"""Add swarms table for multi-agent swarm management.

Revision ID: c3d4e5f6a7b8
Revises: 7f3e2c1b4a6d
Create Date: 2026-04-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "7f3e2c1b4a6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgresql = bind.dialect.name == "postgresql"

    # Keep SQLite-compatible text storage, but use native ARRAY on PostgreSQL
    agent_ids_type = sa.dialects.postgresql.ARRAY(sa.String()) if is_postgresql else sa.Text()

    op.create_table(
        "swarms",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("agent_ids", agent_ids_type, nullable=True),
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
