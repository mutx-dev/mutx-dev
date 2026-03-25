"""
MUTX Observability SQLAlchemy Models.

SQLAlchemy ORM models for the MUTX Observability layer.
These persist MutxRun, MutxStep, MutxCost, MutxProvenance, and MutxEval records.

Based on the agent-run open standard for agent observability.
https://github.com/builderz-labs/agent-run

MIT License - Copyright (c) 2024 builderz-labs
https://github.com/builderz-labs/agent-run/blob/main/LICENSE
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.api.database import Base


class MutxRun(Base):
    """
    A single execution of an AI agent - the atomic unit of agent observability.

    This is the MUTX-native rebranding of the agent-run AgentRun schema.
    """

    __tablename__ = "mutx_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    agent_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    runtime: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    runtime_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    trigger: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    parent_run_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    task_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending", index=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tools_available: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    git_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    git_commit: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    workspace_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    run_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON object
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    steps: Mapped[list["MutxStep"]] = relationship(
        "MutxStep",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="MutxStep.started_at",
    )
    provenance: Mapped[Optional["MutxProvenance"]] = relationship(
        "MutxProvenance", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )
    cost: Mapped[Optional["MutxCost"]] = relationship(
        "MutxCost", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )
    eval_result: Mapped[Optional["MutxEvalResult"]] = relationship(
        "MutxEvalResult", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_mutx_runs_user_status", "user_id", "status"),
        Index("ix_mutx_runs_user_started", "user_id", "started_at"),
    )


class MutxStep(Base):
    """
    A single step within an agent run - reasoning, tool call, tool result, message, error, or handoff.
    """

    __tablename__ = "mutx_steps"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("mutx_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tool_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    mcp_server: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    input_preview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_preview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    success: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    step_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON object
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped["MutxRun"] = relationship("MutxRun", back_populates="steps")

    __table_args__ = (Index("ix_mutx_steps_run_sequence", "run_id", "sequence"),)


class MutxCost(Base):
    """Token usage and cost attribution for a run."""

    __tablename__ = "mutx_costs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("mutx_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cache_read_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cache_write_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped["MutxRun"] = relationship("MutxRun", back_populates="cost")


class MutxProvenance(Base):
    """
    Cryptographic provenance record - proves how an output was produced.

    Contains SHA-256 hash chain for audit trail, optionally signed with Ed25519.
    """

    __tablename__ = "mutx_provenance"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("mutx_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    run_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    parent_run_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    lineage: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of hashes
    model_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    config_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    runtime: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    signed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Ed25519 signature
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped["MutxRun"] = relationship("MutxRun", back_populates="provenance")


class MutxEvalResult(Base):
    """
    Evaluation result for a scored agent run.

    Tracks pass/fail, score 0-100, metrics, and regression detection.
    """

    __tablename__ = "mutx_eval_results"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("mutx_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    task_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    eval_layer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    eval_pass: Mapped[bool] = mapped_column(Boolean, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    expected_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actual_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON object
    regression_from: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    benchmark_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped["MutxRun"] = relationship("MutxRun", back_populates="eval_result")

    __table_args__ = (Index("ix_mutx_eval_results_run_pass", "run_id", "eval_pass"),)
