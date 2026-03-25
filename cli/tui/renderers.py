from __future__ import annotations

import json
from typing import Iterable

from cli.services.models import (
    AgentRecord,
    DeploymentEventHistory,
    DeploymentRecord,
    LogEntry,
    MetricPoint,
)
from cli.tui.models import IncidentRecord, SessionRecord, WorkspaceInspectorRecord, WorkspaceRecord


def shorten(value: str | None, limit: int = 32) -> str:
    if not value:
        return "n/a"
    if len(value) <= limit:
        return value
    return f"{value[: limit - 3]}..."


def render_json_block(payload: object) -> str:
    if payload is None:
        return "{}"
    if isinstance(payload, dict):
        return json.dumps(payload, indent=2, sort_keys=True)
    return str(payload)


def render_logs(logs: list[LogEntry], *, empty: str) -> str:
    if not logs:
        return empty
    return "\n".join(
        f"{item.timestamp or 'n/a'} | {item.level:<7} | {item.message}" for item in logs[:50]
    )


def render_metrics(metrics: list[MetricPoint]) -> str:
    if not metrics:
        return "No deployment metrics found."
    return "\n".join(
        " | ".join(
            [
                str(metric.timestamp or "n/a"),
                f"cpu: {metric.cpu_usage if metric.cpu_usage is not None else 'n/a'}",
                f"memory: {metric.memory_usage if metric.memory_usage is not None else 'n/a'}",
            ]
        )
        for metric in metrics[:50]
    )


def render_events(history: DeploymentEventHistory | None) -> str:
    if history is None or not history.items:
        return "No deployment events found."

    lines = [
        f"Deployment: {history.deployment_id}",
        f"Status: {history.deployment_status}",
        f"Events: {history.total}",
        "",
    ]
    for item in history.items[:50]:
        line = " | ".join(
            [
                item.created_at or "n/a",
                item.event_type,
                item.status,
                f"node: {item.node_id or 'n/a'}",
            ]
        )
        if item.error_message:
            line += f" | {item.error_message}"
        lines.append(line)
    return "\n".join(lines)


def render_setup_body(
    authenticated: bool,
    api_url: str,
    assistant_name: str | None,
    onboarding: dict[str, object],
    runtime_snapshot: dict[str, object],
) -> str:
    gateway = runtime_snapshot.get("gateway") if isinstance(runtime_snapshot, dict) else {}
    if not isinstance(gateway, dict):
        gateway = {}
    bindings = runtime_snapshot.get("bindings") if isinstance(runtime_snapshot, dict) else []
    if not isinstance(bindings, list):
        bindings = []

    last_error = str(onboarding.get("last_error") or "").strip()
    status = str(onboarding.get("status") or "pending")
    current_step = str(onboarding.get("current_step") or "auth")
    gateway_status = str(runtime_snapshot.get("status") or gateway.get("status") or "unknown")
    gateway_url = str(runtime_snapshot.get("gateway_url") or gateway.get("gateway_url") or "n/a")
    binary_path = str(runtime_snapshot.get("binary_path") or "n/a")
    privacy_summary = str(runtime_snapshot.get("privacy_summary") or "Local-only runtime tracking.")
    tracked_root = str(runtime_snapshot.get("provider_root") or "~/.mutx/providers/openclaw")

    lines = [
        "Setup stays available, but the cockpit now leads with the workspace fleet.",
        "",
        f"Session: {'ready' if authenticated else 'login required'} on {api_url}",
        f"Wizard: {status} · step {current_step}",
        "",
        "Runtime:",
        f"  gateway  {gateway_status} · {gateway_url}",
        f"  binary   {binary_path}",
        f"  home     {runtime_snapshot.get('home_path') or 'n/a'}",
        f"  config   {runtime_snapshot.get('config_path') or 'n/a'}",
        f"  tracking {tracked_root}",
        f"  workspaces {runtime_snapshot.get('live_binding_count') or len(bindings)} live · {runtime_snapshot.get('tracked_binding_count') or len(bindings)} tracked",
        "",
        "Managed assistant:",
        f"  name {assistant_name or 'not deployed'}",
        f"  id   {onboarding.get('assistant_id') or runtime_snapshot.get('assistant_id') or 'n/a'}",
        f"  ws   {onboarding.get('workspace') or 'n/a'}",
        "",
        "Privacy:",
        f"  {privacy_summary}",
    ]
    if bindings:
        lines.extend(["", f"Detected workspaces ({len(bindings)}):"])
        for item in bindings[:8]:
            if not isinstance(item, dict):
                continue
            flags = []
            if item.get("tracked_by_mutx"):
                flags.append("managed")
            if item.get("live_detected"):
                flags.append("live")
            lines.append(
                f"  {item.get('assistant_id') or 'n/a'} | {item.get('workspace') or 'n/a'} | {'+'.join(flags) or 'unknown'}"
            )
        if len(bindings) > 8:
            lines.append(f"  … {len(bindings) - 8} more")
    if last_error:
        lines.extend(["", f"Needs attention: {last_error}"])
    if not authenticated:
        lines.extend(
            [
                "",
                "Next: run `mutx setup hosted` or `mutx setup local` to authenticate and unlock the cockpit.",
            ]
        )
    else:
        lines.extend(
            [
                "",
                "Next: use Fleet for workspace operations, Incidents for failures, Sessions for live activity, and Deployments for rollout control.",
            ]
        )
    return "\n".join(lines)


