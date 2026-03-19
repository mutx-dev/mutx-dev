"""Merge the orphan schema branch back into the main Alembic chain.

Revision ID: 5c2f4a7d9e10
Revises: 0f4d7b2c9a11, 3a8f2b1c4d6e
Create Date: 2026-03-19
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "5c2f4a7d9e10"
down_revision: Union[str, Sequence[str], None] = ("0f4d7b2c9a11", "3a8f2b1c4d6e")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
