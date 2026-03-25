"""
MUTX Security Layer - AARM-Compliant Runtime Security for AI Agents.

Based on the AARM (Autonomous Action Runtime Management) specification.
https://github.com/aarm-dev/docs

AARM defines what a runtime security system must do - MUTX implements it.

Components:
- ActionMediator: Intercepts and normalizes tool invocations (R1, R2)
- ContextAccumulator: Tracks session state and intent (R3, R4)
- PolicyEngine: Evaluates actions against policy (R1, R2, R4)
- ApprovalService: Human-in-the-loop for deferred actions (R5)
- ReceiptGenerator: Cryptographic audit receipts (R6)
- TelemetryExporter: SIEM/SOAR integration (R9)

Conformance:
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
https://github.com/aarm-dev/docs/blob/main/LICENSE.txt
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