def render_openclaw_runtime_detail(
    *,
    agent: AgentRecord,
    runtime_snapshot: dict[str, object] | None,
    assistant_overview,
    local_sessions: list[dict[str, object]],
) -> str:
    snapshot = runtime_snapshot if isinstance(runtime_snapshot, dict) else {}
    gateway = snapshot.get("gateway")
    if not isinstance(gateway, dict):
        gateway = {}
    bindings = snapshot.get("bindings")
    if not isinstance(bindings, list):
        bindings = []

    metadata = {}
    if isinstance(agent.config, dict):
        meta = agent.config.get("metadata")
        if isinstance(meta, dict):
            runtime = meta.get("runtime")
            if isinstance(runtime, dict):
                metadata = runtime
    assistant_id = (
        str(agent.config.get("assistant_id") or "").strip()
        if isinstance(agent.config, dict)
        else ""
    )
    current_binding = snapshot.get("current_binding")
    if isinstance(current_binding, dict) and current_binding:
        binding = current_binding
    else:
        binding = next(
            (
                item
                for item in bindings
                if isinstance(item, dict) and str(item.get("assistant_id") or "") == assistant_id
            ),
            {},
        )
    if not isinstance(binding, dict):
        binding = {}

    gateway_lines = [
        "Gateway:",
        f"  status    {gateway.get('status') or metadata.get('gateway_status') or 'unknown'}",
        f"  url       {gateway.get('gateway_url') or metadata.get('gateway_url') or 'n/a'}",
        f"  port      {gateway.get('gateway_port') or metadata.get('gateway_port') or 'n/a'}",
        f"  config    {gateway.get('config_path') or snapshot.get('config_path') or 'n/a'}",
        f"  state dir {gateway.get('state_dir') or snapshot.get('state_dir') or 'n/a'}",
        f"  binary    {snapshot.get('binary_path') or 'n/a'}",
        f"  agents    {snapshot.get('live_binding_count') or len(bindings)} live / {snapshot.get('tracked_binding_count') or len(bindings)} tracked",
    ]

    binding_lines = [
        "Binding:",
        f"  assistant {binding.get('assistant_id') or assistant_id or 'n/a'}",
        f"  workspace {binding.get('workspace') or agent.config.get('workspace') if isinstance(agent.config, dict) else 'n/a'}",
        f"  model     {binding.get('model') or agent.config.get('model') if isinstance(agent.config, dict) else 'n/a'}",
        f"  agent dir {binding.get('agent_dir') or metadata.get('agent_dir') or 'n/a'}",
        f"  imported  {'yes' if snapshot.get('adopted_existing_runtime') else 'no'}",
    ]

    workspace_lines = [f"Detected workspaces ({len(bindings)}):"]
    if bindings:
        for item in bindings[:10]:
            if not isinstance(item, dict):
                continue
            labels = []
            if str(item.get("assistant_id") or "") == assistant_id:
                labels.append("selected")
            if item.get("tracked_by_mutx"):
                labels.append("managed")
            if item.get("live_detected"):
                labels.append("live")
            workspace_lines.append(
                f"  {item.get('assistant_id') or 'n/a'} | {item.get('workspace') or 'n/a'} | {'+'.join(labels) or 'unknown'}"
            )
        if len(bindings) > 10:
            workspace_lines.append(f"  … {len(bindings) - 10} more")
    else:
        workspace_lines.append("  No OpenClaw workspaces detected.")

    session_lines = ["Local sessions:"]
    if local_sessions:
        for session in local_sessions[:8]:
            session_lines.append(
                "  "
                + " | ".join(
                    [
                        str(session.get("age") or "n/a"),
                        str(session.get("channel") or "no-channel"),
                        str(session.get("tokens") or "n/a"),
                        str(session.get("model") or "n/a"),
                    ]
                )
            )
    else:
        session_lines.append("  No local sessions found for this OpenClaw agent.")

    overview_lines = ["Assistant state:"]
    if assistant_overview is not None:
        overview_lines.extend(
            [
                f"  status    {assistant_overview.status}",
                f"  sessions  {assistant_overview.session_count}",
                f"  skills    {', '.join(skill.id for skill in assistant_overview.installed_skills) or 'none'}",
                f"  channels  "
                + (
                    ", ".join(
                        f"{channel.id}:{'on' if channel.enabled else 'off'}"
                        for channel in assistant_overview.channels
                    )
                    or "none"
                ),
            ]
        )
        latest = assistant_overview.deployments[0] if assistant_overview.deployments else None
        if latest is not None:
            overview_lines.append(
                f"  latest deploy {shorten(latest.id, 12)} | {latest.status} | node {latest.node_id or 'n/a'}"
            )
            if latest.error_message:
                overview_lines.append(f"  last error {latest.error_message}")
    else:
        overview_lines.append("  Assistant overview unavailable from the control plane.")

    return "\n".join(
        gateway_lines
        + [""]
        + binding_lines
        + [""]
        + workspace_lines
        + [""]
        + session_lines
        + [""]
        + overview_lines
    )


