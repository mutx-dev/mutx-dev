from __future__ import annotations

import json
import subprocess
import time

from textual import on, work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import ModalScreen
from textual.widgets import (
    Button,
    DataTable,
    Footer,
    Input,
    Label,
    Static,
    TabbedContent,
    TabPane,
)

from cli.openclaw_runtime import (
    collect_openclaw_runtime_snapshot,
    open_openclaw_surface,
    persist_openclaw_runtime_snapshot,
)
from cli.faramesh_runtime import (
    collect_faramesh_snapshot,
    get_faramesh_health,
    get_pending_defers,
    get_recent_decisions,
)
from cli.runtime_registry import load_wizard_state
from cli.services import (
    AgentRecord,
    AgentsService,
    AssistantService,
    AuthService,
    CLIServiceError,
    DeploymentEventHistory,
    DeploymentRecord,
    DeploymentsService,
    LogEntry,
    MetricPoint,
    RuntimeStateService,
    TemplatesService,
)
from cli.setup_wizard import (
    mark_auth_completed,
    prepare_runtime_state_sync,
    run_openclaw_setup_wizard,
)


MUTX_ASCII_LOGO = """\
 __  __ _   _ _____ __  __
|  \\/  | | | |_   _|\\ \\/ /
| |\\/| | | | | | |   \\  /
| |  | | |_| | | |   /  \\
|_|  |_|\\___/  |_|  /_/\\_\\
"""

MUTX_OPERATOR_COPY = "control plane for agent infrastructure"
KEY_HINTS = "r refresh  d deploy  x restart  s scale  backspace delete  tab switch"
MUTX_ACCENT_FRAMES = ("#3B82F6", "#2563EB", "#06B6D4", "#22D3EE")
MUTX_IDLE_FRAMES = ("◢", "◣", "◤", "◥")
MUTX_BUSY_FRAMES = ("◐", "◓", "◑", "◒")
MUTX_SIGNAL_PATTERN = "▁▂▃▄▅▆▇█▇▆▅▄▃▂"


def _shorten(value: str | None, limit: int = 32) -> str:
    if not value:
        return "n/a"
    if len(value) <= limit:
        return value
    return f"{value[: limit - 3]}..."


def _render_json_block(payload) -> str:
    if payload is None:
        return "{}"
    if isinstance(payload, dict):
        return json.dumps(payload, indent=2, sort_keys=True)
    return str(payload)


def _render_logs(logs: list[LogEntry], *, empty: str) -> str:
    if not logs:
        return empty
    return "\n".join(
        f"{item.timestamp or 'n/a'} | {item.level:<7} | {item.message}" for item in logs[:50]
    )


def _render_metrics(metrics: list[MetricPoint]) -> str:
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


def _render_events(history: DeploymentEventHistory) -> str:
    if not history.items:
        return "No deployment events found."

    lines = [
        f"Deployment: {history.deployment_id}",
        f"Status: {history.deployment_status}",
        f"Events: {history.total}",
        "",
    ]
    for item in history.items[:50]:
        lines.append(
            " | ".join(
                [
                    item.created_at or "n/a",
                    item.event_type,
                    item.status,
                    f"node: {item.node_id or 'n/a'}",
                ]
            )
        )
    return "\n".join(lines)


def _render_agent_detail(agent: AgentRecord) -> str:
    deployment_lines = [
        f"- {_shorten(item.id, 12)} | {item.status} | replicas={item.replicas}"
        for item in agent.deployments[:8]
    ]
    if not deployment_lines:
        deployment_lines = ["- No deployments attached to this agent."]

    lines = [
        f"ID: {agent.id}",
        f"Name: {agent.name}",
        f"Type: {agent.type}",
        f"Status: {agent.status}",
        f"Description: {agent.description or 'n/a'}",
        f"Config version: {agent.config_version}",
        f"Created: {agent.created_at or 'n/a'}",
        f"Updated: {agent.updated_at or 'n/a'}",
        "",
        "Deployments:",
        *deployment_lines,
        "",
        "Config:",
        _render_json_block(agent.config),
    ]
    return "\n".join(lines)


def _render_deployment_detail(deployment: DeploymentRecord) -> str:
    event_lines = [
        f"- {item.created_at or 'n/a'} | {item.event_type} | {item.status}"
        for item in deployment.events[:8]
    ]
    if not event_lines:
        event_lines = ["- No embedded events on the deployment detail payload."]

    lines = [
        f"ID: {deployment.id}",
        f"Agent: {deployment.agent_id}",
        f"Status: {deployment.status}",
        f"Version: {deployment.version or 'n/a'}",
        f"Replicas: {deployment.replicas}",
        f"Node: {deployment.node_id or 'n/a'}",
        f"Started: {deployment.started_at or 'n/a'}",
        f"Ended: {deployment.ended_at or 'n/a'}",
        f"Last error: {deployment.error_message or 'n/a'}",
        "",
        "Embedded events:",
        *event_lines,
    ]
    return "\n".join(lines)


def _render_provider_lines(onboarding: dict[str, object]) -> list[str]:
    lines = ["Providers:"]
    current_provider = str(onboarding.get("provider") or "openclaw")
    providers = onboarding.get("providers") or []
    if not isinstance(providers, list):
        providers = []
    for item in providers:
        if not isinstance(item, dict):
            continue
        cue = str(item.get("cue") or "•")
        label = str(item.get("label") or item.get("id") or "provider")
        enabled = bool(item.get("enabled", False))
        selected = str(item.get("id") or "") == current_provider
        status = "active" if selected and enabled else ("available" if enabled else "coming soon")
        lines.append(f"  {cue} {label:<10} {status}")
    return lines


def _render_step_lines(onboarding: dict[str, object]) -> list[str]:
    lines = ["Wizard:"]
    steps = onboarding.get("steps") or []
    current_step = str(onboarding.get("current_step") or "")
    failed_step = str(onboarding.get("failed_step") or "")
    if not isinstance(steps, list):
        steps = []
    for item in steps:
        if not isinstance(item, dict):
            continue
        step_id = str(item.get("id") or "")
        completed = bool(item.get("completed", False))
        if failed_step and step_id == failed_step:
            marker = "x"
        elif completed:
            marker = "✓"
        elif step_id == current_step:
            marker = "→"
        else:
            marker = "·"
        lines.append(f"  {marker} {item.get('title')}")
    return lines


