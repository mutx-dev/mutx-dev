"""Merge divergent heads: email_verification_expiry and swarms tables.

Revision ID: b2c3d4e5f6a7
Revises: 1b6f9c3d4e2a, c3d4e5f6a7b8
Create Date: 2026-04-10
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = ("1b6f9c3d4e2a", "c3d4e5f6a7b8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
