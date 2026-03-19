"""Alter plan column from enum to varchar."""

from alembic import op

revision = "alter_plan_to_varchar"
down_revision = "e8f636a73690"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # First, drop the default to avoid conflicts
    op.execute("ALTER TABLE users ALTER COLUMN plan DROP DEFAULT")
    # Change the column type from enum to varchar
    op.execute("ALTER TABLE users ALTER COLUMN plan TYPE VARCHAR(20)")
    # Set the default
    op.execute("ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'FREE'")


def downgrade() -> None:
    op.execute("CREATE TYPE plan AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')")
    op.execute("ALTER TABLE users ALTER COLUMN plan TYPE plan USING plan::plan")
