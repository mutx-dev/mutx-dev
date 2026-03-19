"""Alter plan column from enum to varchar."""

from alembic import op

revision = "alter_plan_to_varchar"
down_revision = "e8f636a73690"
branch_labels = None
depends_on = None


def _is_sqlite() -> bool:
    return op.get_bind().dialect.name == "sqlite"


def upgrade() -> None:
    if _is_sqlite():
        return
    # First, drop the default to avoid conflicts
    op.execute("ALTER TABLE users ALTER COLUMN plan DROP DEFAULT")
    # Change the column type from enum to varchar
    op.execute("ALTER TABLE users ALTER COLUMN plan TYPE VARCHAR(20)")
    # Set the default
    op.execute("ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'FREE'")


def downgrade() -> None:
    if _is_sqlite():
        return
    op.execute("CREATE TYPE plan AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')")
    op.execute("ALTER TABLE users ALTER COLUMN plan TYPE plan USING plan::plan")
