"""Repair live auth schema drift on databases already marked at head.

Revision ID: 8b3a6f1d2c4e
Revises: 5c2f4a7d9e10
Create Date: 2026-03-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "8b3a6f1d2c4e"
down_revision: Union[str, None] = "5c2f4a7d9e10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return False
    columns = inspector.get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    indexes = sa.inspect(op.get_bind()).get_indexes(table_name)
    return any(index["name"] == index_name for index in indexes)


def _create_index_if_missing(
    table_name: str,
    index_name: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    if not _has_index(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    if _has_table("agent_logs") and not _has_column("agent_logs", "meta_data"):
        op.add_column("agent_logs", sa.Column("meta_data", sa.Text(), nullable=True))

    if not _has_table("refresh_token_sessions"):
        op.create_table(
            "refresh_token_sessions",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("token_jti", sa.String(length=64), nullable=False),
            sa.Column("family_id", sa.String(length=64), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("replaced_by_token_jti", sa.String(length=64), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if _has_table("refresh_token_sessions"):
        _create_index_if_missing(
            "refresh_token_sessions",
            op.f("ix_refresh_token_sessions_user_id"),
            ["user_id"],
        )
        _create_index_if_missing(
            "refresh_token_sessions",
            op.f("ix_refresh_token_sessions_token_jti"),
            ["token_jti"],
            unique=True,
        )
        _create_index_if_missing(
            "refresh_token_sessions",
            op.f("ix_refresh_token_sessions_family_id"),
            ["family_id"],
        )


def downgrade() -> None:
    pass
