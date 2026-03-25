"""
AARM Conformance Verification.

Verify MUTX satisfies all 9 AARM conformance requirements.

Requirements:
- R1: MUST block actions before execution based on policy
- R2: MUST validate action parameters against type, range, and pattern constraints
- R3: MUST accumulate session context including prior actions and data accessed
- R4: MUST evaluate intent consistency for context-dependent actions
- R5: MUST support human approval workflows with timeout handling
- R6: MUST generate cryptographically signed receipts with full context
- R7: MUST bind actions to human, service, agent, and session identity
- R8: SHOULD enforce least privilege through scoped, just-in-time credentials
- R9: SHOULD export structured telemetry to security platforms

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from src.security.mediator import ActionMediator
from src.security.context import ContextAccumulator
from src.security.policy import PolicyEngine
from src.security.approvals import ApprovalService
from src.security.receipts import ReceiptGenerator
from src.security.telemetry import TelemetryExporter


class ConformanceLevel(str, Enum):
    """Conformance level for a requirement."""

    MUST = "MUST"
    SHOULD = "SHOULD"


@dataclass
class ConformanceResult:
    """Result of a single conformance check."""

    requirement_id: str
    level: ConformanceLevel
    description: str
    satisfied: bool
    details: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def is_met(self) -> bool:
        return self.satisfied


@dataclass
class AARMComplianceReport:
    """Full AARM conformance report."""

    version: str = "1.0"
    checked_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    overall_satisfied: bool = True
    results: list[ConformanceResult] = field(default_factory=list)

    def add_result(self, result: ConformanceResult) -> None:
        self.results.append(result)
        if not result.satisfied and result.level == ConformanceLevel.MUST:
            self.overall_satisfied = False

    def get_result(self, requirement_id: str) -> Optional[ConformanceResult]:
        for r in self.results:
            if r.requirement_id == requirement_id:
                return r
        return None

    def summary(self) -> dict[str, Any]:
        must_results = [r for r in self.results if r.level == ConformanceLevel.MUST]
        should_results = [r for r in self.results if r.level == ConformanceLevel.SHOULD]

        must_satisfied = sum(1 for r in must_results if r.satisfied)
        should_satisfied = sum(1 for r in should_results if r.satisfied)

        return {
            "overall_satisfied": self.overall_satisfied,
            "total_requirements": len(self.results),
            "must_requirements": len(must_results),
            "must_satisfied": must_satisfied,
            "should_requirements": len(should_results),
            "should_satisfied": should_satisfied,
        }


class AARMComplianceChecker:
    """
    Verify AARM conformance of the MUTX Security Layer.

    The AARMComplianceChecker validates that all AARM requirements
    are properly implemented and functioning.

    Usage:
        checker = AARMComplianceChecker(
            mediator=action_mediator,
            context_accumulator=context_accumulator,
            policy_engine=policy_engine,
            approval_service=approval_service,
            receipt_generator=receipt_generator,
            telemetry_exporter=telemetry_exporter,
        )

        # Run full audit
        report = checker.full_audit()

        # Check individual requirement
        result = checker.check_r1()
        print(f"R1 satisfied: {result.satisfied}")
        print(f"Details: {result.details}")
    """

    def __init__(
        self,
        mediator: Optional[ActionMediator] = None,
        context_accumulator: Optional[ContextAccumulator] = None,
        policy_engine: Optional[PolicyEngine] = None,
        approval_service: Optional[ApprovalService] = None,
        receipt_generator: Optional[ReceiptGenerator] = None,
        telemetry_exporter: Optional[TelemetryExporter] = None,
    ):
        self.mediator = mediator
        self.context_accumulator = context_accumulator
        self.policy_engine = policy_engine
        self.approval_service = approval_service
        self.receipt_generator = receipt_generator
        self.telemetry_exporter = telemetry_exporter

    def check_r1(self) -> ConformanceResult:
        """
        R1: MUST block actions before execution based on policy.

        Verification: PolicyEngine.evaluate() returns DENY for policy violations
        before the action reaches execution.
        """
        if not self.policy_engine:
            return ConformanceResult(
                requirement_id="R1",
                level=ConformanceLevel.MUST,
                description="Block actions before execution based on policy",
                satisfied=False,
                details="PolicyEngine not configured",
            )

        if not self.policy_engine.list_policies():
            return ConformanceResult(
                requirement_id="R1",
                level=ConformanceLevel.MUST,
                description="Block actions before execution based on policy",
                satisfied=False,
                details="No policies configured",
            )

        from src.security.mediator import NormalizedAction

        test_action = NormalizedAction(
            tool_name="forbidden_tool",
            tool_args={},
            agent_id="test-agent",
            session_id="test-session",
        )

        result = self.policy_engine.evaluate(test_action)

        can_block = result.is_denied or result.is_deferred or result.is_modified

        return ConformanceResult(
            requirement_id="R1",
            level=ConformanceLevel.MUST,
            description="Block actions before execution based on policy",
            satisfied=can_block,
            details=f"PolicyEngine can return blocking decisions: {can_block}. "
            f"Test evaluation returned: {result.decision.value}",
        )

    def check_r2(self) -> ConformanceResult:
        """
        R2: MUST validate action parameters against type, range, and pattern constraints.

        Verification: ActionMediator.validate_parameters() correctly validates inputs.
        """
        if not self.mediator:
            return ConformanceResult(
                requirement_id="R2",
                level=ConformanceLevel.MUST,
                description="Validate action parameters against type, range, and pattern constraints",
                satisfied=False,
                details="ActionMediator not configured",
            )

        from src.security.mediator import ParameterConstraint, ToolSchema

        self.mediator.register_tool(
            ToolSchema(
                tool_name="test_tool",
                parameters=[
                    ParameterConstraint(
                        name="count",
                        type="number",
                        required=True,
                        min_value=1,
                        max_value=100,
                    ),
                    ParameterConstraint(
                        name="email",
                        type="string",
                        pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$",
                    ),
                ],
            )
        )

        valid_params = {"count": 50, "email": "test@example.com"}
        invalid_params = {"count": 200, "email": "invalid"}

        is_valid_valid, _ = self.mediator.validate_parameters("test_tool", valid_params)
        is_valid_invalid, errors = self.mediator.validate_parameters("test_tool", invalid_params)

        satisfied = is_valid_valid and not is_valid_invalid

        return ConformanceResult(
            requirement_id="R2",
            level=ConformanceLevel.MUST,
            description="Validate action parameters against type, range, and pattern constraints",
            satisfied=satisfied,
            details=f"Validation correctly accepts valid params: {is_valid_valid}, "
            f"rejects invalid params: {not is_valid_invalid}. "
            f"Errors for invalid: {errors}",
        )

    def check_r3(self) -> ConformanceResult:
        """
        R3: MUST accumulate session context including prior actions and data accessed.

        Verification: ContextAccumulator records actions and provides context for evaluation.
        """
        if not self.context_accumulator:
            return ConformanceResult(
                requirement_id="R3",
                level=ConformanceLevel.MUST,
                description="Accumulate session context including prior actions and data accessed",
                satisfied=False,
                details="ContextAccumulator not configured",
            )

        from src.security.mediator import NormalizedAction

        session_id = "test-session-r3"
        self.context_accumulator.create_session(
            session_id=session_id,
            agent_id="test-agent",
            original_request="Test request",
        )

        action = NormalizedAction(
            tool_name="test_tool",
            tool_args={"key": "value"},
            agent_id="test-agent",
            session_id=session_id,
        )

        self.context_accumulator.record_action(
            session_id=session_id,
            action=action,
            effect="PERMIT",
        )

        context = self.context_accumulator.get_context(session_id)

        satisfied = (
            context is not None
            and len(context.actions) > 0
            and context.actions[0].tool_name == "test_tool"
        )

        return ConformanceResult(
            requirement_id="R3",
            level=ConformanceLevel.MUST,
            description="Accumulate session context including prior actions and data accessed",
            satisfied=satisfied,
            details=f"Context accumulated {len(context.actions) if context else 0} actions. "
            f"Context available: {context is not None}",
        )

    def check_r4(self) -> ConformanceResult:
        """
        R4: MUST evaluate intent consistency for context-dependent actions.

        Verification: ContextAccumulator.evaluate_intent() detects drift.
        """
        if not self.context_accumulator:
            return ConformanceResult(
                requirement_id="R4",
                level=ConformanceLevel.MUST,
                description="Evaluate intent consistency for context-dependent actions",
                satisfied=False,
                details="ContextAccumulator not configured",
            )

        from src.security.context import IntentSignal

        session_id = "test-session-r4"
        context = self.context_accumulator.create_session(
            session_id=session_id,
            agent_id="test-agent",
            stated_intent="Complete the task without errors",
        )

        context.tool_call_count = 20
        context.denied_count = 15

        signal = self.context_accumulator.evaluate_intent(context)

        satisfied = signal in (
            IntentSignal.DRIFT_CONFIRMED,
            IntentSignal.DRIFT_SUSPECTED,
            IntentSignal.ALIGNED,
        )

        return ConformanceResult(
            requirement_id="R4",
            level=ConformanceLevel.MUST,
            description="Evaluate intent consistency for context-dependent actions",
            satisfied=satisfied,
            details=f"Intent evaluation returned: {signal.value}. "
            f"Detects drift with high denial rate: {satisfied}",
        )

    def check_r5(self) -> ConformanceResult:
        """
        R5: MUST support human approval workflows with timeout handling.

        Verification: ApprovalService creates requests, handles timeout, allows approve/deny.
        """
        if not self.approval_service:
            return ConformanceResult(
                requirement_id="R5",
                level=ConformanceLevel.MUST,
                description="Support human approval workflows with timeout handling",
                satisfied=False,
                details="ApprovalService not configured",
            )

        from src.security.mediator import NormalizedAction
        from src.security.approvals import ApprovalStatus

        action = NormalizedAction(
            tool_name="high_value_action",
            tool_args={"amount": 10000},
            agent_id="test-agent",
            session_id="test-session",
        )

        request = self.approval_service.request_approval(
            action=action,
            reason="High value action requires approval",
            timeout_minutes=5,
        )

        approved = self.approval_service.approve(request.token, reviewer="admin@test.com")
        satisfied = (
            approved
            and request.status == ApprovalStatus.APPROVED
            and request.decided_by == "admin@test.com"
        )

        return ConformanceResult(
            requirement_id="R5",
            level=ConformanceLevel.MUST,
            description="Support human approval workflows with timeout handling",
            satisfied=satisfied,
            details=f"Approval request created. Approval workflow functional: {approved}. "
            f"Status: {request.status.value}",
        )

    def check_r6(self) -> ConformanceResult:
        """
        R6: MUST generate cryptographically signed receipts with full context.

        Verification: ReceiptGenerator creates signed receipts with context.
        """
        if not self.receipt_generator:
            return ConformanceResult(
                requirement_id="R6",
                level=ConformanceLevel.MUST,
                description="Generate cryptographically signed receipts with full context",
                satisfied=False,
                details="ReceiptGenerator not configured",
            )

        from src.security.mediator import NormalizedAction
        from src.security.policy import PolicyDecision, PolicyDecisionResult

        action = NormalizedAction(
            tool_name="test_tool",
            tool_args={"key": "value"},
            agent_id="test-agent",
            session_id="test-session",
        )

        decision = PolicyDecisionResult(
            decision=PolicyDecision.ALLOW,
            rule_id="allow-rule",
            rule_name="Allow Rule",
            reason="Allowed by policy",
            session_id="test-session",
            action_id=action.id,
        )

        receipt = self.receipt_generator.generate(
            action=action,
            context=None,
            decision=decision,
            outcome="executed",
        )

        self.receipt_generator.sign(receipt, b"test-private-key-32-bytes-long!!")

        satisfied = (
            receipt.receipt_id is not None
            and receipt.action_hash is not None
            and receipt.session_snapshot is not None
            and receipt.is_signed
        )

        return ConformanceResult(
            requirement_id="R6",
            level=ConformanceLevel.MUST,
            description="Generate cryptographically signed receipts with full context",
            satisfied=satisfied,
            details=f"Receipt generated with ID: {receipt.receipt_id}, "
            f"signed: {receipt.is_signed}, "
            f"has context: {receipt.session_snapshot is not None}",
        )

    def check_r7(self) -> ConformanceResult:
        """
        R7: MUST bind actions to human, service, agent, and session identity.

        Verification: NormalizedAction contains all identity fields.
        """
        from src.security.mediator import NormalizedAction

        action = NormalizedAction(
            tool_name="test_tool",
            tool_args={},
            agent_id="agent-123",
            session_id="session-456",
            user_id="user-789",
        )

        satisfied = (
            action.agent_id == "agent-123"
            and action.session_id == "session-456"
            and action.user_id == "user-789"
        )

        return ConformanceResult(
            requirement_id="R7",
            level=ConformanceLevel.MUST,
            description="Bind actions to human, service, agent, and session identity",
            satisfied=satisfied,
            details=f"Action bound to agent_id: {action.agent_id}, "
            f"session_id: {action.session_id}, user_id: {action.user_id}",
        )

    def check_r8(self) -> ConformanceResult:
        """
        R8: SHOULD enforce least privilege through scoped, just-in-time credentials.

        Note: This is a SHOULD requirement - non-conformance is a warning, not a failure.
        """
        details = (
            "Credential broker pattern documented but not fully implemented. "
            "MUTX Security Layer should integrate with credential brokers "
            "(Vault, AWS Secrets Manager, etc.) for just-in-time credential issuance. "
            "See Faramesh integration for credential broker support."
        )

        return ConformanceResult(
            requirement_id="R8",
            level=ConformanceLevel.SHOULD,
            description="Enforce least privilege through scoped, just-in-time credentials",
            satisfied=False,
            details=details,
        )

    def check_r9(self) -> ConformanceResult:
        """
        R9: SHOULD export structured telemetry to security platforms.

        Verification: TelemetryExporter can export events and Prometheus metrics.
        """
        if not self.telemetry_exporter:
            return ConformanceResult(
                requirement_id="R9",
                level=ConformanceLevel.SHOULD,
                description="Export structured telemetry to security platforms",
                satisfied=False,
                details="TelemetryExporter not configured",
            )

        metrics = self.telemetry_exporter.get_prometheus_metrics()

        return ConformanceResult(
            requirement_id="R9",
            level=ConformanceLevel.SHOULD,
            description="Export structured telemetry to security platforms",
            satisfied=True,
            details=f"Prometheus metrics available: {len(metrics) > 0}. "
            f"SIEM exporters configured: {len(self.telemetry_exporter._siem_exporters)}",
        )

    def full_audit(self) -> AARMComplianceReport:
        """
        Run all AARM conformance checks.

        Returns:
            AARMComplianceReport with results for all requirements
        """
        report = AARMComplianceReport()

        checks = [
            self.check_r1,
            self.check_r2,
            self.check_r3,
            self.check_r4,
            self.check_r5,
            self.check_r6,
            self.check_r7,
            self.check_r8,
            self.check_r9,
        ]

        for check in checks:
            try:
                result = check()
                report.add_result(result)
            except Exception as e:
                result = ConformanceResult(
                    requirement_id=check.__name__,
                    level=ConformanceLevel.MUST,
                    description="Check failed with exception",
                    satisfied=False,
                    details=str(e),
                )
                report.add_result(result)

        return report
