"""
MUTX-native execution checkpoints for autonomy runs.

This module adapts the idea of LACP-style harness checkpoints around high-risk
execution boundaries while staying native to MUTX's existing policy engine and
security primitives. No upstream LACP code is copied here.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Sequence

from src.security.mediator import NormalizedAction
from src.security.policy import (
    PolicyDecision,
    PolicyDecisionResult,
    PolicyEngine,
    PolicyRule,
    PolicySet,
)


PATCH_APPLY_CHECKPOINT = "autonomy.patch.apply"
VALIDATION_RUN_CHECKPOINT = "autonomy.validation.run"
EXECUTOR_POLICY_ID = "mutx-autonomy-execution-checkpoints"
EXECUTOR_POLICY_NAME = "MUTX autonomy execution checkpoints"


def utc_now() -> str:
    return (
        datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )


@dataclass
class ExecutionCheckpointRecord:
    checkpoint: str
    decision: str
    reason: str
    rule_id: str | None
    rule_name: str | None
    metadata: dict[str, Any]
    agent_id: str
    session_id: str
    action_id: str | None
    timestamp: str = field(default_factory=utc_now)

    @classmethod
    def from_decision(
        cls,
        *,
        checkpoint: str,
        decision: PolicyDecisionResult,
        metadata: dict[str, Any],
        agent_id: str,
        session_id: str,
    ) -> "ExecutionCheckpointRecord":
        return cls(
            checkpoint=checkpoint,
            decision=decision.decision.value,
            reason=decision.reason,
            rule_id=decision.rule_id,
            rule_name=decision.rule_name,
            metadata=metadata,
            agent_id=agent_id,
            session_id=session_id,
            action_id=decision.action_id,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "checkpoint": self.checkpoint,
            "decision": self.decision,
            "reason": self.reason,
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "metadata": self.metadata,
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "action_id": self.action_id,
            "timestamp": self.timestamp,
        }


def serialize_checkpoint_records(records: Sequence[ExecutionCheckpointRecord]) -> str:
    payload = [record.to_dict() for record in records]
    return json.dumps(payload, indent=2, sort_keys=True) + "\n"


def build_executor_policy() -> PolicyEngine:
    engine = PolicyEngine()
    policy = PolicySet(
        id=EXECUTOR_POLICY_ID,
        name=EXECUTOR_POLICY_NAME,
        description=(
            "Executor checkpoints for hosted autonomy runs. The gate design is inspired by "
            "open-source LACP harness concepts, but the implementation is MUTX-native."
        ),
        default_decision=PolicyDecision.DENY,
        metadata={
            "upstream_inspiration": "LACP harness concepts",
            "reuse_mode": "conceptual-only",
        },
    )
    policy.add_rule(
        PolicyRule(
            id="allow-patch-apply-checkpoint",
            name="Allow patch-apply checkpoint",
            tool_pattern=PATCH_APPLY_CHECKPOINT,
            action=PolicyDecision.ALLOW,
            priority=10,
            reason="Patch application may proceed once executor limits pass.",
        )
    )
    policy.add_rule(
        PolicyRule(
            id="allow-validation-run-checkpoint",
            name="Allow validation-run checkpoint",
            tool_pattern=VALIDATION_RUN_CHECKPOINT,
            action=PolicyDecision.ALLOW,
            priority=10,
            reason="Validation may proceed once commands satisfy executor policy.",
        )
    )
    engine.add_policy(policy, set_default=True)
    return engine


def _build_action(
    *,
    checkpoint: str,
    tool_args: dict[str, Any],
    agent_id: str,
    session_id: str,
) -> NormalizedAction:
    return NormalizedAction(
        tool_name=checkpoint,
        tool_args=tool_args,
        agent_id=agent_id,
        session_id=session_id,
        trigger="autonomy",
        runtime="mutx-autonomy",
    )


def _deny(
    *,
    action: NormalizedAction,
    rule_id: str,
    rule_name: str,
    reason: str,
) -> PolicyDecisionResult:
    return PolicyDecisionResult(
        decision=PolicyDecision.DENY,
        rule_id=rule_id,
        rule_name=rule_name,
        reason=reason,
        session_id=action.session_id,
        action_id=action.id,
    )


def evaluate_patch_checkpoint(
    *,
    patch_size_bytes: int,
    changed_files: int,
    max_patch_bytes: int,
    max_changed_files: int,
    agent_id: str,
    session_id: str,
) -> tuple[PolicyDecisionResult, ExecutionCheckpointRecord]:
    metadata = {
        "patch_size_bytes": patch_size_bytes,
        "changed_files": changed_files,
        "max_patch_bytes": max_patch_bytes,
        "max_changed_files": max_changed_files,
    }
    action = _build_action(
        checkpoint=PATCH_APPLY_CHECKPOINT,
        tool_args=metadata,
        agent_id=agent_id,
        session_id=session_id,
    )

    if patch_size_bytes > max_patch_bytes:
        decision = _deny(
            action=action,
            rule_id="patch-size-limit",
            rule_name="Patch size limit",
            reason=(
                f"Patch checkpoint denied: {patch_size_bytes} bytes exceeds "
                f"AUTONOMY_MAX_PATCH_BYTES={max_patch_bytes}"
            ),
        )
    elif changed_files > max_changed_files:
        decision = _deny(
            action=action,
            rule_id="patch-file-limit",
            rule_name="Patch file-count limit",
            reason=(
                f"Patch checkpoint denied: {changed_files} changed files exceeds "
                f"AUTONOMY_MAX_CHANGED_FILES={max_changed_files}"
            ),
        )
    else:
        decision = build_executor_policy().evaluate(action)

    return decision, ExecutionCheckpointRecord.from_decision(
        checkpoint=PATCH_APPLY_CHECKPOINT,
        decision=decision,
        metadata=metadata,
        agent_id=agent_id,
        session_id=session_id,
    )


def evaluate_validation_checkpoint(
    *,
    requested_commands: Sequence[str],
    allowed_commands: Sequence[Sequence[str]],
    rejected_commands: Sequence[str],
    max_validation_commands: int,
    agent_id: str,
    session_id: str,
) -> tuple[PolicyDecisionResult, ExecutionCheckpointRecord]:
    metadata = {
        "requested_command_count": len(requested_commands),
        "requested_commands": list(requested_commands),
        "allowed_commands": [" ".join(command) for command in allowed_commands],
        "rejected_commands": list(rejected_commands),
        "max_validation_commands": max_validation_commands,
    }
    action = _build_action(
        checkpoint=VALIDATION_RUN_CHECKPOINT,
        tool_args=metadata,
        agent_id=agent_id,
        session_id=session_id,
    )

    if len(requested_commands) > max_validation_commands:
        decision = _deny(
            action=action,
            rule_id="validation-command-count-limit",
            rule_name="Validation command count limit",
            reason=(
                f"Validation checkpoint denied: {len(requested_commands)} commands exceeds "
                f"the max of {max_validation_commands}"
            ),
        )
    elif rejected_commands:
        decision = _deny(
            action=action,
            rule_id="validation-command-allowlist",
            rule_name="Validation command allowlist",
            reason=(
                f"Validation checkpoint denied: {len(rejected_commands)} command(s) fall "
                "outside the executor allowlist"
            ),
        )
    else:
        decision = build_executor_policy().evaluate(action)

    return decision, ExecutionCheckpointRecord.from_decision(
        checkpoint=VALIDATION_RUN_CHECKPOINT,
        decision=decision,
        metadata=metadata,
        agent_id=agent_id,
        session_id=session_id,
    )
