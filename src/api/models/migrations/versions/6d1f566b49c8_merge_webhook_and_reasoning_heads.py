"""merge_webhook_and_reasoning_heads

Revision ID: 6d1f566b49c8
Revises: w1b2c3d4e5f6, e7f8a9b0c1d2
Create Date: 2026-04-16 07:27:39.564194

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "6d1f566b49c8"
down_revision: Union[str, None] = ("w1b2c3d4e5f6", "e7f8a9b0c1d2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
