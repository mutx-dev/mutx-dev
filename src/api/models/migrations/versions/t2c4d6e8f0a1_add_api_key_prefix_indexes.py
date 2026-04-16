"""Add lookup prefixes for managed and agent API keys.

Revision ID: t2c4d6e8f0a1
Revises: s1b2c3d4e5f6
Create Date: 2026-04-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "t2c4d6e8f0a1"
down_revision: Union[str, None] = "s1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("api_keys", sa.Column("key_prefix", sa.String(length=32), nullable=True))
    op.create_index(op.f("ix_api_keys_key_prefix"), "api_keys", ["key_prefix"], unique=False)

    op.add_column("agents", sa.Column("api_key_prefix", sa.String(length=64), nullable=True))
    op.create_index(
        op.f("ix_agents_api_key_prefix"),
        "agents",
        ["api_key_prefix"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_agents_api_key_prefix"), table_name="agents")
    op.drop_column("agents", "api_key_prefix")

    op.drop_index(op.f("ix_api_keys_key_prefix"), table_name="api_keys")
    op.drop_column("api_keys", "key_prefix")
