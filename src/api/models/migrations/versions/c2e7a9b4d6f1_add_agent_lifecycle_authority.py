"""Add desired and observed lifecycle evidence to agents and deployments.

Revision ID: c2e7a9b4d6f1
Revises: a1c3e5f7b9d2
Create Date: 2026-10-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c2e7a9b4d6f1"
down_revision: Union[str, Sequence[str], None] = "a1c3e5f7b9d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LIFECYCLE_COLUMNS = {
    "agents": {
        "desired_action": ("string", True),
        "desired_state": ("string", True),
        "observed_state": ("string", True),
        "target_revision": ("revision", False),
        "stop_fence_revision": ("integer", True),
        "stop_fence_completed_revision": ("integer", True),
        "observed_revision": ("integer", True),
        "observed_at": ("datetime", True),
    },
    "deployments": {
        "desired_action": ("string", True),
        "desired_state": ("string", True),
        "observed_state": ("string", True),
        "target_revision": ("revision", False),
        "agent_stop_revision": ("integer", True),
        "observed_revision": ("integer", True),
        "observed_at": ("datetime", True),
    },
    "commands": {
        "target_deployment_id": ("uuid", True),
        "target_revision": ("integer", True),
    },
}


def _expected_type(type_name: str):
    if type_name == "string":
        return sa.String(length=50)
    if type_name in {"integer", "revision"}:
        return sa.Integer()
    if type_name == "datetime":
        return sa.DateTime(timezone=True)
    if type_name == "uuid":
        return sa.Uuid()
    raise AssertionError(f"unexpected lifecycle type {type_name}")


def _new_column(name: str, type_name: str, nullable: bool) -> sa.Column:
    return sa.Column(
        name,
        _expected_type(type_name),
        nullable=nullable,
        server_default="0" if type_name == "revision" else None,
    )


def _type_is_compatible(connection, actual_type, expected_type) -> bool:
    if isinstance(expected_type, sa.String):
        return isinstance(actual_type, sa.String) and actual_type.length == expected_type.length
    if isinstance(expected_type, sa.Integer):
        return isinstance(actual_type, sa.Integer)
    if isinstance(expected_type, sa.DateTime):
        if not isinstance(actual_type, sa.DateTime):
            return False
        return connection.dialect.name == "sqlite" or actual_type.timezone
    if isinstance(expected_type, sa.Uuid):
        if isinstance(actual_type, sa.Uuid):
            return True
        return (
            connection.dialect.name == "sqlite"
            and isinstance(actual_type, sa.CHAR)
            and actual_type.length == 32
        )
    return False


def _preflight_upgrade(connection) -> dict[str, list[sa.Column]]:
    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())
    missing_by_table: dict[str, list[sa.Column]] = {}
    for table_name, lifecycle_columns in LIFECYCLE_COLUMNS.items():
        if table_name not in tables:
            continue
        current_columns = {column["name"]: column for column in inspector.get_columns(table_name)}
        missing: list[sa.Column] = []
        for column_name, (type_name, nullable) in lifecycle_columns.items():
            current = current_columns.get(column_name)
            if current is None:
                missing.append(_new_column(column_name, type_name, nullable))
                continue
            expected_type = _expected_type(type_name)
            if (
                not _type_is_compatible(connection, current["type"], expected_type)
                or current["nullable"] is not nullable
            ):
                raise RuntimeError(
                    f"agent lifecycle migration found incompatible {table_name}.{column_name}"
                )
            if type_name == "revision":
                default = str(current.get("default") or "").strip("()'\" ")
                if default not in {"0", "0::integer"}:
                    raise RuntimeError(
                        f"agent lifecycle migration requires {table_name}.{column_name} "
                        "to default to zero"
                    )
        missing_by_table[table_name] = missing
    return missing_by_table


def upgrade() -> None:
    connection = op.get_bind()
    missing_by_table = _preflight_upgrade(connection)
    for table_name, columns in missing_by_table.items():
        for column in columns:
            op.add_column(table_name, column)


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())
    present_by_table = {
        table_name: {column["name"]: column for column in inspector.get_columns(table_name)}
        for table_name in LIFECYCLE_COLUMNS
        if table_name in tables
    }
    if not present_by_table:
        return

    evidence_predicates = []
    for table_name, present_columns in present_by_table.items():
        for column_name, (type_name, nullable) in LIFECYCLE_COLUMNS[table_name].items():
            current = present_columns.get(column_name)
            if current is None:
                continue
            if (
                not _type_is_compatible(connection, current["type"], _expected_type(type_name))
                or current["nullable"] is not nullable
            ):
                raise RuntimeError(
                    f"agent lifecycle migration found incompatible {table_name}.{column_name}"
                )
            if type_name == "revision":
                default = str(current.get("default") or "").strip("()'\" ")
                if default not in {"0", "0::integer"}:
                    raise RuntimeError(
                        f"agent lifecycle migration requires {table_name}.{column_name} "
                        "to default to zero"
                    )
            if type_name == "revision":
                evidence_predicates.append(f"{column_name} <> 0")
            else:
                evidence_predicates.append(f"{column_name} IS NOT NULL")

    if evidence_predicates:
        evidence_checks = []
        for table_name, present_columns in present_by_table.items():
            predicates = []
            for column_name, (type_name, _nullable) in LIFECYCLE_COLUMNS[table_name].items():
                if column_name not in present_columns:
                    continue
                if type_name == "revision":
                    predicates.append(f"{column_name} <> 0")
                else:
                    predicates.append(f"{column_name} IS NOT NULL")
            if predicates:
                evidence_checks.append(
                    f"EXISTS (SELECT 1 FROM {table_name} WHERE {' OR '.join(predicates)})"
                )
        if connection.execute(sa.text("SELECT " + " OR ".join(evidence_checks))).scalar_one():
            raise RuntimeError(
                "Refusing to drop agent lifecycle intent or observed evidence during downgrade"
            )

    for table_name, present_columns in present_by_table.items():
        columns_to_drop = [
            column_name
            for column_name in LIFECYCLE_COLUMNS[table_name]
            if column_name in present_columns
        ]
        if not columns_to_drop:
            continue
        with op.batch_alter_table(table_name) as batch_op:
            for column_name in reversed(columns_to_drop):
                batch_op.drop_column(column_name)
