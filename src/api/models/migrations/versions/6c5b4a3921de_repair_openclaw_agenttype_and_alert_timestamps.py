"""Repair OPENCLAW enum drift and alert timestamp timezone handling.

Revision ID: 6c5b4a3921de
Revises: d91f0a7b6c5e
Create Date: 2026-03-20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "6c5b4a3921de"
down_revision: Union[str, None] = "d91f0a7b6c5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _inspector():
    return sa.inspect(_bind())


def _has_table(table_name: str) -> bool:
    return _inspector().has_table(table_name)


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = _inspector()
    if not inspector.has_table(table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _get_column(table_name: str, column_name: str):
    inspector = _inspector()
    if not inspector.has_table(table_name):
        return None
    for column in inspector.get_columns(table_name):
        if column["name"] == column_name:
            return column
    return None


def _is_postgresql() -> bool:
    return _bind().dialect.name == "postgresql"


def _is_timezone_aware_datetime(column: dict | None) -> bool:
    if column is None:
        return False

    column_type = column.get("type")
    if isinstance(column_type, sa.DateTime):
        return bool(getattr(column_type, "timezone", False))

    return "with time zone" in str(column_type).lower()


def _has_postgresql_enum_value(enum_name: str, enum_value: str) -> bool:
    result = _bind().execute(
        sa.text(
            "SELECT 1 "
            "FROM pg_type enum_type "
            "JOIN pg_enum enum_value_row ON enum_value_row.enumtypid = enum_type.oid "
            "WHERE enum_type.typname = :enum_name AND enum_value_row.enumlabel = :enum_value"
        ),
        {"enum_name": enum_name, "enum_value": enum_value},
    )
    return result.scalar() is not None


def _ensure_agenttype_openclaw() -> None:
    if not _is_postgresql():
        return

    if not _has_postgresql_enum_value("agenttype", "OPENCLAW"):
        op.execute(sa.text("ALTER TYPE agenttype ADD VALUE IF NOT EXISTS 'OPENCLAW'"))


def _ensure_alerts_resolved_at_timezone() -> None:
    if not _is_postgresql() or not _has_table("alerts") or not _has_column("alerts", "resolved_at"):
        return

    if not _is_timezone_aware_datetime(_get_column("alerts", "resolved_at")):
        op.execute(
            sa.text(
                "ALTER TABLE alerts "
                "ALTER COLUMN resolved_at "
                "TYPE TIMESTAMP WITH TIME ZONE "
                "USING resolved_at AT TIME ZONE 'UTC'"
            )
        )


def upgrade() -> None:
    _ensure_agenttype_openclaw()
    _ensure_alerts_resolved_at_timezone()


def downgrade() -> None:
    pass
