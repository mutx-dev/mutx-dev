"""Add meta_data column to agent_logs table

Revision ID: 3a8f2b1c4d6e
Revises: f7e2a1c8d9b4
Create Date: 2026-03-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "3a8f2b1c4d6e"
down_revision: Union[str, None] = "f7e2a1c8d9b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agent_logs", sa.Column("meta_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("agent_logs", "meta_data")
