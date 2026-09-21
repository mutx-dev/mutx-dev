"""Add approval deadlines, atomic consumption, and transactional lifecycle evidence."""

from alembic import op
import sqlalchemy as sa

revision = "a1c3e5f7b9d2"
down_revision = "f0b4d6e8a2c5"
branch_labels = None
depends_on = None


def upgrade():
    for name in ("expires_at", "escalates_at", "escalated_at", "consumed_at"):
        op.add_column(
            "approval_requests", sa.Column(name, sa.DateTime(timezone=True), nullable=True)
        )
    if op.get_bind().dialect.name == "sqlite":
        op.execute(
            "UPDATE approval_requests SET expires_at = datetime(created_at, '+1 hour'), "
            "escalates_at = datetime(created_at, '+15 minutes')"
        )
    else:
        op.execute(
            "UPDATE approval_requests SET expires_at = created_at + INTERVAL '1 hour', "
            "escalates_at = created_at + INTERVAL '15 minutes'"
        )
    op.create_table(
        "approval_audit_events",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("approval_id", sa.UUID(), sa.ForeignKey("approval_requests.id"), nullable=False),
        sa.Column("event_type", sa.String(32), nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_approval_audit_events_approval_id", "approval_audit_events", ["approval_id"]
    )


def downgrade():
    op.drop_table("approval_audit_events")
    for name in ("consumed_at", "escalated_at", "escalates_at", "expires_at"):
        op.drop_column("approval_requests", name)
