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


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return False
    columns = inspector.get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade() -> None:
    if not _has_column("agent_logs", "meta_data"):
        op.add_column("agent_logs", sa.Column("meta_data", sa.Text(), nullable=True))


def downgrade() -> None:
    # This orphan branch is merged back into the main chain by a later revision.
    # Leave teardown to the canonical migration path to avoid dropping shared columns.
    pass
