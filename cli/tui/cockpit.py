from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Iterable

from cli.personal_assistant import slugify_assistant_id
from cli.services.models import AgentRecord, DeploymentRecord
from cli.tui.models import (
    CockpitSnapshot,
    IncidentRecord,
    SEVERITY_ORDER,
    STATUS_ORDER,
    SessionRecord,
    WorkspaceRecord,
)


def _safe_str(value: object | None) -> str:
    if value is None:
        return ""
    return str(value)


def _parse_timestamp_ms(value: object | None) -> int:
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip()
    if not text:
        return 0
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return 0
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return int(parsed.timestamp() * 1000)


def _assistant_id_from_agent(agent: AgentRecord) -> str | None:
    if agent.type != "openclaw":
        return None
    if isinstance(agent.config, dict):
        configured = str(agent.config.get("assistant_id") or "").strip()
        if configured:
            return configured
    return slugify_assistant_id(agent.name)


def _workspace_name(binding: dict[str, object], agent: AgentRecord | None) -> str:
    if agent is not None and agent.name.strip():
        return agent.name
    assistant_name = _safe_str(binding.get("assistant_name")).strip()
    if assistant_name:
        return assistant_name
    assistant_id = _safe_str(binding.get("assistant_id")).strip()
    return assistant_id or "OpenClaw Workspace"


def _workspace_status(
    *,
    gateway_status: str,
    deployment_status: str | None,
    agent_status: str,
    latest_error: str | None,
) -> str:
    gateway = gateway_status.strip().lower()
    deployment = (deployment_status or "").strip().lower()
    agent = agent_status.strip().lower()
    error = (latest_error or "").strip().lower()

    if "heartbeat" in error and "timeout" in error:
        return "stale"
    if deployment == "failed" or agent == "failed":
        return "failed"
    if deployment == "deploying":
        return "deploying"
    if gateway in {"client_required"}:
        return "client_required"
    if gateway in {"degraded", "needs_onboard", "stopped"}:
        return "degraded"
    if gateway in {"healthy", "running"}:
        return "healthy"
    return "unknown"


def _incident_severity(
    *,
    status: str,
    latest_error: str | None,
    governance_pending: int,
) -> str:
    normalized = status.strip().lower()
    if normalized in {"failed", "stale"}:
        return "critical"
    if normalized in {"degraded", "client_required"}:
        return "high"
    if governance_pending > 0:
        return "medium"
    if latest_error:
        return "low"
    return "healthy"


def _incident_summary(
    *,
    status: str,
    latest_error: str | None,
    governance_pending: int,
    session_count: int,
) -> str:
    normalized = status.strip().lower()
    if normalized == "stale":
        return "Heartbeat stalled on the latest deployment."
    if normalized == "failed":
        return latest_error or "Latest deployment failed."
    if normalized == "deploying":
        return "Deployment is still rolling out."
    if normalized in {"degraded", "client_required"}:
        return "Gateway requires operator attention."
    if governance_pending > 0:
        suffix = "s" if governance_pending != 1 else ""
        return f"{governance_pending} governance approval{suffix} pending."
    if session_count > 0:
        return "Operator activity detected."
    return "No active incidents."


def _sort_workspaces(workspaces: Iterable[WorkspaceRecord]) -> list[WorkspaceRecord]:
    return sorted(
        workspaces,
        key=lambda item: (
            SEVERITY_ORDER.get(item.incident_severity, 99),
            STATUS_ORDER.get(item.status, 99),
            -item.last_activity,
            item.name.lower(),
        ),
    )


def _sort_incidents(incidents: Iterable[IncidentRecord]) -> list[IncidentRecord]:
    return sorted(
        incidents,
        key=lambda item: (
            SEVERITY_ORDER.get(item.severity, 99),
            STATUS_ORDER.get(item.status, 99),
            item.workspace_name.lower(),
        ),
    )


