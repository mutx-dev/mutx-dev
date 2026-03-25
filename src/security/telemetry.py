"""
Telemetry Exporter.

Structured events exported to SIEM/SOAR platforms for security monitoring
and incident response.

AARM Requirement: R9 (SHOULD export structured telemetry to security platforms)

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from src.security.mediator import NormalizedAction
from src.security.policy import PolicyDecision, PolicyDecisionResult
from src.security.receipts import ActionReceipt


class TelemetryEventType(str, Enum):
    """Types of security events."""

    ACTION_EVALUATED = "action_evaluated"
    ACTION_ALLOWED = "action_allowed"
    ACTION_DENIED = "action_denied"
    ACTION_DEFERRED = "action_deferred"
    ACTION_EXECUTED = "action_executed"
    ACTION_FAILED = "action_failed"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_APPROVED = "approval_approved"
    APPROVAL_DENIED = "approval_denied"
    APPROVAL_EXPIRED = "approval_expired"
    INTENT_DRIFT_DETECTED = "intent_drift_detected"
    SESSION_CREATED = "session_created"
    SESSION_CLOSED = "session_closed"
    POLICY_VIOLATION = "policy_violation"
    SECURITY_ALERT = "security_alert"


@dataclass
class TelemetryEvent:
    """
    A structured security event for export.

    TelemetryEvent is the canonical format for all security events
    that are exported to external systems.
    """

    event_id: str
    event_type: TelemetryEventType
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    agent_id: str = ""
    session_id: str = ""
    user_id: str = ""

    tool_name: str = ""
    action_id: str = ""
    action_hash: str = ""

    policy_decision: str = ""
    policy_rule_id: Optional[str] = None

    outcome: str = ""
    error: Optional[str] = None

    severity: str = "info"
    category: str = "security"

    metadata: dict[str, Any] = field(default_factory=dict)

    workspace_id: str = ""

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["event_type"] = self.event_type.value
        d["timestamp"] = self.timestamp.isoformat()
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


@dataclass
class GovernanceMetrics:
    """
    Governance metrics for Prometheus export.

    These metrics track the overall health and activity of the
    governance system.
    """

    total_evaluations: int = 0
    total_permits: int = 0
    total_denials: int = 0
    total_defers: int = 0
    total_approvals: int = 0
    total_rejections: int = 0
    pending_approvals: int = 0

    intent_drifts_detected: int = 0
    sessions_active: int = 0

    avg_decision_latency_ms: float = 0.0
    decisions_last_minute: int = 0
    decisions_last_hour: int = 0

    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_prometheus(self) -> str:
        """Format metrics for Prometheus /metrics endpoint."""
        lines = [
            "# HELP mutx_governance_evaluations_total Total policy evaluations",
            "# TYPE mutx_governance_evaluations_total counter",
            f"mutx_governance_evaluations_total {self.total_evaluations}",
            "",
            "# HELP mutx_governance_decisions_total Policy decisions by type",
            "# TYPE mutx_governance_decisions_total counter",
            f'mutx_governance_decisions_total{{decision="permit"}} {self.total_permits}',
            f'mutx_governance_decisions_total{{decision="deny"}} {self.total_denials}',
            f'mutx_governance_decisions_total{{decision="defer"}} {self.total_defers}',
            "",
            "# HELP mutx_governance_approvals_total Approval workflow outcomes",
            "# TYPE mutx_governance_approvals_total counter",
            f'mutx_governance_approvals_total{{outcome="approved"}} {self.total_approvals}',
            f'mutx_governance_approvals_total{{outcome="rejected"}} {self.total_rejections}',
            f"mutx_governance_pending_approvals {self.pending_approvals}",
            "",
            "# HELP mutx_governance_intent_drifts_total Intent drift detections",
            "# TYPE mutx_governance_intent_drifts_total counter",
            f"mutx_governance_intent_drifts_total {self.intent_drifts_detected}",
            "",
            "# HELP mutx_governance_active_sessions Current active sessions",
            "# TYPE mutx_governance_active_sessions gauge",
            f"mutx_governance_active_sessions {self.sessions_active}",
            "",
            "# HELP mutx_governance_decision_latency_ms Average decision latency",
            "# TYPE mutx_governance_decision_latency_ms gauge",
            f"mutx_governance_decision_latency_ms {self.avg_decision_latency_ms}",
            "",
            "# HELP mutx_governance_decision_rate Decisions per time window",
            "# TYPE mutx_governance_decision_rate gauge",
            f'mutx_governance_decision_rate{{window="minute"}} {self.decisions_last_minute}',
            f'mutx_governance_decision_rate{{window="hour"}} {self.decisions_last_hour}',
            "",
            f"# Generated at {self.timestamp.isoformat()}",
        ]
        return "\n".join(lines)


class TelemetryExporter:
    """
    Exports security telemetry to external systems.

    The TelemetryExporter provides:
    1. Structured event export to SIEM/SOAR platforms
    2. Prometheus-compatible metrics endpoint
    3. Integration with common observability platforms

    Usage:
        exporter = TelemetryExporter()

        # Add exporters
        exporter.add_siem_exporter(SIEMClient(...))
        exporter.add_webhook_exporter("https://alertmanager.example.com/webhook")

        # Export events
        exporter.export_security_event(
            event_type=TelemetryEventType.ACTION_DENIED,
            action=action,
            decision=decision,
            receipt=receipt,
        )

        # Get Prometheus metrics
        metrics = exporter.get_prometheus_metrics()
    """

    def __init__(self):
        self._metrics = GovernanceMetrics()
        self._siem_exporters: list[callable] = []
        self._webhook_exporters: list[str] = []
        self._log_exporters: list[logging.Logger] = []

        self._event_queue: list[TelemetryEvent] = []
        self._max_queue_size: int = 10000

        self._decision_timestamps: list[datetime] = []
        self._decision_latencies: list[float] = []

    def add_siem_exporter(self, exporter: callable) -> None:
        """Add a SIEM exporter function."""
        self._siem_exporters.append(exporter)

    def add_webhook_exporter(self, url: str) -> None:
        """Add a webhook URL for event export."""
        self._webhook_exporters.append(url)

    def add_log_exporter(self, logger: logging.Logger) -> None:
        """Add a logger for event export."""
        self._log_exporters.append(logger)

    def export_security_event(
        self,
        event_type: TelemetryEventType,
        action: NormalizedAction,
        decision: PolicyDecisionResult,
        receipt: Optional[ActionReceipt] = None,
        error: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> TelemetryEvent:
        """
        Export a security event.

        Args:
            event_type: Type of event
            action: The action that was evaluated
            decision: Policy decision result
            receipt: Optional receipt for audit
            error: Optional error message
            metadata: Additional metadata

        Returns:
            The created TelemetryEvent
        """
        severity = self._determine_severity(event_type, decision)

        event = TelemetryEvent(
            event_id=f"{event_type.value}-{action.id}",
            event_type=event_type,
            agent_id=action.agent_id,
            session_id=action.session_id,
            user_id=action.user_id,
            tool_name=action.tool_name,
            action_id=action.id,
            action_hash=action.action_hash,
            policy_decision=decision.decision.value,
            policy_rule_id=decision.rule_id,
            outcome=decision.reason,
            error=error,
            severity=severity,
            metadata=metadata or {},
        )

        self._queue_event(event)
        self._update_metrics(event_type, decision)

        return event

    def export_approval_event(
        self,
        event_type: TelemetryEventType,
        request_id: str,
        token: str,
        reviewer: str,
        tool_name: str,
        agent_id: str,
        session_id: str,
        comment: str = "",
    ) -> TelemetryEvent:
        """Export an approval-related event."""
        event = TelemetryEvent(
            event_id=f"{event_type.value}-{request_id}",
            event_type=event_type,
            agent_id=agent_id,
            session_id=session_id,
            tool_name=tool_name,
            metadata={
                "request_id": request_id,
                "token": token,
                "reviewer": reviewer,
                "comment": comment,
            },
        )

        self._queue_event(event)
        return event

    def export_intent_drift_event(
        self,
        session_id: str,
        agent_id: str,
        drift_score: float,
        context_snapshot: dict[str, Any],
    ) -> TelemetryEvent:
        """Export an intent drift detection event."""
        event = TelemetryEvent(
            event_id=f"intent_drift-{session_id}",
            event_type=TelemetryEventType.INTENT_DRIFT_DETECTED,
            agent_id=agent_id,
            session_id=session_id,
            severity="warning",
            metadata={
                "drift_score": drift_score,
                "context_snapshot": context_snapshot,
            },
        )

        self._queue_event(event)
        self._metrics.intent_drifts_detected += 1

        return event

    def _queue_event(self, event: TelemetryEvent) -> None:
        """Add event to queue and flush if needed."""
        self._event_queue.append(event)

        if len(self._event_queue) >= self._max_queue_size:
            self._flush_queue()

    def _flush_queue(self) -> None:
        """Flush queued events to all exporters."""
        events = self._event_queue
        self._event_queue = []

        for event in events:
            for siem in self._siem_exporters:
                try:
                    siem(event)
                except Exception:
                    pass

            for logger in self._log_exporters:
                logger.info(event.to_json())

    def _update_metrics(
        self, event_type: TelemetryEventType, decision: PolicyDecisionResult
    ) -> None:
        """Update governance metrics."""
        self._metrics.total_evaluations += 1
        self._decision_timestamps.append(datetime.now(timezone.utc))

        if decision.decision == PolicyDecision.ALLOW:
            self._metrics.total_permits += 1
        elif decision.decision == PolicyDecision.DENY:
            self._metrics.total_denials += 1
        elif decision.decision == PolicyDecision.DEFER:
            self._metrics.total_defers += 1

        if event_type == TelemetryEventType.APPROVAL_APPROVED:
            self._metrics.total_approvals += 1
        elif event_type == TelemetryEventType.APPROVAL_DENIED:
            self._metrics.total_rejections += 1

        now = datetime.now(timezone.utc)
        self._decision_timestamps = [
            ts for ts in self._decision_timestamps if (now - ts).total_seconds() < 3600
        ]

        self._metrics.decisions_last_minute = len(
            [ts for ts in self._decision_timestamps if (now - ts).total_seconds() < 60]
        )
        self._metrics.decisions_last_hour = len(self._decision_timestamps)

        if self._decision_latencies:
            self._metrics.avg_decision_latency_ms = sum(self._decision_latencies) / len(
                self._decision_latencies
            )

    def _determine_severity(
        self, event_type: TelemetryEventType, decision: PolicyDecisionResult
    ) -> str:
        """Determine event severity."""
        if event_type in (
            TelemetryEventType.SECURITY_ALERT,
            TelemetryEventType.POLICY_VIOLATION,
        ):
            return "critical"
        if event_type == TelemetryEventType.ACTION_DENIED:
            return "warning"
        if event_type == TelemetryEventType.INTENT_DRIFT_DETECTED:
            return "warning"
        if decision.decision == PolicyDecision.DENY:
            return "warning"
        return "info"

    def get_prometheus_metrics(self) -> str:
        """Get metrics in Prometheus format."""
        self._metrics.timestamp = datetime.now(timezone.utc)
        return self._metrics.to_prometheus()

    def get_metrics_summary(self) -> dict[str, Any]:
        """Get metrics as a dictionary."""
        return {
            "total_evaluations": self._metrics.total_evaluations,
            "permits": self._metrics.total_permits,
            "denials": self._metrics.total_denials,
            "defers": self._metrics.total_defers,
            "pending_approvals": self._metrics.pending_approvals,
            "intent_drifts": self._metrics.intent_drifts_detected,
            "active_sessions": self._metrics.sessions_active,
            "avg_latency_ms": self._metrics.avg_decision_latency_ms,
            "decisions_per_minute": self._metrics.decisions_last_minute,
            "decisions_per_hour": self._metrics.decisions_last_hour,
        }

    def set_active_sessions(self, count: int) -> None:
        """Set the number of active sessions."""
        self._metrics.sessions_active = count

    def set_pending_approvals(self, count: int) -> None:
        """Set the number of pending approvals."""
        self._metrics.pending_approvals = count

    def record_decision_latency(self, latency_ms: float) -> None:
        """Record a decision latency for averaging."""
        self._decision_latencies.append(latency_ms)
        if len(self._decision_latencies) > 1000:
            self._decision_latencies = self._decision_latencies[-1000:]
