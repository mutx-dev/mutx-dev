"""Add agent versions table

Revision ID: 9a1b2c3d4e5f6
Revises: 8f2d6e4b9c1a
Create Date: 2026-03-16 18:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "9a1b2c3d4e5f6"
down_revision: Union[str, None] = "8f2d6e4b9c1a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_versions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("agent_id", sa.UUID(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("config_snapshot", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rolled_back_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["agents.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_agent_versions_agent_id"),
        "agent_versions",
        ["agent_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_agent_versions_agent_id"), table_name="agent_versions")
    op.drop_table("agent_versions")
