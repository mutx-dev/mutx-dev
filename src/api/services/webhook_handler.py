"""Outgoing webhook event values and governance payload construction."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional


class WebhookEventType(str, Enum):
    AGENT_STATUS = "agent.status"
    # Legacy alias retained for backwards compatibility.
    AGENT_STATUS_UPDATE = "agent.status_update"
    AGENT_HEARTBEAT = "agent.heartbeat"
    AGENT_ERROR = "agent.error"
    AGENT_STARTED = "agent.started"
    AGENT_STOPPED = "agent.stopped"
    AGENT_CRASHED = "agent.crashed"
    DEPLOYMENT_CREATED = "deployment.created"
    DEPLOYMENT_UPDATED = "deployment.updated"
    DEPLOYMENT_FAILED = "deployment.failed"
    DEPLOYMENT_ROLLED_BACK = "deployment.rolled_back"
    METRICS_REPORT = "metrics.report"
    HEALTH_CHECK = "health.check"
    # Governance events
    GOVERNANCE_DECISION_PERMIT = "governance.decision.permit"
    GOVERNANCE_DECISION_DENY = "governance.decision.deny"
    GOVERNANCE_DECISION_DEFER = "governance.decision.defer"
    GOVERNANCE_PENDING = "governance.pending"
    GOVERNANCE_APPROVED = "governance.approved"
    GOVERNANCE_DENIED = "governance.denied"
    GOVERNANCE_KILLED = "governance.killed"


class WebhookSource(str, Enum):
    AGENT = "agent"
    DEPLOYMENT = "deployment"
    MONITORING = "monitoring"
    GOVERNANCE = "governance"
    EXTERNAL = "external"
    UNKNOWN = "unknown"


def create_governance_decision_payload(
    effect: str,
    agent_id: str,
    tool_id: str,
    rule_id: Optional[str] = None,
    reason_code: Optional[str] = None,
    defer_token: Optional[str] = None,
    latency_ms: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    event_type_map = {
        "PERMIT": WebhookEventType.GOVERNANCE_DECISION_PERMIT.value,
        "DENY": WebhookEventType.GOVERNANCE_DECISION_DENY.value,
        "DEFER": WebhookEventType.GOVERNANCE_DECISION_DEFER.value,
    }
    return {
        "event_type": event_type_map.get(effect, WebhookEventType.GOVERNANCE_DECISION_PERMIT.value),
        "source": WebhookSource.GOVERNANCE.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "data": {
            "effect": effect,
            "tool_id": tool_id,
            "rule_id": rule_id,
            "reason_code": reason_code,
            "defer_token": defer_token,
            "latency_ms": latency_ms,
        },
        "metadata": metadata or {},
    }


def create_governance_pending_payload(
    defer_token: str,
    agent_id: str,
    tool_id: str,
    reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.GOVERNANCE_PENDING.value,
        "source": WebhookSource.GOVERNANCE.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "data": {
            "defer_token": defer_token,
            "tool_id": tool_id,
            "reason": reason,
        },
        "metadata": metadata or {},
    }


def create_governance_approved_payload(
    defer_token: str,
    agent_id: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.GOVERNANCE_APPROVED.value,
        "source": WebhookSource.GOVERNANCE.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "data": {
            "defer_token": defer_token,
        },
        "metadata": metadata or {},
    }


def create_governance_denied_payload(
    defer_token: str,
    agent_id: str,
    reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.GOVERNANCE_DENIED.value,
        "source": WebhookSource.GOVERNANCE.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "data": {
            "defer_token": defer_token,
            "reason": reason,
        },
        "metadata": metadata or {},
    }


def create_governance_killed_payload(
    agent_id: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "event_type": WebhookEventType.GOVERNANCE_KILLED.value,
        "source": WebhookSource.GOVERNANCE.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "data": {},
        "metadata": metadata or {},
    }
