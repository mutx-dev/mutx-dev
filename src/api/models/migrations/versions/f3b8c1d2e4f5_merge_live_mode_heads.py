"""Merge divergent live-mode migration heads.

Revision ID: f3b8c1d2e4f5
Revises: alter_plan_to_varchar, 9a1b2c3d4e5f6, c8a63f2d1f25, a1b2c3d4e5f6
Create Date: 2026-03-19
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "f3b8c1d2e4f5"
down_revision: Union[str, Sequence[str], None] = (
    "alter_plan_to_varchar",
    "9a1b2c3d4e5f6",
    "c8a63f2d1f25",
    "a1b2c3d4e5f6",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