def _lines(items: Iterable[str]) -> str:
    return "\n".join(items)


def render_workspace_inspector(
    *,
    workspace: WorkspaceRecord,
    runtime_snapshot: dict[str, object],
    sessions: list[SessionRecord],
    logs: list[LogEntry],
    deployment_events: DeploymentEventHistory | None,
    deployment_logs: list[LogEntry],
    observability_runs: list[dict[str, object]],
    governance_defers: list[object],
    governance_decisions: list[object],
    incident: IncidentRecord | None = None,
) -> WorkspaceInspectorRecord:
    summary_lines = [
        f"Name: {workspace.name}",
        f"Assistant: {workspace.assistant_id}",
        f"Workspace: {workspace.workspace}",
        f"Managed: {workspace.managed_label}",
        f"Status: {workspace.status}",
        f"Gateway: {workspace.gateway_status}",
        f"Deployment: {workspace.deployment_status or 'n/a'}",
        f"Sessions: {workspace.session_count}",
        f"Last activity: {workspace.last_activity_label}",
    ]
    if workspace.latest_error:
        summary_lines.append(f"Last error: {workspace.latest_error}")
    if incident is not None:
        summary_lines.extend(["", f"Incident: {incident.severity} · {incident.summary}"])

    activity_lines = [
        "Recent sessions:",
    ]
    if sessions:
        for session in sessions[:8]:
            activity_lines.append(
                f"  {session.age} | {session.channel} | {session.tokens} | {session.model}"
            )
    else:
        activity_lines.append("  No recent local sessions.")
    if observability_runs:
        activity_lines.extend(["", "Recent runs:"])
        for run in observability_runs[:6]:
            activity_lines.append(
                f"  {shorten(str(run.get('id')), 12)} | {run.get('status', 'unknown')} | {run.get('started_at', 'n/a')}"
            )
    if governance_defers:
        activity_lines.extend(["", "Governance pending:"])
        for item in governance_defers[:6]:
            activity_lines.append(
                f"  {getattr(item, 'tool_id', None) or '-'} | {getattr(item, 'reason', None) or '-'}"
            )
    if governance_decisions:
        activity_lines.extend(["", "Recent decisions:"])
        for item in governance_decisions[:6]:
            activity_lines.append(
                f"  {getattr(item, 'timestamp', None) or '-'} | {getattr(item, 'effect', None) or '-'} | {getattr(item, 'tool_id', None) or '-'}"
            )

    combined_logs = logs + deployment_logs
    events_text = render_events(deployment_events)
    actions_lines = [
        "Available actions:",
        "  r refresh current surface",
        "  enter inspect or open the default action for the selected row",
        "  ctrl+k open command palette",
        "  o open hosted dashboard",
        "  ? show shortcuts",
        "",
        "Workspace actions:",
        "  Open Session: jump into the newest OpenClaw session",
        "  Open OpenClaw: open the upstream TUI on this workspace",
    ]
    if workspace.managed_by_mutx:
        actions_lines.extend(
            [
                "  Deploy: trigger a managed rollout for the selected workspace",
                "  Restart: restart the latest deployment when one exists",
            ]
        )
    return WorkspaceInspectorRecord(
        workspace=workspace,
        summary=_lines(summary_lines),
        activity=_lines(activity_lines),
        logs=render_logs(combined_logs, empty="No workspace logs found."),
        events=events_text,
        actions=_lines(actions_lines),
    )


