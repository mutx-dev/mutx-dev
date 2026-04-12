"""Add external auth identities for hosted OAuth providers.

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-04-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _inspector():
    return sa.inspect(_bind())


def _has_table(table_name: str) -> bool:
    return _inspector().has_table(table_name)


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(index["name"] == index_name for index in _inspector().get_indexes(table_name))


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
    if not _has_table("external_auth_identities"):
        op.create_table(
            "external_auth_identities",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("provider", sa.String(length=32), nullable=False),
            sa.Column("provider_user_id", sa.String(length=255), nullable=False),
            sa.Column("provider_email", sa.String(length=255), nullable=True),
            sa.Column("provider_username", sa.String(length=255), nullable=True),
            sa.Column("provider_display_name", sa.String(length=255), nullable=True),
            sa.Column("avatar_url", sa.String(length=512), nullable=True),
            sa.Column("profile", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "provider",
                "provider_user_id",
                name="uq_external_auth_identities_provider_user",
            ),
        )

    _create_index_if_missing(
        "external_auth_identities",
        op.f("ix_external_auth_identities_user_id"),
        ["user_id"],
    )
    _create_index_if_missing(
        "external_auth_identities",
        op.f("ix_external_auth_identities_provider"),
        ["provider"],
    )
    _create_index_if_missing(
        "external_auth_identities",
        op.f("ix_external_auth_identities_provider_user_id"),
        ["provider_user_id"],
    )


def downgrade() -> None:
    if _has_table("external_auth_identities"):
        op.drop_table("external_auth_identities")
