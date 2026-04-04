"""Add expiry timestamps for email verification tokens.

Revision ID: 1b6f9c3d4e2a
Revises: 7f3e2c1b4a6d
Create Date: 2026-03-26
"""

from datetime import datetime, timedelta, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1b6f9c3d4e2a"
down_revision: Union[str, None] = "7f3e2c1b4a6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _has_column("users", "email_verification_expires_at"):
        op.add_column(
            "users",
            sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True),
        )

    if _has_column("users", "email_verification_token") and _has_column(
        "users", "email_verification_expires_at"
    ):
        backfill_expires_at = datetime.now(timezone.utc) + timedelta(hours=72)
        op.execute(
            sa.text(
                "UPDATE users "
                "SET email_verification_expires_at = :backfill_expires_at "
                "WHERE email_verification_token IS NOT NULL "
                "AND email_verification_expires_at IS NULL"
            ).bindparams(backfill_expires_at=backfill_expires_at)
        )


def downgrade() -> None:
    if _has_column("users", "email_verification_expires_at"):
        op.drop_column("users", "email_verification_expires_at")