def build_session_records(
    raw_sessions: list[dict[str, object]],
    *,
    bindings_by_id: dict[str, dict[str, object]],
    agent_ids_by_assistant: dict[str, str],
) -> list[SessionRecord]:
    items: list[SessionRecord] = []
    for payload in raw_sessions:
        assistant_id = _safe_str(payload.get("agent")).strip()
        binding = bindings_by_id.get(assistant_id, {})
        items.append(
            SessionRecord(
                id=_safe_str(payload.get("id")) or f"{assistant_id}:{_safe_str(payload.get('key'))}",
                key=_safe_str(payload.get("key")),
                assistant_id=assistant_id or _safe_str(payload.get("id")) or "unknown",
                workspace=_safe_str(binding.get("workspace")) or assistant_id or "n/a",
                channel=_safe_str(payload.get("channel")) or "no-channel",
                age=_safe_str(payload.get("age")) or "-",
                model=_safe_str(payload.get("model")) or "n/a",
                tokens=_safe_str(payload.get("tokens")) or "n/a",
                source=_safe_str(payload.get("source")) or "unknown",
                active=bool(payload.get("active", False)),
                last_activity=int(payload.get("last_activity") or 0),
                managed_by_mutx=assistant_id in agent_ids_by_assistant,
                agent_id=agent_ids_by_assistant.get(assistant_id),
                kind=_safe_str(payload.get("kind")) or "unknown",
                session_label=_safe_str(payload.get("channel")) or assistant_id,
            )
        )
    return sorted(items, key=lambda item: item.last_activity, reverse=True)


def build_workspace_records(
    *,
    runtime_snapshot: dict[str, object],
    agents: list[AgentRecord],
    deployments: list[DeploymentRecord],
    sessions: list[SessionRecord],
    governance_pending_by_key: dict[str, int],
) -> list[WorkspaceRecord]:
    bindings = runtime_snapshot.get("bindings")
    if not isinstance(bindings, list):
        bindings = []

    agents_by_assistant: dict[str, AgentRecord] = {}
    for agent in agents:
        assistant_id = _assistant_id_from_agent(agent)
        if assistant_id:
            agents_by_assistant[assistant_id] = agent

    bindings_by_id: dict[str, dict[str, object]] = {}
    for binding in bindings:
        if not isinstance(binding, dict):
            continue
        assistant_id = _safe_str(binding.get("assistant_id")).strip()
        if assistant_id:
            bindings_by_id[assistant_id] = dict(binding)

    for assistant_id, agent in agents_by_assistant.items():
        bindings_by_id.setdefault(
            assistant_id,
            {
                "assistant_id": assistant_id,
                "workspace": assistant_id,
                "tracked_by_mutx": True,
                "live_detected": False,
            },
        )

    sessions_by_assistant: dict[str, list[SessionRecord]] = defaultdict(list)
    for session in sessions:
        sessions_by_assistant[session.assistant_id].append(session)
        bindings_by_id.setdefault(
            session.assistant_id,
            {
                "assistant_id": session.assistant_id,
                "workspace": session.workspace,
                "tracked_by_mutx": session.managed_by_mutx,
                "live_detected": True,
            },
        )

    latest_deployment_by_agent: dict[str, DeploymentRecord] = {}
    for deployment in deployments:
        latest_deployment_by_agent.setdefault(deployment.agent_id, deployment)

    gateway = runtime_snapshot.get("gateway")
    gateway_status = "unknown"
    if isinstance(gateway, dict):
        gateway_status = _safe_str(gateway.get("status")) or "unknown"

    rows: list[WorkspaceRecord] = []
    for assistant_id, binding in bindings_by_id.items():
        agent = agents_by_assistant.get(assistant_id)
        deployment = latest_deployment_by_agent.get(agent.id) if agent is not None else None
        workspace_sessions = sessions_by_assistant.get(assistant_id, [])
        workspace = _safe_str(binding.get("workspace")) or assistant_id or "n/a"
        latest_error = deployment.error_message if deployment is not None else None
        governance_pending = governance_pending_by_key.get(assistant_id, 0)
        if agent is not None:
            governance_pending = max(governance_pending, governance_pending_by_key.get(agent.id, 0))

        deployment_status = deployment.status if deployment is not None else None
        status = _workspace_status(
            gateway_status=gateway_status,
            deployment_status=deployment_status,
            agent_status=agent.status if agent is not None else "unknown",
            latest_error=latest_error,
        )
        incident_severity = _incident_severity(
            status=status,
            latest_error=latest_error,
            governance_pending=governance_pending,
        )
        incident_summary = _incident_summary(
            status=status,
            latest_error=latest_error,
            governance_pending=governance_pending,
            session_count=len(workspace_sessions),
        )
        last_activity = 0
        last_activity_label = "-"
        if workspace_sessions:
            newest_session = workspace_sessions[0]
            last_activity = newest_session.last_activity
            last_activity_label = newest_session.age
        elif deployment is not None:
            last_activity = max(
                _parse_timestamp_ms(deployment.ended_at),
                _parse_timestamp_ms(deployment.started_at),
            )
            last_activity_label = deployment.status
        elif agent is not None:
            last_activity = max(
                _parse_timestamp_ms(agent.updated_at),
                _parse_timestamp_ms(agent.created_at),
            )
            last_activity_label = agent.updated_at or agent.created_at or "-"

        managed_by_mutx = agent is not None or bool(binding.get("tracked_by_mutx"))
        managed_label = "managed" if managed_by_mutx else "local"
        channels = sorted(
            {
                session.channel
                for session in workspace_sessions
                if session.channel and session.channel != "no-channel"
            }
        )
        default_session = workspace_sessions[0] if workspace_sessions else None
        rows.append(
            WorkspaceRecord(
                id=assistant_id,
                name=_workspace_name(binding, agent),
                assistant_id=assistant_id,
                workspace=workspace,
                status=status,
                managed_by_mutx=managed_by_mutx,
                managed_label=managed_label,
                gateway_status=gateway_status,
                session_count=len(workspace_sessions),
                last_activity=last_activity,
                last_activity_label=last_activity_label,
                incident_severity=incident_severity,
                incident_summary=incident_summary,
                agent_id=agent.id if agent is not None else None,
                agent_status=agent.status if agent is not None else "unknown",
                deployment_status=deployment_status,
                deployment_id=deployment.id if deployment is not None else None,
                latest_error=latest_error,
                default_session_key=default_session.key if default_session is not None else None,
                default_session_id=default_session.id if default_session is not None else None,
                channels=channels,
                governance_pending=governance_pending,
                recent_run_count=0,
                agent=agent,
                latest_deployment=deployment,
                binding=binding,
            )
        )
    return _sort_workspaces(rows)