def _render_setup_body(
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
    binding = (
        bindings[0]
        if isinstance(bindings, list) and bindings and isinstance(bindings[0], dict)
        else {}
    )

    last_error = str(onboarding.get("last_error") or "").strip()
    status = str(onboarding.get("status") or "pending")
    current_step = str(onboarding.get("current_step") or "auth")
    gateway_status = str(runtime_snapshot.get("status") or gateway.get("status") or "unknown")
    gateway_url = str(runtime_snapshot.get("gateway_url") or gateway.get("gateway_url") or "n/a")
    binary_path = str(runtime_snapshot.get("binary_path") or "n/a")
    privacy_summary = str(runtime_snapshot.get("privacy_summary") or "Local-only runtime tracking.")
    tracked_root = str(runtime_snapshot.get("provider_root") or "~/.mutx/providers/openclaw")
    assistant_id = str(binding.get("assistant_id") or runtime_snapshot.get("assistant_id") or "n/a")
    workspace = str(binding.get("workspace") or runtime_snapshot.get("workspace") or "n/a")

    lines = [
        "MUTX uses this page as a short setup rail. The full runtime view lives in Control Plane.",
        "",
        f"Session: {'ready' if authenticated else 'login required'} on {api_url}",
        "Provider: OpenClaw 🦞",
        f"Wizard: {status} · step {current_step}",
        "",
        "Runtime:",
        f"  gateway  {gateway_status} · {gateway_url}",
        f"  binary   {binary_path}",
        f"  home     {runtime_snapshot.get('home_path') or 'n/a'}",
        f"  config   {runtime_snapshot.get('config_path') or 'n/a'}",
        f"  tracking {tracked_root}",
        "",
        "Assistant:",
        f"  name {assistant_name or 'not deployed'}",
        f"  id   {assistant_id}",
        f"  ws   {workspace}",
        "",
        "Privacy:",
        f"  {privacy_summary}",
    ]
    if last_error:
        lines.extend(["", f"Needs attention: {last_error}"])
    if not authenticated:
        lines.extend(
            [
                "",
                "Next: run `mutx setup hosted` for the managed path or `mutx setup local` for a private localhost control plane.",
            ]
        )
    elif assistant_name:
        lines.extend(
            [
                "",
                "Next: open OpenClaw TUI 🦞 for the upstream runtime experience, or switch to Control Plane for sessions and gateway health.",
            ]
        )
    elif runtime_snapshot.get("binary_path"):
        lines.extend(
            [
                "",
                "Next: Import Existing OpenClaw 🦞 to adopt the current runtime and deploy the Personal Assistant in one pass.",
            ]
        )
    else:
        lines.extend(
            [
                "",
                "Next: Deploy Personal Assistant. MUTX will install OpenClaw, onboard it, track it, and bind a dedicated assistant.",
            ]
        )
    return "\n".join(lines)


def _render_governance_body() -> tuple[str, str]:
    try:
        health = get_faramesh_health()
        snapshot = collect_faramesh_snapshot()
    except Exception as e:
        return (f"Error loading governance: {e}", "")

    status_icon = "✓" if health.daemon_reachable else "✗"
    status_line = f"Daemon: {status_icon} {'running' if health.daemon_reachable else 'stopped'}"

    summary_lines = [
        f"Version: {health.version or 'unknown'}",
        status_line,
        f"Policy: {health.policy_name or 'none'}",
        f"Decisions (total): {snapshot.decisions_total}",
        f"Decisions (denied today): {health.denied_today}",
        f"Decisions (deferred today): {health.deferred_today}",
        f"Pending approvals: {health.pending_approvals}",
    ]

    if health.doctor_summary:
        summary_lines.append("")
        summary_lines.append(health.doctor_summary)

    return ("", "\n".join(summary_lines))


def _render_control_plane_body(overview, sessions: list[dict]) -> tuple[str, str]:
    if overview is None:
        return (
            "No Personal Assistant found.",
            "Gateway health will appear after the starter assistant is deployed.",
        )

    session_lines = [
        f"{item.get('agent')} | {item.get('channel')} | {item.get('age')} | {item.get('tokens')}"
        for item in sessions[:50]
    ] or ["No sessions found."]

    health_lines = [
        f"Assistant: {overview.name}",
        f"Gateway: {overview.gateway.status}",
        f"Sessions: {overview.session_count}",
        f"Workspace: {overview.workspace}",
        "",
        overview.gateway.doctor_summary,
    ]
    return ("\n".join(session_lines), "\n".join(health_lines))


class ConfirmActionScreen(ModalScreen[bool]):
    CSS = """
    ConfirmActionScreen {
        align: center middle;
    }

    #confirm-dialog {
        width: 60;
        height: auto;
        border: round #2563eb;
        background: #050816;
        padding: 1 2;
    }

    #confirm-actions {
        height: auto;
        margin-top: 1;
    }

    #confirm-actions Button {
        margin-right: 1;
    }
    """

    def __init__(self, title: str, body: str):
        super().__init__()
        self.title = title
        self.body = body

    def compose(self) -> ComposeResult:
        with Vertical(id="confirm-dialog"):
            yield Label(self.title)
            yield Static(self.body)
            with Horizontal(id="confirm-actions"):
                yield Button("Confirm", id="confirm-yes", variant="error")
                yield Button("Cancel", id="confirm-no")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(event.button.id == "confirm-yes")


class ScaleDeploymentScreen(ModalScreen[int | None]):
    CSS = """
    ScaleDeploymentScreen {
        align: center middle;
    }

    #scale-dialog {
        width: 60;
        height: auto;
        border: round #2563eb;
        background: #050816;
        padding: 1 2;
    }

    #scale-actions {
        height: auto;
        margin-top: 1;
    }

    #scale-actions Button {
        margin-right: 1;
    }
    """

    def __init__(self, replicas: int):
        super().__init__()
        self.replicas = replicas

    def compose(self) -> ComposeResult:
        with Vertical(id="scale-dialog"):
            yield Label("Scale deployment")
            yield Static("Enter the desired replica count (1-10).")
            yield Input(value=str(self.replicas), id="replica-input")
            with Horizontal(id="scale-actions"):
                yield Button("Apply", id="scale-apply", variant="primary")
                yield Button("Cancel", id="scale-cancel")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "scale-cancel":
            self.dismiss(None)
            return

        raw_value = self.query_one("#replica-input", Input).value.strip()
        try:
            replicas = int(raw_value)
        except ValueError:
            self.notify("Replica count must be an integer.", severity="error")
            return

        if replicas < 1 or replicas > 10:
            self.notify("Replica count must be between 1 and 10.", severity="error")
            return

        self.dismiss(replicas)


class MutxTUI(App[None]):
    TITLE = "mutx tui"
    CSS = """
    Screen {
        background: #030307;
        color: #e2e8f0;
    }

    Footer {
        background: #050816;
        color: #94a3b8;
    }

    #brand-rail {
        height: auto;
        padding: 1 2 1 1;
        background: #050816;
        border-bottom: solid #162032;
    }

    #brand-art {
        width: 33;
        min-width: 33;
        color: #3b82f6;
        padding: 0 1 0 0;
    }

    #brand-meta {
        width: 1fr;
        height: auto;
        padding: 1 0 0 1;
    }

    #brand-title {
        color: #ffffff;
        text-style: bold;
    }

    #brand-copy {
        color: #cbd5e1;
        margin-top: 1;
    }

    #brand-signal {
        height: auto;
        margin-top: 1;
        padding: 0 1;
        background: #091224;
        color: #22d3ee;
        border: round #1d4ed8;
    }

    #brand-context {
        color: #64748b;
        margin-top: 1;
    }

    #status-banner {
        height: 2;
        padding: 0 1;
        background: #0a1428;
        color: #dbeafe;
        border-bottom: solid #1e2c45;
    }

    #context-footer {
        height: auto;
        padding: 0 1;
        background: #04060f;
        color: #94a3b8;
        border-top: solid #162032;
    }

    TabbedContent {
        height: 1fr;
    }

    TabPane {
        padding: 0;
    }

    ContentTabs {
        background: #050816;
        border-bottom: solid #162032;
    }

    ContentTabs Tab {
        color: #94a3b8;
        background: transparent;
    }

    ContentTabs Tab.-active {
        color: #ffffff;
        text-style: bold;
        border-bottom: heavy #22d3ee;
    }

    .workspace-split {
        height: 1fr;
    }

    .panel {
        border: round #1e2c45;
        background: #0a0a0e;
    }

    .entity-table {
        width: 46;
        min-width: 38;
    }

    .detail-panel {
        width: 1fr;
    }

    .action-bar {
        height: auto;
        padding: 1 1 0 1;
        background: #050816;
        border-bottom: solid #162032;
    }

    .action-bar Button {
        margin-right: 1;
    }

    .detail-scroll {
        height: 1fr;
        padding: 0 1 1 1;
    }

    .detail-body {
        width: 1fr;
        color: #dbe5f0;
    }

    .governance-metrics {
        height: auto;
        padding: 1 1 1 1;
        background: #050816;
        border-bottom: solid #162032;
    }

    .metric-card {
        width: 12;
        height: 4;
        padding: 1 1;
        margin-right: 1;
        background: #0a1628;
        border: solid #1e3a5f;
        content-align: center middle;
    }

    .metric-card > Static {
        width: 100%;
        color: #94a3b8;
    }

    #governance-permits + Static {
        color: #22c55e;
    }

    #governance-denies + Static {
        color: #ef4444;
    }

    #governance-defers + Static {
        color: #eab308;
    }

    #governance-pending + Static {
        color: #3b82f6;
    }

    #governance-pending-label, #governance-decisions-label {
        width: 100%;
        padding: 1 1 0 1;
        color: #94a3b8;
        text-style: bold;
    }

    .observability-metrics {
        height: auto;
        padding: 1 1 1 1;
        background: #050816;
        border-bottom: solid #162032;
    }

    #observability-total-runs + Static {
        color: #94a3b8;
    }

    #observability-running + Static {
        color: #22c55e;
    }

    #observability-completed + Static {
        color: #3b82f6;
    }

    #observability-failed + Static {
        color: #ef4444;
    }

    #observability-pending-label, #observability-runs-label {
        width: 100%;
        padding: 1 1 0 1;
        color: #94a3b8;
        text-style: bold;
    }

    Button {
        background: #0b172b;
        color: #dbeafe;
        border: round #22314b;
    }

    Button.-primary {
        background: #2563eb;
        color: #ffffff;
        border: round #3b82f6;
    }

    Button.-error {
        background: #3b0d1e;
        color: #fecdd3;
        border: round #fb7185;
    }

    Button:focus {
        border: round #22d3ee;
    }

    DataTable {
        background: #050816;
        color: #e2e8f0;
    }

    DataTable:focus {
        border: round #22d3ee;
    }
    """
    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("tab", "focus_next", "Next"),
        Binding("shift+tab", "focus_previous", "Prev"),
        Binding("r", "refresh_current", "Refresh"),
        Binding("d", "deploy_selected_agent", "Deploy Agent"),
        Binding("x", "restart_selected_deployment", "Restart Deployment"),
        Binding("s", "scale_selected_deployment", "Scale Deployment"),
        Binding("backspace", "delete_selected_deployment", "Delete Deployment"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.auth_service = AuthService()
        self.agents_service = AgentsService()
        self.assistant_service = AssistantService()
        self.deployments_service = DeploymentsService()
        self.templates_service = TemplatesService()
        self.runtime_service = RuntimeStateService()
        self.selected_agent_id: str | None = None
        self.selected_deployment_id: str | None = None
        self.selected_session_id: str | None = None
        self._governance_selected_token: str | None = None
        self._agent_cache: dict[str, AgentRecord] = {}
        self._deployment_cache: dict[str, DeploymentRecord] = {}
        self._session_cache: list[dict] = []
        self._wizard_state_cache: dict[str, object] = load_wizard_state("openclaw")
        self._runtime_snapshot_cache: dict[str, object] = persist_openclaw_runtime_snapshot(
            install_method="npm"
        ).to_payload()
        self._agent_count = 0
        self._deployment_count = 0
        self._assistant_name: str | None = None
        self._activity_label = "idle"
        self._activity_started_at: float | None = None
        self._notice_text: str | None = None
        self._notice_deadline = 0.0
        self._animation_tick = 0
        self._initial_workspace_selected = False

    def compose(self) -> ComposeResult:
        with Horizontal(id="brand-rail"):
            yield Static(MUTX_ASCII_LOGO, id="brand-art")
            with Vertical(id="brand-meta"):
                yield Static("MUTX operator terminal", id="brand-title")
                yield Static(MUTX_OPERATOR_COPY, id="brand-copy")
                yield Static(id="brand-signal")
                yield Static(
                    "setup · assistant · deployments · control plane · governance",
                    id="brand-context",
                )
        yield Static(id="status-banner")
        with TabbedContent(id="workspace"):
            with TabPane("Setup", id="setup-pane"):
                with Vertical(classes="panel detail-panel"):
                    yield Static("Setup workspace", id="setup-summary")
                    with Horizontal(classes="action-bar"):
                        yield Button("Refresh", id="setup-refresh", variant="primary")
                        yield Button("Import Existing OpenClaw 🦞", id="setup-import")
                        yield Button("Repair in OpenClaw 🦞", id="setup-configure-openclaw")
                        yield Button("Open OpenClaw TUI 🦞", id="setup-openclaw-tui")
                        yield Button("Deploy Personal Assistant", id="setup-deploy")
                    with VerticalScroll(classes="detail-scroll"):
                        yield Static(id="setup-body", classes="detail-body")
            with TabPane("Assistant", id="agents-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="agents-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Assistant detail", id="agents-summary")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="agents-refresh", variant="primary")
                            yield Button("Deploy", id="agents-deploy")
                            yield Button(
                                "Enable Gov", id="agents-enable-governance", variant="primary"
                            )
                            yield Button(
                                "Disable Gov", id="agents-disable-governance", variant="warning"
                            )
                        with TabbedContent(id="agents-detail-tabs"):
                            with TabPane("Detail"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="agent-detail-body", classes="detail-body")
                            with TabPane("Logs"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="agent-logs-body", classes="detail-body")
            with TabPane("Deployments", id="deployments-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="deployments-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Deployment detail", id="deployments-summary")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="deployments-refresh", variant="primary")
                            yield Button("Restart", id="deployments-restart")
                            yield Button("Scale", id="deployments-scale")
                            yield Button("Delete", id="deployments-delete", variant="error")
                        with TabbedContent(id="deployments-detail-tabs"):
                            with TabPane("Detail"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="deployment-detail-body", classes="detail-body")
                            with TabPane("Events"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="deployment-events-body", classes="detail-body")
                            with TabPane("Logs"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="deployment-logs-body", classes="detail-body")
                            with TabPane("Metrics"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(
                                        id="deployment-metrics-body", classes="detail-body"
                                    )
            with TabPane("Control Plane", id="control-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="sessions-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Control plane", id="control-summary")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="control-refresh", variant="primary")
                        with TabbedContent(id="control-detail-tabs"):
                            with TabPane("Sessions"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="control-sessions-body", classes="detail-body")
                            with TabPane("Gateway"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="control-health-body", classes="detail-body")
            with TabPane("Governance", id="governance-pane"):
                with Vertical(classes="panel detail-panel"):
                    yield Static("Faramesh Governance Engine", id="governance-summary")
                    with Horizontal(classes="action-bar"):
                        yield Button("Refresh", id="governance-refresh", variant="primary")
                        yield Button("Start Daemon", id="governance-start")
                        yield Button("Tail", id="governance-tail")
                    with Horizontal(classes="governance-metrics"):
                        with Vertical(classes="metric-card"):
                            yield Static("Permits", id="governance-permits")
                        with Vertical(classes="metric-card"):
                            yield Static("Denies", id="governance-denies")
                        with Vertical(classes="metric-card"):
                            yield Static("Defers", id="governance-defers")
                        with Vertical(classes="metric-card"):
                            yield Static("Pending", id="governance-pending")
                    yield Label("Pending Approvals", id="governance-pending-label")
                    with DataTable(id="governance-pending-table", classes="entity-table"):
                        pass
                    with Horizontal(classes="action-bar"):
                        yield Button(
                            "Approve", id="governance-approve", variant="primary", disabled=True
                        )
                        yield Button("Deny", id="governance-deny", variant="error", disabled=True)
                    yield Label("Recent Decisions", id="governance-decisions-label")
                    with DataTable(id="governance-decisions-table", classes="entity-table"):
                        pass
                    with VerticalScroll(classes="detail-scroll"):
                        yield Static(id="governance-body", classes="detail-body")
            with TabPane("Observability", id="observability-pane"):
                with Vertical(classes="panel detail-panel"):
                    yield Static("Agent Run Observability", id="observability-summary")
                    with Horizontal(classes="action-bar"):
                        yield Button("Refresh", id="observability-refresh", variant="primary")
                        yield Input(
                            placeholder="Filter by agent_id...", id="observability-filter-agent"
                        )
                    with Horizontal(classes="observability-metrics"):
                        with Vertical(classes="metric-card"):
                            yield Static("Runs", id="observability-total-runs")
                        with Vertical(classes="metric-card"):
                            yield Static("Running", id="observability-running")
                        with Vertical(classes="metric-card"):
                            yield Static("Completed", id="observability-completed")
                        with Vertical(classes="metric-card"):
                            yield Static("Failed", id="observability-failed")
                    yield Label("Recent Runs", id="observability-runs-label")
                    with DataTable(id="observability-runs-table", classes="entity-table"):
                        pass
                    with VerticalScroll(classes="detail-scroll"):
                        yield Static(id="observability-body", classes="detail-body")
        yield Static(id="context-footer")
        yield Footer()

    def on_mount(self) -> None:
        self._configure_tables()
        self.set_interval(0.2, self._advance_animation)
        self._refresh_chrome()

        if self.auth_service.status().authenticated:
            self._set_activity("loading setup")
            self.load_setup()
            self._set_activity("loading agents")
            self.load_agents()
            self._set_activity("loading deployments")
            self.load_deployments()
            self._set_activity("loading control plane")
            self.load_control_plane()
        else:
            self._render_logged_out_state()

    def _configure_tables(self) -> None:
        agents_table = self.query_one("#agents-table", DataTable)
        agents_table.cursor_type = "row"
        agents_table.zebra_stripes = True
        agents_table.add_columns("Name", "Status", "Type", "Updated")

        deployments_table = self.query_one("#deployments-table", DataTable)
        deployments_table.cursor_type = "row"
        deployments_table.zebra_stripes = True
        deployments_table.add_columns("Deployment", "Status", "Replicas", "Agent")

        sessions_table = self.query_one("#sessions-table", DataTable)
        sessions_table.cursor_type = "row"
        sessions_table.zebra_stripes = True
        sessions_table.add_columns("Agent", "Channel", "Age", "Tokens")

        governance_table = self.query_one("#governance-pending-table", DataTable)
        governance_table.cursor_type = "row"
        governance_table.zebra_stripes = True
        governance_table.add_columns("Token", "Agent", "Tool", "Reason")

        decisions_table = self.query_one("#governance-decisions-table", DataTable)
        decisions_table.cursor_type = "row"
        decisions_table.zebra_stripes = True
        decisions_table.add_columns("Time", "Effect", "Tool", "Agent")

        observability_table = self.query_one("#observability-runs-table", DataTable)
        observability_table.cursor_type = "row"
        observability_table.zebra_stripes = True
        observability_table.add_columns("Run ID", "Agent", "Status", "Started", "Duration")

    def _set_activity(self, label: str) -> None:
        self._activity_label = label
        self._activity_started_at = time.monotonic()
        self._refresh_chrome()

    def _clear_activity(self) -> None:
        self._activity_label = "idle"
        self._activity_started_at = None
        self._refresh_chrome()

    def _set_notice(self, message: str, *, ttl: float = 5.0) -> None:
        self._notice_text = message
        self._notice_deadline = time.monotonic() + ttl
        self._refresh_chrome()

    def _active_workspace(self) -> str:
        active = self.query_one("#workspace", TabbedContent).active
        mapping = {
            "setup-pane": "setup",
            "agents-pane": "assistant",
            "deployments-pane": "deployments",
            "control-pane": "control-plane",
        }
        return mapping.get(active, active)

    def _status_glyph(self, busy: bool) -> str:
        frames = MUTX_BUSY_FRAMES if busy else MUTX_IDLE_FRAMES
        return frames[self._animation_tick % len(frames)]

    def _signal_wave(self, width: int = 14) -> str:
        offset = self._animation_tick % len(MUTX_SIGNAL_PATTERN)
        return "".join(
            MUTX_SIGNAL_PATTERN[(offset + index) % len(MUTX_SIGNAL_PATTERN)]
            for index in range(width)
        )

    def _brand_signal_text(self, authenticated: bool) -> str:
        mode = "session live" if authenticated else "login required"
        return f"{self._status_glyph(self._activity_label != 'idle')}  fabric {self._signal_wave()}  /v1  {mode}"

    def _refresh_chrome(self) -> None:
        status = self.auth_service.status()
        auth_state = "logged in" if status.authenticated else "local only"
        busy = self._activity_label != "idle"
        elapsed = ""
        if self._activity_started_at is not None:
            elapsed = f" {time.monotonic() - self._activity_started_at:0.1f}s"
        notice = ""
        if self._notice_text and time.monotonic() < self._notice_deadline:
            notice = f" | {self._notice_text}"
        elif self._notice_text:
            self._notice_text = None

        banner = (
            f"{self._status_glyph(busy)} mutx tui | API: {status.api_url} | Auth: {auth_state}"
            f" | {self._activity_label}{elapsed}{notice}"
        )
        self.sub_title = status.api_url
        self.query_one("#status-banner", Static).update(banner)
        self.query_one("#brand-signal", Static).update(
            self._brand_signal_text(status.authenticated)
        )
        self.query_one("#brand-context", Static).update(
            f"assistant {self._assistant_name or 'not deployed'} · deployments {self._deployment_count} · config {status.config_path}"
        )
        self.query_one("#context-footer", Static).update(
            f"{KEY_HINTS} | workspace {self._active_workspace()} | selected agent {_shorten(self.selected_agent_id, 12)} | selected deployment {_shorten(self.selected_deployment_id, 12)}"
        )
        accent = MUTX_ACCENT_FRAMES[self._animation_tick % len(MUTX_ACCENT_FRAMES)]
        self.query_one("#brand-art", Static).styles.color = accent
        self.query_one("#brand-signal", Static).styles.color = accent

    def _render_logged_out_state(self) -> None:
        self._agent_count = 0
        self._deployment_count = 0
        self._assistant_name = None
        self._initial_workspace_selected = False
        self._wizard_state_cache = load_wizard_state("openclaw")
        self._runtime_snapshot_cache = collect_openclaw_runtime_snapshot().to_payload()
        message = _render_setup_body(
            False,
            self.auth_service.status().api_url,
            None,
            self._wizard_state_cache,
            self._runtime_snapshot_cache,
        )
        self.query_one("#setup-summary", Static).update("Setup required")
        self.query_one("#setup-body", Static).update(message)
        self.query_one("#agents-summary", Static).update("Agents unavailable")
        self.query_one("#deployments-summary", Static).update("Deployments unavailable")
        self.query_one("#control-summary", Static).update("Control plane unavailable")
        self.query_one("#agent-detail-body", Static).update(message)
        self.query_one("#agent-logs-body", Static).update(
            "Agent logs require an authenticated session."
        )
        self.query_one("#deployment-detail-body", Static).update(message)
        self.query_one("#deployment-events-body", Static).update(
            "Deployment events require an authenticated session."
        )
        self.query_one("#deployment-logs-body", Static).update(
            "Deployment logs require an authenticated session."
        )
        self.query_one("#deployment-metrics-body", Static).update(
            "Deployment metrics require an authenticated session."
        )
        self.query_one("#control-sessions-body", Static).update(
            "Session data requires an authenticated session."
        )
        self.query_one("#control-health-body", Static).update(
            "Gateway health requires an authenticated session."
        )
        self._refresh_setup_actions()
        self._clear_activity()

    def _handle_service_error(self, error: CLIServiceError) -> None:
        self.notify(str(error), severity="error")
        self._set_notice(str(error), ttl=8.0)
        self._clear_activity()

    def _render_setup_payload(
        self,
        assistant_name: str | None,
        onboarding: dict[str, object],
        runtime_snapshot: dict[str, object],
    ) -> None:
        status = self.auth_service.status()
        self._assistant_name = assistant_name
        self._wizard_state_cache = onboarding
        self._runtime_snapshot_cache = runtime_snapshot
        self.query_one("#setup-summary", Static).update(
            "Setup complete"
            if assistant_name
            else f"Setup {str(onboarding.get('status') or 'pending')}"
        )
        self.query_one("#setup-body", Static).update(
            _render_setup_body(
                status.authenticated, status.api_url, assistant_name, onboarding, runtime_snapshot
            )
        )
        if assistant_name and not self._initial_workspace_selected:
            self.query_one("#workspace", TabbedContent).active = "control-pane"
            self._initial_workspace_selected = True
        self._refresh_setup_actions()
        self._clear_activity()

    def _render_agents(self, agents: list[AgentRecord]) -> None:
        table = self.query_one("#agents-table", DataTable)
        table.clear(columns=False)
        self._agent_cache = {agent.id: agent for agent in agents}
        self._agent_count = len(agents)
        if not agents:
            self.selected_agent_id = None
            self.query_one("#agent-detail-body", Static).update("No agents found.")
            self.query_one("#agent-logs-body", Static).update("No logs found.")
            self.query_one("#agents-summary", Static).update("Agents: 0")
            self._set_notice("Agents refreshed")
            self._clear_activity()
            return

        for agent in agents:
            table.add_row(
                agent.name,
                agent.status,
                agent.type,
                _shorten(agent.updated_at),
                key=agent.id,
            )

        self.selected_agent_id = agents[0].id
        table.cursor_coordinate = (0, 0)
        self._set_activity(f"loading {_shorten(agents[0].name, 18)}")
        self.load_agent_detail(agents[0].id)
        self.query_one("#agents-summary", Static).update(
            f"Agents: {len(agents)} | Selected: {agents[0].name}"
        )
        self._set_notice("Agents refreshed")

    def _render_agent_payload(self, agent: AgentRecord, logs: list[LogEntry]) -> None:
        self.query_one("#agent-detail-body", Static).update(_render_agent_detail(agent))
        self.query_one("#agent-logs-body", Static).update(
            _render_logs(logs, empty="No agent logs found.")
        )
        self.query_one("#agents-summary", Static).update(
            f"Agent: {agent.name} | Status: {agent.status} | Deployments: {len(agent.deployments)}"
        )
        self._clear_activity()

    def _render_deployments(self, deployments: list[DeploymentRecord]) -> None:
        table = self.query_one("#deployments-table", DataTable)
        table.clear(columns=False)
        self._deployment_cache = {deployment.id: deployment for deployment in deployments}
        self._deployment_count = len(deployments)
        if not deployments:
            self.selected_deployment_id = None
            self.query_one("#deployment-detail-body", Static).update("No deployments found.")
            self.query_one("#deployment-events-body", Static).update("No deployment events found.")
            self.query_one("#deployment-logs-body", Static).update("No deployment logs found.")
            self.query_one("#deployment-metrics-body", Static).update(
                "No deployment metrics found."
            )
            self.query_one("#deployments-summary", Static).update("Deployments: 0")
            self._set_notice("Deployments refreshed")
            self._clear_activity()
            return

        for deployment in deployments:
            table.add_row(
                _shorten(deployment.id, 12),
                deployment.status,
                str(deployment.replicas),
                _shorten(deployment.agent_id, 12),
                key=deployment.id,
            )

        self.selected_deployment_id = deployments[0].id
        table.cursor_coordinate = (0, 0)
        self._set_activity(f"loading {_shorten(deployments[0].id, 12)}")
        self.load_deployment_detail(deployments[0].id)
        self.query_one("#deployments-summary", Static).update(
            f"Deployments: {len(deployments)} | Selected: {_shorten(deployments[0].id, 12)}"
        )
        self._set_notice("Deployments refreshed")

    def _render_deployment_payload(
        self,
        deployment: DeploymentRecord,
        events: DeploymentEventHistory,
        logs: list[LogEntry],
        metrics: list[MetricPoint],
    ) -> None:
        self._deployment_cache[deployment.id] = deployment
        self.query_one("#deployment-detail-body", Static).update(
            _render_deployment_detail(deployment)
        )
        self.query_one("#deployment-events-body", Static).update(_render_events(events))
        self.query_one("#deployment-logs-body", Static).update(
            _render_logs(logs, empty="No deployment logs found.")
        )
        self.query_one("#deployment-metrics-body", Static).update(_render_metrics(metrics))
        self.query_one("#deployments-summary", Static).update(
            f"Deployment: {_shorten(deployment.id, 12)} | Status: {deployment.status} | Replicas: {deployment.replicas}"
        )
        self._clear_activity()

    def _render_control_plane(self, overview, sessions: list[dict]) -> None:
        table = self.query_one("#sessions-table", DataTable)
        table.clear(columns=False)
        self._session_cache = sessions

        for session in sessions[:100]:
            table.add_row(
                str(session.get("agent") or ""),
                str(session.get("channel") or ""),
                str(session.get("age") or ""),
                str(session.get("tokens") or ""),
                key=str(session.get("id") or ""),
            )

        sessions_body, health_body = _render_control_plane_body(overview, sessions)
        self.query_one("#control-summary", Static).update(
            f"Control plane | sessions: {len(sessions)} | gateway: {overview.gateway.status if overview else 'n/a'}"
        )
        self.query_one("#control-sessions-body", Static).update(sessions_body)
        self.query_one("#control-health-body", Static).update(health_body)
        self._clear_activity()

    def _advance_animation(self) -> None:
        self._animation_tick += 1
        self._refresh_chrome()

    def _render_setup_progress(self, event: dict[str, object]) -> None:
        step = str(event.get("step") or "setup")
        state = str(event.get("state") or "running")
        message = str(event.get("message") or step)
        self._wizard_state_cache = load_wizard_state("openclaw")
        self._runtime_snapshot_cache = collect_openclaw_runtime_snapshot().to_payload()
        self.query_one("#setup-summary", Static).update(f"OpenClaw wizard | {step} | {state}")
        self.query_one("#setup-body", Static).update(
            _render_setup_body(
                self.auth_service.status().authenticated,
                self.auth_service.status().api_url,
                self._assistant_name,
                self._wizard_state_cache,
                self._runtime_snapshot_cache,
            )
        )
        self._refresh_setup_actions()
        self._set_notice(message)

    def _refresh_setup_actions(self) -> None:
        runtime_snapshot = (
            self._runtime_snapshot_cache if isinstance(self._runtime_snapshot_cache, dict) else {}
        )
        has_openclaw = bool(runtime_snapshot.get("binary_path"))
        assistant_exists = bool(self._assistant_name)
        gateway = runtime_snapshot.get("gateway")
        if not isinstance(gateway, dict):
            gateway = {}
        gateway_status = str(runtime_snapshot.get("status") or gateway.get("status") or "unknown")
        needs_repair = has_openclaw and gateway_status != "healthy"

        import_button = self.query_one("#setup-import", Button)
        import_button.display = has_openclaw and not assistant_exists
        import_button.disabled = not (has_openclaw and not assistant_exists)
        import_button.variant = "primary"

        repair_button = self.query_one("#setup-configure-openclaw", Button)
        repair_button.display = needs_repair
        repair_button.disabled = not needs_repair

        open_tui_button = self.query_one("#setup-openclaw-tui", Button)
        open_tui_button.display = has_openclaw and assistant_exists and not needs_repair
        open_tui_button.disabled = not (has_openclaw and assistant_exists and not needs_repair)
        open_tui_button.variant = "primary" if assistant_exists else "default"

        deploy_button = self.query_one("#setup-deploy", Button)
        deploy_button.display = not has_openclaw and not assistant_exists
        deploy_button.disabled = has_openclaw or assistant_exists
        deploy_button.variant = "primary"

    def _run_external_command(self, command: str | list[str], *, label: str) -> None:
        self._set_notice(label, ttl=12.0)
        self._refresh_chrome()
        with self.suspend():
            if isinstance(command, str):
                result = subprocess.run(
                    ["/bin/bash", "-lc", command],
                    check=False,
                )
            else:
                result = subprocess.run(command, check=False)
        if result.returncode != 0:
            raise CLIServiceError(f"{label} failed with exit code {result.returncode}.")

    def _run_setup_wizard(self, *, requested_action: str | None = None) -> None:
        status = self.auth_service.status()
        if not status.authenticated:
            self.notify(
                "Authenticate with `mutx setup hosted` or `mutx setup local` first.",
                severity="warning",
            )
            return

        mode = "local" if status.api_url.startswith("http://localhost") else "hosted"
        self._set_activity("running openclaw wizard")
        mark_auth_completed(
            mode=mode,
            provider="openclaw",
            assistant_name="Personal Assistant",
            runtime_service=self.runtime_service,
            reset=True,
            progress=self._render_setup_progress,
        )

        try:
            result = run_openclaw_setup_wizard(
                mode=mode,
                assistant_name="Personal Assistant",
                description=None,
                replicas=1,
                model=None,
                workspace=None,
                install_openclaw=True,
                openclaw_install_method="npm",
                no_input=False,
                templates_service=self.templates_service,
                assistant_service=self.assistant_service,
                runtime_service=self.runtime_service,
                requested_action=requested_action,
                progress=self._render_setup_progress,
                install_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Installing OpenClaw",
                ),
                onboard_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Onboarding OpenClaw gateway",
                ),
                configure_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Opening OpenClaw TUI",
                ),
            )
        except CLIServiceError as exc:
            self._handle_service_error(exc)
            self.load_setup()
            return

        message = (
            f"Reused assistant {result.assistant_id}"
            if result.reused_existing_assistant
            else f"Deployed assistant {result.assistant_id}"
        )
        self._after_action(message, True)
        self.query_one("#workspace", TabbedContent).active = "control-pane"

    def _open_openclaw_surface(self, surface: str) -> None:
        runtime_snapshot = (
            self._runtime_snapshot_cache if isinstance(self._runtime_snapshot_cache, dict) else {}
        )
        gateway_url = str(runtime_snapshot.get("gateway_url") or "") or None
        install_method = str(runtime_snapshot.get("install_method") or "npm")
        label = "🦞 Opening OpenClaw TUI" if surface == "tui" else "🦞 Opening OpenClaw configure"
        self._set_activity(label.lower())
        try:
            open_openclaw_surface(
                surface=surface,
                gateway_url=gateway_url,
                command_runner=lambda command: self._run_external_command(command, label=label),
            )
            prepare_runtime_state_sync(
                self.runtime_service,
                assistant_name=self._assistant_name,
                install_method=install_method,
                action_type=surface,
            )
        except CLIServiceError as exc:
            self._handle_service_error(exc)
            self.load_setup()
            return

        self._after_action(
            "Returned from OpenClaw TUI"
            if surface == "tui"
            else "Returned from OpenClaw configure",
            False,
        )

    def _deploy_openclaw_agent(self, agent_id: str) -> None:
        self._set_activity(f"deploying {_shorten(agent_id, 12)}")
        try:
            agent = self.agents_service.get_agent(agent_id)
            agent = self.agents_service.ensure_openclaw_binding(
                agent,
                install_if_missing=True,
                install_method="npm",
                no_input=False,
                prompt_install=lambda: True,
                install_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Installing OpenClaw",
                ),
                onboard_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Onboarding OpenClaw gateway",
                ),
            )
            result = self.agents_service.deploy_agent(agent_id)
        except CLIServiceError as exc:
            self._handle_service_error(exc)
            return

        self._after_action(
            f"Deploy started for {_shorten(agent_id, 12)} ({result.status or 'pending'})",
            True,
        )

    @work(thread=True, exclusive=True, group="agents-list")
    def load_agents(self) -> None:
        try:
            agents = self.agents_service.list_agents(limit=100, skip=0)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(self._render_agents, agents)

    @work(thread=True, exclusive=True, group="agent-detail")
    def load_agent_detail(self, agent_id: str) -> None:
        try:
            agent = self.agents_service.get_agent(agent_id)
            logs = self.agents_service.get_logs(agent_id, limit=50)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(self._render_agent_payload, agent, logs)

    @work(thread=True, exclusive=True, group="setup")
    def load_setup(self) -> None:
        try:
            overview = self.assistant_service.overview()
            onboarding = load_wizard_state("openclaw")
            runtime_snapshot = collect_openclaw_runtime_snapshot().to_payload()
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        assistant_name = overview.name if overview else None
        self.call_from_thread(
            self._render_setup_payload, assistant_name, onboarding, runtime_snapshot
        )

    @work(thread=True, exclusive=True, group="deployments-list")
    def load_deployments(self) -> None:
        try:
            deployments = self.deployments_service.list_deployments(limit=100, skip=0)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(self._render_deployments, deployments)

    @work(thread=True, exclusive=True, group="deployment-detail")
    def load_deployment_detail(self, deployment_id: str) -> None:
        try:
            deployment = self.deployments_service.get_deployment(deployment_id)
            events = self.deployments_service.get_events(deployment_id, limit=50)
            logs = self.deployments_service.get_logs(deployment_id, limit=50)
            metrics = self.deployments_service.get_metrics(deployment_id, limit=50)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(self._render_deployment_payload, deployment, events, logs, metrics)

    @work(thread=True, exclusive=True, group="control-plane")
    def load_control_plane(self) -> None:
        try:
            overview = self.assistant_service.overview()
            sessions = self.assistant_service.list_sessions(
                agent_id=overview.agent_id if overview else None
            )
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(self._render_control_plane, overview, sessions)

    def load_governance(self) -> None:
        self._set_activity("loading governance")
        try:
            health = get_faramesh_health()
            snapshot = collect_faramesh_snapshot()
            defers = get_pending_defers()
            decisions = get_recent_decisions(limit=20)
        except Exception:
            health = snapshot = None
            defers = []
            decisions = []

        aarm_compliance = None
        aarm_metrics = None
        try:
            from cli.services import SecurityService

            sec_service = SecurityService(config=self.config)
            aarm_compliance = sec_service.get_compliance_report()
            aarm_metrics = sec_service.get_metrics()
        except Exception:
            pass

        status_icon = "✓" if (health and health.daemon_reachable) else "✗"
        summary = f"Daemon: {status_icon} {'running' if (health and health.daemon_reachable) else 'stopped'} | "
        summary += f"Policy: {(health and health.policy_name) or 'none'} | "
        summary += f"Pending: {len(defers)}"
        if aarm_compliance:
            overall = "✓" if aarm_compliance.get("overall_satisfied") else "✗"
            summary += f" | AARM: {overall}"
        self.call_from_thread(
            self._update_governance,
            summary,
            defers,
            decisions,
            health,
            snapshot,
            aarm_compliance,
            aarm_metrics,
        )

    def _update_governance(
        self,
        summary: str,
        defers: list,
        decisions: list,
        health,
        snapshot,
        aarm_compliance=None,
        aarm_metrics=None,
    ) -> None:
        self.query_one("#governance-summary", Static).update(summary)

        if snapshot:
            self.query_one("#governance-permits", Static).update(
                f"Permits\n{snapshot.permits_today}"
            )
            self.query_one("#governance-denies", Static).update(
                f"Denies\n{(health and health.denied_today) or 0}"
            )
            self.query_one("#governance-defers", Static).update(
                f"Defers\n{(health and health.deferred_today) or 0}"
            )
        elif aarm_metrics:
            self.query_one("#governance-permits", Static).update(
                f"Permits\n{aarm_metrics.get('permits', 0)}"
            )
            self.query_one("#governance-denies", Static).update(
                f"Denies\n{aarm_metrics.get('denials', 0)}"
            )
            self.query_one("#governance-defers", Static).update(
                f"Defers\n{aarm_metrics.get('defers', 0)}"
            )
        else:
            self.query_one("#governance-permits", Static).update("Permits\n-")
            self.query_one("#governance-denies", Static).update("Denies\n-")
            self.query_one("#governance-defers", Static).update("Defers\n-")

        self.query_one("#governance-pending", Static).update(f"Pending\n{len(defers)}")

        pending_table = self.query_one("#governance-pending-table", DataTable)
        pending_table.clear()
        if defers:
            for d in defers:
                pending_table.add_row(
                    d.defer_token or "-",
                    d.agent_id or "-",
                    d.tool_id or "-",
                    d.reason or "-",
                )
            self.query_one("#governance-approve", Button).disabled = False
            self.query_one("#governance-deny", Button).disabled = False
        else:
            self.query_one("#governance-approve", Button).disabled = True
            self.query_one("#governance-deny", Button).disabled = True

        decisions_table = self.query_one("#governance-decisions-table", DataTable)
        decisions_table.clear()
        for d in decisions[:15]:
            effect = d.effect or "-"
            effect_display = effect[:6]
            ts = d.timestamp[-8:] if d.timestamp else "-"
            decisions_table.add_row(
                ts,
                effect_display,
                (d.tool_id or "-")[:25],
                (d.agent_id or "-")[:15],
            )

        detail_lines = []
        if health and health.version:
            detail_lines.append(f"Faramesh v{health.version}")
            detail_lines.append(f"Decisions (total): {snapshot.decisions_total if snapshot else 0}")
        else:
            detail_lines.append("Faramesh: not running")

        if aarm_compliance:
            detail_lines.append("")
            detail_lines.append("AARM Security Layer:")
            overall = "PASS" if aarm_compliance.get("overall_satisfied") else "FAIL"
            detail_lines.append(f"  Compliance: {overall}")
            results = aarm_compliance.get("results", [])
            must_pass = sum(1 for r in results if r.get("level") == "MUST" and r.get("satisfied"))
            must_total = sum(1 for r in results if r.get("level") == "MUST")
            should_pass = sum(
                1 for r in results if r.get("level") == "SHOULD" and r.get("satisfied")
            )
            should_total = sum(1 for r in results if r.get("level") == "SHOULD")
            detail_lines.append(f"  MUST: {must_pass}/{must_total}")
            detail_lines.append(f"  SHOULD: {should_pass}/{should_total}")

        if health and health.doctor_summary:
            detail_lines.append("")
            detail_lines.append(health.doctor_summary)

        self.query_one("#governance-body", Static).update("\n".join(detail_lines))

    def _update_governance_error(self, error: str) -> None:
        self.query_one("#governance-summary", Static).update(f"Error: {error}")

    @work(thread=True, exclusive=True)
    def load_observability(self) -> None:
        """Load observability data from the API."""
        self._set_activity("loading observability")
        try:
            from cli.services import ObservabilityService

            service = ObservabilityService(config=self.config)
            runs = service.list_runs(limit=50)

            metrics = {"total": len(runs), "running": 0, "completed": 0, "failed": 0}
            for run in runs:
                status = run.get("status", "unknown")
                if status == "running":
                    metrics["running"] += 1
                elif status == "completed":
                    metrics["completed"] += 1
                elif status == "failed":
                    metrics["failed"] += 1

            self.call_from_thread(self._update_observability, runs, metrics)
        except Exception as e:
            self.call_from_thread(self._update_observability_error, str(e))

    def _update_observability(self, runs: list[dict], metrics: dict) -> None:
        self.query_one("#observability-summary", Static).update("Agent Run Observability")
        self.query_one("#observability-total-runs", Static).update(f"Runs\n{metrics['total']}")
        self.query_one("#observability-running", Static).update(f"Running\n{metrics['running']}")
        self.query_one("#observability-completed", Static).update(
            f"Completed\n{metrics['completed']}"
        )
        self.query_one("#observability-failed", Static).update(f"Failed\n{metrics['failed']}")

        runs_table = self.query_one("#observability-runs-table", DataTable)
        runs_table.clear()

        for run in runs[:30]:
            run_id = run.get("id", "-")[:20]
            agent_id = run.get("agent_id", "-")[:20]
            status = run.get("status", "-")
            started = run.get("started_at", "-")
            if started and len(started) > 10:
                started = started[-19:-10] if started.endswith("Z") else started[:10]
            duration = run.get("duration_ms", 0) or 0
            duration_str = f"{duration / 1000:.1f}s" if duration else "-"
            runs_table.add_row(run_id, agent_id, status, started, duration_str)

        detail_lines = [f"Total runs: {len(runs)}"]
        if runs:
            recent = runs[0]
            detail_lines.append("")
            detail_lines.append("Most recent run:")
            detail_lines.append(f"  ID: {recent.get('id', '-')[:30]}")
            detail_lines.append(f"  Agent: {recent.get('agent_id', '-')}")
            detail_lines.append(f"  Status: {recent.get('status', '-')}")
            if recent.get("cost"):
                cost = recent["cost"]
                detail_lines.append(f"  Cost: ${cost.get('cost_usd', 0):.4f}")
        self.query_one("#observability-body", Static).update("\n".join(detail_lines))

    def _update_observability_error(self, error: str) -> None:
        self.query_one("#observability-summary", Static).update(f"Error: {error}")

    @work(thread=True, exclusive=True, group="governance-action")
    def _governance_approve_selected(self) -> None:
        selected = self._governance_selected_token
        if not selected:
            return
        try:
            from cli.faramesh_runtime import FAREMESH_SOCKET_PATH, approve_defer

            success = approve_defer(FAREMESH_SOCKET_PATH, selected)
            if success:
                self.call_from_thread(self.notify, f"Approved: {selected}", severity="information")
                self.call_from_thread(self.load_governance)
            else:
                self.call_from_thread(self.notify, f"Approval failed: {selected}", severity="error")
        except Exception as e:
            self.call_from_thread(self.notify, f"Error: {e}", severity="error")

    @work(thread=True, exclusive=True, group="governance-action")
    def _governance_deny_selected(self) -> None:
        selected = self._governance_selected_token
        if not selected:
            return
        try:
            from cli.faramesh_runtime import FAREMESH_SOCKET_PATH, deny_defer

            success = deny_defer(FAREMESH_SOCKET_PATH, selected)
            if success:
                self.call_from_thread(self.notify, f"Denied: {selected}", severity="warning")
                self.call_from_thread(self.load_governance)
            else:
                self.call_from_thread(self.notify, f"Denial failed: {selected}", severity="error")
        except Exception as e:
            self.call_from_thread(self.notify, f"Error: {e}", severity="error")

    def _start_faramesh_daemon(self) -> None:
        import os
        import shutil

        from cli.faramesh_runtime import (
            ensure_faramesh_installed,
            start_faramesh_daemon,
        )

        self._set_activity("starting faramesh")
        installed, bin_path = ensure_faramesh_installed(
            install_if_missing=True, non_interactive=True
        )
        if not installed:
            self.notify("Failed to install Faramesh.", severity="error")
            return

        bundled = os.path.join(os.path.dirname(__file__), "..", "policies", "starter.fpl")
        bundled = os.path.abspath(bundled)
        policy_dir = os.path.expanduser("~/.mutx/policies")
        policy_path = os.path.join(policy_dir, "starter.fpl")
        os.makedirs(policy_dir, exist_ok=True)
        if not os.path.exists(policy_path):
            shutil.copy(bundled, policy_path)

        proc = start_faramesh_daemon(policy_path=policy_path, socket_path="/tmp/faramesh.sock")
        if proc is None:
            self.notify("Failed to start Faramesh daemon.", severity="error")
            return

        self.notify(f"Faramesh daemon started (PID: {proc.pid})")
        self.load_governance()

    @work(thread=True, exclusive=True, group="governance-action")
    def _toggle_agent_governance(self, enabled: bool) -> None:
        if not self.selected_agent_id:
            self.notify("Select an agent first.", severity="warning")
            return
        try:
            from cli.openclaw_runtime import (
                ensure_personal_assistant_binding,
                update_binding_governance,
            )
            from cli.faramesh_runtime import (
                ensure_faramesh_installed,
                is_faramesh_available,
                start_faramesh_daemon,
                FAREMESH_SOCKET_PATH,
                _get_default_policy_path,
            )

            if enabled:
                ensure_faramesh_installed(install_if_missing=True, non_interactive=True)
                if not is_faramesh_available():
                    default_policy = _get_default_policy_path()
                    start_faramesh_daemon(
                        policy_path=default_policy, socket_path=FAREMESH_SOCKET_PATH
                    )

            binding = ensure_personal_assistant_binding(assistant_id=self.selected_agent_id)
            policy = _get_default_policy_path() if enabled else None
            update_binding_governance(
                binding,
                enabled=enabled,
                policy=policy,
                assistant_name=self.selected_agent_id,
            )
            self.call_from_thread(
                self.notify,
                f"Governance {'enabled' if enabled else 'disabled'} for {self.selected_agent_id}",
            )
        except Exception as e:
            self.call_from_thread(self.notify, f"Error: {e}", severity="error")

    @work(thread=True, exclusive=True, group="agent-action")
    def deploy_selected_agent_worker(self, agent_id: str) -> None:
        try:
            agent = self.agents_service.get_agent(agent_id)
            agent = self.agents_service.ensure_openclaw_binding(
                agent,
                install_if_missing=False,
                install_method="npm",
                no_input=True,
            )
            result = self.agents_service.deploy_agent(agent_id)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(
            self._after_action,
            f"Deploy started for {_shorten(agent_id, 12)} ({result.status or 'pending'})",
            True,
        )

    @work(thread=True, exclusive=True, group="deployment-action")
    def restart_selected_deployment_worker(self, deployment_id: str) -> None:
        try:
            deployment = self.deployments_service.restart_deployment(deployment_id)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(
            self._after_action,
            f"Restarted {_shorten(deployment.id, 12)} -> {deployment.status}",
            False,
        )

    @work(thread=True, exclusive=True, group="deployment-action")
    def scale_selected_deployment_worker(self, deployment_id: str, replicas: int) -> None:
        try:
            deployment = self.deployments_service.scale_deployment(deployment_id, replicas=replicas)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(
            self._after_action,
            f"Scaled {_shorten(deployment.id, 12)} to {deployment.replicas} replicas",
            False,
        )

    @work(thread=True, exclusive=True, group="deployment-action")
    def delete_selected_deployment_worker(self, deployment_id: str) -> None:
        try:
            self.deployments_service.delete_deployment(deployment_id)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        self.call_from_thread(
            self._after_action,
            f"Deleted {_shorten(deployment_id, 12)}",
            False,
        )

    def _after_action(self, message: str, refresh_agents: bool) -> None:
        self.notify(message, severity="information")
        self._set_notice(message)
        self._clear_activity()
        self._set_activity("loading setup")
        self.load_setup()
        if refresh_agents:
            self._set_activity("loading agents")
            self.load_agents()
        self._set_activity("loading deployments")
        self.load_deployments()
        self._set_activity("loading control plane")
        self.load_control_plane()

    @on(DataTable.RowSelected, "#agents-table")
    def on_agent_row_selected(self, event: DataTable.RowSelected) -> None:
        agent_id = str(event.row_key.value)
        self.selected_agent_id = agent_id
        self._set_activity(f"loading {_shorten(agent_id, 12)}")
        self.load_agent_detail(agent_id)

    @on(DataTable.RowSelected, "#deployments-table")
    def on_deployment_row_selected(self, event: DataTable.RowSelected) -> None:
        deployment_id = str(event.row_key.value)
        self.selected_deployment_id = deployment_id
        self._set_activity(f"loading {_shorten(deployment_id, 12)}")
        self.load_deployment_detail(deployment_id)

    @on(DataTable.RowSelected, "#governance-pending-table")
    def on_governance_row_selected(self, event: DataTable.RowSelected) -> None:
        token = str(event.row_key.value)
        self._governance_selected_token = token
        self.query_one("#governance-approve", Button).disabled = False
        self.query_one("#governance-deny", Button).disabled = False

    @on(DataTable.RowSelected, "#observability-runs-table")
    def on_observability_row_selected(self, event: DataTable.RowSelected) -> None:
        run_id = str(event.row_key.value)
        self._set_activity(f"loading run {run_id[:12]}...")
        self.load_run_detail(run_id)

    def load_run_detail(self, run_id: str) -> None:
        """Load detailed view of a specific run."""
        try:
            from cli.services import ObservabilityService

            service = ObservabilityService(config=self.config)
            run = service.get_run(run_id)
            self.call_from_thread(self._update_run_detail, run)
        except Exception as e:
            self.call_from_thread(self._update_run_detail_error, str(e))

    def _update_run_detail(self, run: dict) -> None:
        lines = [
            f"Run: {run.get('id', '-')}",
            f"Agent: {run.get('agent_id', '-')}",
            f"Status: {run.get('status', '-')}",
            f"Model: {run.get('model', '-')}",
            "",
            "Steps:",
        ]
        steps = run.get("steps", [])
        for i, step in enumerate(steps[:10], 1):
            step_type = step.get("type", "-")
            tool = step.get("tool_name", "-") or "-"
            success = step.get("success", "?")
            duration = step.get("duration_ms", 0) or 0
            lines.append(f"  {i}. [{step_type}] {tool} - {success} ({duration}ms)")

        if len(steps) > 10:
            lines.append(f"  ... and {len(steps) - 10} more steps")

        if run.get("cost"):
            cost = run["cost"]
            lines.append("")
            lines.append("Cost:")
            lines.append(f"  Input tokens: {cost.get('input_tokens', 0)}")
            lines.append(f"  Output tokens: {cost.get('output_tokens', 0)}")
            lines.append(f"  Cost: ${cost.get('cost_usd', 0):.4f}")

        self.query_one("#observability-body", Static).update("\n".join(lines))

    def _update_run_detail_error(self, error: str) -> None:
        self.query_one("#observability-body", Static).update(f"Error loading run: {error}")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        if button_id == "setup-refresh":
            self.load_setup()
        elif button_id == "setup-import":
            self._run_setup_wizard(requested_action="import")
        elif button_id == "setup-configure-openclaw":
            self._open_openclaw_surface("tui")
        elif button_id == "setup-openclaw-tui":
            self._open_openclaw_surface("tui")
        elif button_id == "setup-deploy":
            self.action_deploy_selected_agent()
        elif button_id == "agents-refresh":
            self.load_agents()
        elif button_id == "agents-deploy":
            self.action_deploy_selected_agent()
        elif button_id == "agents-enable-governance":
            self._toggle_agent_governance(enabled=True)
        elif button_id == "agents-disable-governance":
            self._toggle_agent_governance(enabled=False)
        elif button_id == "deployments-refresh":
            self.load_deployments()
        elif button_id == "deployments-restart":
            self.action_restart_selected_deployment()
        elif button_id == "deployments-scale":
            self.action_scale_selected_deployment()
        elif button_id == "deployments-delete":
            self.action_delete_selected_deployment()
        elif button_id == "control-refresh":
            self.load_control_plane()
        elif button_id == "governance-refresh":
            self.load_governance()
        elif button_id == "governance-start":
            self._start_faramesh_daemon()
        elif button_id == "governance-approve":
            self._governance_approve_selected()
        elif button_id == "governance-deny":
            self._governance_deny_selected()
        elif button_id == "observability-refresh":
            self.load_observability()

    def action_refresh_current(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        if active == "setup-pane":
            self._set_activity("loading setup")
            self.load_setup()
        elif active == "agents-pane":
            self._set_activity("loading agents")
            self.load_agents()
        elif active == "control-pane":
            self._set_activity("loading control plane")
            self.load_control_plane()
        elif active == "governance-pane":
            self._set_activity("loading governance")
            self.load_governance()
        elif active == "observability-pane":
            self._set_activity("loading observability")
            self.load_observability()
        else:
            self._set_activity("loading deployments")
            self.load_deployments()

    def action_deploy_selected_agent(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        if active == "setup-pane":
            self._run_setup_wizard(requested_action=None)
            return
        if not self.selected_agent_id:
            self.notify("Select an agent first.", severity="warning")
            return
        agent = self._agent_cache.get(self.selected_agent_id)
        if agent is not None and agent.type == "openclaw":
            self._deploy_openclaw_agent(self.selected_agent_id)
            return
        self._set_activity(f"deploying {_shorten(self.selected_agent_id, 12)}")
        self.deploy_selected_agent_worker(self.selected_agent_id)

    def action_restart_selected_deployment(self) -> None:
        if not self.selected_deployment_id:
            self.notify("Select a deployment first.", severity="warning")
            return

        deployment_id = self.selected_deployment_id

        def _handle(confirm: bool) -> None:
            if confirm:
                self._set_activity(f"restarting {_shorten(deployment_id, 12)}")
                self.restart_selected_deployment_worker(deployment_id)

        self.push_screen(
            ConfirmActionScreen(
                "Restart deployment",
                f"Restart deployment {_shorten(deployment_id, 12)}?",
            ),
            _handle,
        )

    def action_scale_selected_deployment(self) -> None:
        if not self.selected_deployment_id:
            self.notify("Select a deployment first.", severity="warning")
            return

        deployment = self._deployment_cache.get(self.selected_deployment_id)
        current_replicas = deployment.replicas if deployment else 1
        deployment_id = self.selected_deployment_id

        def _handle(replicas: int | None) -> None:
            if replicas is not None:
                self._set_activity(f"scaling {_shorten(deployment_id, 12)}")
                self.scale_selected_deployment_worker(deployment_id, replicas)

        self.push_screen(ScaleDeploymentScreen(current_replicas), _handle)

    def action_delete_selected_deployment(self) -> None:
        if not self.selected_deployment_id:
            self.notify("Select a deployment first.", severity="warning")
            return

        deployment_id = self.selected_deployment_id

        def _handle(confirm: bool) -> None:
            if confirm:
                self._set_activity(f"deleting {_shorten(deployment_id, 12)}")
                self.delete_selected_deployment_worker(deployment_id)

        self.push_screen(
            ConfirmActionScreen(
                "Delete deployment",
                f"Delete deployment {_shorten(deployment_id, 12)}? This cannot be undone.",
            ),
            _handle,
        )
