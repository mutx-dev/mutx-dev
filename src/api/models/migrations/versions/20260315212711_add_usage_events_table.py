"""add usage_events table for analytics

Revision ID: $(date +%Y%m%d%H%M%S)
Revises: 
Create Date: $(date +%Y-%m-%d %H:%M:%S)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '$(date +%Y%m%d%H%M%S)'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'usage_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('event_type', sa.String(100), nullable=False, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True, index=True),
        sa.Column('session_id', sa.String(255), nullable=True, index=True),
        sa.Column('source', sa.String(50), nullable=True),
        sa.Column('event_name', sa.String(255), nullable=True),
        sa.Column('extra_data', sa.Text, nullable=True),
        sa.Column('timestamp', sa.DateTime, nullable=False, index=True, server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('usage_events')