def render_session_inspector(
    *,
    session: SessionRecord,
    workspace: WorkspaceRecord | None,
) -> dict[str, str]:
    summary = _lines(
        [
            f"Session: {session.id}",
            f"Assistant: {session.assistant_id}",
            f"Workspace: {session.workspace}",
            f"Managed: {'yes' if session.managed_by_mutx else 'no'}",
            f"Channel: {session.channel}",
            f"Age: {session.age}",
            f"Tokens: {session.tokens}",
            f"Model: {session.model}",
            f"Source: {session.source}",
        ]
    )
    activity_lines = ["Workspace context:"]
    if workspace is not None:
        activity_lines.extend(
            [
                f"  Name: {workspace.name}",
                f"  Status: {workspace.status}",
                f"  Deployment: {workspace.deployment_status or 'n/a'}",
                f"  Incident: {workspace.incident_severity} · {workspace.incident_summary}",
            ]
        )
    else:
        activity_lines.append("  No managed workspace record is attached to this session.")
    actions = _lines(
        [
            "Available actions:",
            "  enter or Open Session: jump into this OpenClaw session",
            "  Open OpenClaw: open the upstream TUI without a session pin",
            "  o: open hosted dashboard",
        ]
    )
    return {
        "summary": summary,
        "activity": _lines(activity_lines),
        "logs": "Session logs are owned by the upstream OpenClaw runtime. Open the selected session for live inspection.",
        "events": "Session mutation and event history are not wired through the MUTX API yet.",
        "actions": actions,
    }


def render_deployment_inspector(
    *,
    deployment: DeploymentRecord,
    events: DeploymentEventHistory | None,
    logs: list[LogEntry],
    metrics: list[MetricPoint],
    workspace: WorkspaceRecord | None,
) -> dict[str, str]:
    summary_lines = [
        f"Deployment: {deployment.id}",
        f"Agent: {deployment.agent_id}",
        f"Workspace: {workspace.name if workspace is not None else 'n/a'}",
        f"Status: {deployment.status}",
        f"Version: {deployment.version or 'n/a'}",
        f"Replicas: {deployment.replicas}",
        f"Node: {deployment.node_id or 'n/a'}",
        f"Started: {deployment.started_at or 'n/a'}",
        f"Ended: {deployment.ended_at or 'n/a'}",
    ]
    if deployment.error_message:
        summary_lines.append(f"Last error: {deployment.error_message}")
    actions = _lines(
        [
            "Available actions:",
            "  Restart: requeue the selected deployment",
            "  Scale: adjust replica count",
            "  Delete: kill the selected deployment",
            "  o: open hosted dashboard",
        ]
    )
    return {
        "summary": _lines(summary_lines),
        "activity": render_metrics(metrics),
        "logs": render_logs(logs, empty="No deployment logs found."),
        "events": render_events(events),
        "actions": actions,
    }

