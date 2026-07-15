"""
MUTX runtime-security capability modules.

These modules are informed by the AARM specification audited at
aarm-dev/docs@8eff208b98786b2c9a578b26cb7eaca440ec4020. They provide pieces of
the current R1-R9 model, but MUTX has not demonstrated all AARM Core technical
tests or the organizational conditions required for a conformance claim.

Current alignment:
- ActionMediator and PolicyEngine: partial R1 and R3
- ContextAccumulator: partial R2; heuristic only for R7
- PolicyEngine and ApprovalService: partial R4
- ReceiptGenerator: partial R5
- NormalizedAction and API authentication: partial R6
- TelemetryExporter: partial R8
- Least-privilege credential issuance: R9 gap

See docs/legal/aarm-alignment.md for the evidence and remaining gaps.
AARM documentation reference: MIT License, Copyright (c) 2023 Mintlify.
"""

from src.security.mediator import ActionCategory, ActionMediator, NormalizedAction
from src.security.context import ContextAccumulator, IntentSignal, SessionContext
from src.security.policy import PolicyDecision, PolicyDecisionResult, PolicyEngine
from src.security.approvals import ApprovalRequest, ApprovalService
from src.security.receipts import ActionReceipt, ReceiptGenerator
from src.security.telemetry import TelemetryEventType, TelemetryExporter
from src.security.compliance import AARMComplianceChecker

__all__ = [
    "ActionCategory",
    "ActionMediator",
    "NormalizedAction",
    "ContextAccumulator",
    "IntentSignal",
    "SessionContext",
    "PolicyDecision",
    "PolicyDecisionResult",
    "PolicyEngine",
    "ApprovalRequest",
    "ApprovalService",
    "ActionReceipt",
    "ReceiptGenerator",
    "TelemetryEventType",
    "TelemetryExporter",
    "AARMComplianceChecker",
]
