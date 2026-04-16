"""Add webhook circuit breaker and delivery enhancements

Revision ID: a1b2c3d4e5f6
Revises: f7e2a1c8d9b4
Create Date: 2026-04-16

Adds:
- webhooks.name: Optional human-readable name
- webhooks.consecutive_failures: Circuit breaker tracking
- webhook_delivery_logs.duration_ms: Delivery timing
- webhook_delivery_logs.parent_delivery_id: Manual retry linking
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f7e2a1c8d9b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    if not sa.inspect(bind).has_table(table_name):
        return False
    columns = [col["name"] for col in sa.inspect(bind).get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Add columns to webhooks table
    if not _has_column("webhooks", "name"):
        op.add_column(
            "webhooks",
            sa.Column("name", sa.String(120), nullable=True),
        )

    if not _has_column("webhooks", "consecutive_failures"):
        op.add_column(
            "webhooks",
            sa.Column("consecutive_failures", sa.Integer(), nullable=False, server_default="0"),
        )

    # Add columns to webhook_delivery_logs table
    if not _has_column("webhook_delivery_logs", "duration_ms"):
        op.add_column(
            "webhook_delivery_logs",
            sa.Column("duration_ms", sa.Integer(), nullable=True),
        )

    if not _has_column("webhook_delivery_logs", "parent_delivery_id"):
        op.add_column(
            "webhook_delivery_logs",
            sa.Column(
                "parent_delivery_id",
                UUID(as_uuid=True),
                nullable=True,
            ),
        )


def downgrade() -> None:
    # Remove from webhook_delivery_logs
    if _has_column("webhook_delivery_logs", "parent_delivery_id"):
        op.drop_column("webhook_delivery_logs", "parent_delivery_id")

    if _has_column("webhook_delivery_logs", "duration_ms"):
        op.drop_column("webhook_delivery_logs", "duration_ms")

    # Remove from webhooks
    if _has_column("webhooks", "consecutive_failures"):
        op.drop_column("webhooks", "consecutive_failures")

    if _has_column("webhooks", "name"):
        op.drop_column("webhooks", "name")
