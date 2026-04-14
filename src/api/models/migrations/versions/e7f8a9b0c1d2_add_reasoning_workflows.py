"""Add reasoning workflow jobs and artifacts.

Revision ID: e7f8a9b0c1d2
Revises: d6e7f8a9b0c1
Create Date: 2026-04-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "d6e7f8a9b0c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _inspector():
    return sa.inspect(_bind())


def _has_table(table_name: str) -> bool:
    return _inspector().has_table(table_name)


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(index["name"] == index_name for index in _inspector().get_indexes(table_name))


def _create_index_if_missing(
    table_name: str,
    index_name: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    if not _has_index(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    if not _has_table("reasoning_jobs"):
        op.create_table(
            "reasoning_jobs",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("run_id", sa.UUID(), nullable=False),
            sa.Column("template_id", sa.String(length=120), nullable=False),
            sa.Column("execution_mode", sa.String(length=32), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("parameters", sa.Text(), nullable=True),
            sa.Column("result_summary", sa.Text(), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("claimed_by", sa.String(length=255), nullable=True),
            sa.Column("claim_token", sa.String(length=64), nullable=True),
            sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("last_heartbeat_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["run_id"], ["agent_runs.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("run_id"),
        )

    _create_index_if_missing("reasoning_jobs", op.f("ix_reasoning_jobs_user_id"), ["user_id"])
    _create_index_if_missing("reasoning_jobs", op.f("ix_reasoning_jobs_run_id"), ["run_id"])
    _create_index_if_missing(
        "reasoning_jobs", op.f("ix_reasoning_jobs_template_id"), ["template_id"]
    )
    _create_index_if_missing(
        "reasoning_jobs", op.f("ix_reasoning_jobs_execution_mode"), ["execution_mode"]
    )
    _create_index_if_missing("reasoning_jobs", op.f("ix_reasoning_jobs_status"), ["status"])
    _create_index_if_missing(
        "reasoning_jobs", op.f("ix_reasoning_jobs_claim_token"), ["claim_token"]
    )
    _create_index_if_missing("reasoning_jobs", op.f("ix_reasoning_jobs_created_at"), ["created_at"])
    _create_index_if_missing("reasoning_jobs", op.f("ix_reasoning_jobs_updated_at"), ["updated_at"])

    if not _has_table("reasoning_artifacts"):
        op.create_table(
            "reasoning_artifacts",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("job_id", sa.UUID(), nullable=False),
            sa.Column("role", sa.String(length=120), nullable=False),
            sa.Column("kind", sa.String(length=120), nullable=False),
            sa.Column("storage_backend", sa.String(length=64), nullable=False),
            sa.Column("storage_uri", sa.Text(), nullable=True),
            sa.Column("local_path", sa.Text(), nullable=True),
            sa.Column("filename", sa.String(length=255), nullable=False),
            sa.Column("content_type", sa.String(length=255), nullable=True),
            sa.Column("size_bytes", sa.Integer(), nullable=True),
            sa.Column("sha256", sa.String(length=64), nullable=True),
            sa.Column("extra_metadata", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["job_id"], ["reasoning_jobs.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    _create_index_if_missing(
        "reasoning_artifacts", op.f("ix_reasoning_artifacts_job_id"), ["job_id"]
    )
    _create_index_if_missing("reasoning_artifacts", op.f("ix_reasoning_artifacts_role"), ["role"])
    _create_index_if_missing("reasoning_artifacts", op.f("ix_reasoning_artifacts_kind"), ["kind"])
    _create_index_if_missing(
        "reasoning_artifacts", op.f("ix_reasoning_artifacts_storage_backend"), ["storage_backend"]
    )
    _create_index_if_missing(
        "reasoning_artifacts", op.f("ix_reasoning_artifacts_sha256"), ["sha256"]
    )
    _create_index_if_missing(
        "reasoning_artifacts", op.f("ix_reasoning_artifacts_created_at"), ["created_at"]
    )


def downgrade() -> None:
    if _has_table("reasoning_artifacts"):
        op.drop_table("reasoning_artifacts")
    if _has_table("reasoning_jobs"):
        op.drop_table("reasoning_jobs")
