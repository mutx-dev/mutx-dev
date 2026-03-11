"""Add email verification and password reset fields

Revision ID: auth_fields_001
Revises: e8f636a73690_initial_migration_create_all_tables
Create Date: 2026-03-09

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "auth_fields_001"
down_revision: Union[str, None] = "e8f636a73690_initial_migration_create_all_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email verification fields
    op.add_column(
        "users",
        sa.Column("is_email_verified", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column("users", sa.Column("email_verification_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))
    op.create_index(
        "ix_users_email_verification_token", "users", ["email_verification_token"], unique=False
    )

    # Add password reset fields
    op.add_column("users", sa.Column("password_reset_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("password_reset_expires_at", sa.DateTime(), nullable=True))
    op.create_index(
        "ix_users_password_reset_token", "users", ["password_reset_token"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_users_password_reset_token", table_name="users")
    op.drop_column("users", "password_reset_expires_at")
    op.drop_column("users", "password_reset_token")
    op.drop_index("ix_users_email_verification_token", table_name="users")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "is_email_verified")
