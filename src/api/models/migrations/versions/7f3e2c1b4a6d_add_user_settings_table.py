"""Add user settings table for onboarding and runtime snapshots.

Revision ID: 7f3e2c1b4a6d
Revises: 6c5b4a3921de
Create Date: 2026-03-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f3e2c1b4a6d"
down_revision: Union[str, Sequence[str], None] = "6c5b4a3921de"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_settings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "key", name="uq_user_settings_user_key"),
    )
    op.create_index(op.f("ix_user_settings_key"), "user_settings", ["key"], unique=False)
    op.create_index(op.f("ix_user_settings_user_id"), "user_settings", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_settings_user_id"), table_name="user_settings")
    op.drop_index(op.f("ix_user_settings_key"), table_name="user_settings")
    op.drop_table("user_settings")
