from __future__ import annotations

from dataclasses import dataclass, field

from cli.services.models import AgentRecord, DeploymentRecord


SEVERITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "healthy": 4,
}

STATUS_ORDER = {
    "failed": 0,
    "stale": 1,
    "degraded": 2,
    "deploying": 3,
    "client_required": 4,
    "healthy": 5,
    "unknown": 6,
}


@dataclass(slots=True)
class SessionRecord:
    id: str
    key: str
    assistant_id: str
    workspace: str
    channel: str
    age: str
    model: str
    tokens: str
    source: str
    active: bool
    last_activity: int
    managed_by_mutx: bool
    agent_id: str | None = None
    kind: str = "unknown"
    session_label: str | None = None


@dataclass(slots=True)
class WorkspaceRecord:
    id: str
    name: str
    assistant_id: str
    workspace: str
    status: str
    managed_by_mutx: bool
    managed_label: str
    gateway_status: str
    session_count: int
    last_activity: int
    last_activity_label: str
    incident_severity: str
    incident_summary: str
    agent_id: str | None = None
    agent_status: str = "unknown"
    deployment_status: str | None = None
    deployment_id: str | None = None
    latest_error: str | None = None
    default_session_key: str | None = None
    default_session_id: str | None = None
    channels: list[str] = field(default_factory=list)
    governance_pending: int = 0
    recent_run_count: int = 0
    agent: AgentRecord | None = None
    latest_deployment: DeploymentRecord | None = None
    binding: dict[str, object] = field(default_factory=dict)


@dataclass(slots=True)
class IncidentRecord:
    id: str
    severity: str
    title: str
    summary: str
    assistant_id: str
    workspace_id: str
    workspace_name: str
    status: str
    session_count: int
    agent_id: str | None = None
    deployment_id: str | None = None
    incident_type: str = "workspace"


@dataclass(slots=True)
class WorkspaceInspectorRecord:
    workspace: WorkspaceRecord
    summary: str
    activity: str
    logs: str
    events: str
    actions: str


@dataclass(slots=True)
class CockpitSnapshot:
    runtime_snapshot: dict[str, object]
    onboarding: dict[str, object]
    assistant_name: str | None
    workspaces: list[WorkspaceRecord]
    incidents: list[IncidentRecord]
    sessions: list[SessionRecord]
    deployments: list[DeploymentRecord]
    governance_pending_total: int = 0
    governance_decisions_total: int = 0
    gateway_status: str = "unknown"


@dataclass(slots=True)
class SelectionContext:
    workspace_id: str | None = None
    incident_id: str | None = None
    session_id: str | None = None
    deployment_id: str | None = None