def build_incident_records(workspaces: list[WorkspaceRecord]) -> list[IncidentRecord]:
    incidents: list[IncidentRecord] = []
    for workspace in workspaces:
        if workspace.incident_severity == "healthy":
            continue
        title = workspace.status.replace("_", " ").title()
        incidents.append(
            IncidentRecord(
                id=f"{workspace.assistant_id}:{workspace.status}",
                severity=workspace.incident_severity,
                title=title,
                summary=workspace.incident_summary,
                assistant_id=workspace.assistant_id,
                workspace_id=workspace.id,
                workspace_name=workspace.name,
                status=workspace.status,
                session_count=workspace.session_count,
                agent_id=workspace.agent_id,
                deployment_id=workspace.deployment_id,
                incident_type="workspace",
            )
        )
    return _sort_incidents(incidents)


def build_cockpit_snapshot(
    *,
    runtime_snapshot: dict[str, object],
    onboarding: dict[str, object],
    assistant_name: str | None,
    agents: list[AgentRecord],
    deployments: list[DeploymentRecord],
    raw_sessions: list[dict[str, object]],
    governance_defers: list[object],
    governance_decisions: list[object],
) -> CockpitSnapshot:
    bindings = runtime_snapshot.get("bindings")
    if not isinstance(bindings, list):
        bindings = []
    bindings_by_id = {
        _safe_str(binding.get("assistant_id")).strip(): dict(binding)
        for binding in bindings
        if isinstance(binding, dict) and _safe_str(binding.get("assistant_id")).strip()
    }

    agent_ids_by_assistant: dict[str, str] = {}
    for agent in agents:
        assistant_id = _assistant_id_from_agent(agent)
        if assistant_id:
            agent_ids_by_assistant[assistant_id] = agent.id

    governance_pending_by_key: dict[str, int] = defaultdict(int)
    for item in governance_defers:
        key = _safe_str(getattr(item, "agent_id", None)).strip()
        if key:
            governance_pending_by_key[key] += 1

    session_records = build_session_records(
        raw_sessions,
        bindings_by_id=bindings_by_id,
        agent_ids_by_assistant=agent_ids_by_assistant,
    )
    workspaces = build_workspace_records(
        runtime_snapshot=runtime_snapshot,
        agents=agents,
        deployments=deployments,
        sessions=session_records,
        governance_pending_by_key=governance_pending_by_key,
    )
    incidents = build_incident_records(workspaces)
    gateway = runtime_snapshot.get("gateway")
    gateway_status = _safe_str(gateway.get("status")) if isinstance(gateway, dict) else "unknown"
    return CockpitSnapshot(
        runtime_snapshot=runtime_snapshot,
        onboarding=onboarding,
        assistant_name=assistant_name,
        workspaces=workspaces,
        incidents=incidents,
        sessions=session_records,
        deployments=deployments,
        governance_pending_total=len(governance_defers),
        governance_decisions_total=len(governance_decisions),
        gateway_status=gateway_status or "unknown",
    )

