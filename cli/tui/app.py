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

from cli.openclaw_runtime import collect_openclaw_runtime_snapshot, persist_openclaw_runtime_snapshot
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
from cli.setup_wizard import mark_auth_completed, run_openclaw_setup_wizard


MUTX_ASCII_LOGO = """\
                     ≠≠
                    ≠≠≠≠
                   ≠====≠
                 ≠≠======≠≠
                ≠≠=========≠  ==≠≠≠≈≈≈
               =======÷======  ÷÷=====≠=
             =======÷÷÷÷=======  ÷======≠
            =======÷÷   ÷=======  ÷÷=====≠
           ==÷====×   ÷  ÷÷====÷  ≠======≠
         ==÷÷÷÷÷÷÷  ÷==÷  ÷÷==÷  =======÷
        ==÷÷÷÷÷÷÷  ÷======  ÷÷ =======÷÷
       =÷÷÷÷÷÷÷÷ =÷÷=======   =======÷÷
     ==÷÷÷÷÷÷÷   ÷÷===÷÷÷÷÷  ==÷÷÷÷÷÷
    ==÷÷÷÷÷÷÷  ÷  ÷÷÷÷==÷  ==÷÷÷÷÷÷÷ ==
   =÷÷÷÷÷÷÷÷  ÷=÷  ÷÷÷÷÷  ÷=÷÷÷÷÷÷÷ ==÷=
  =÷÷÷÷÷÷÷   ÷÷===  ÷÷÷  ÷=÷÷÷÷÷×÷÷=÷÷÷÷=≠
 ÷÷÷÷÷÷÷÷   ×÷==÷÷==    ===÷÷÷÷÷  ÷÷÷÷÷÷÷=≠
 ÷÷÷÷÷÷÷     ×÷÷÷÷÷== =====÷÷÷÷    ≠÷÷÷÷÷÷=
 ÷÷÷÷÷        ÷÷÷÷÷÷===÷÷==÷÷÷       ÷÷÷÷÷=
 ÷÷÷÷           ÷÷÷÷÷÷÷÷÷÷÷÷          ÷÷÷÷=
 ÷÷÷             ÷÷÷÷÷÷÷÷÷÷            ÷÷÷=
 ÷÷               ÷÷÷÷÷÷÷÷              ÷÷=
                   ÷÷÷÷÷÷                 =
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
    binding_line = "No binding tracked yet."
    if isinstance(bindings, list) and bindings:
        binding = bindings[0] if isinstance(bindings[0], dict) else {}
        binding_line = (
            f"assistant_id={binding.get('assistant_id') or 'n/a'} | "
            f"workspace={binding.get('workspace') or 'n/a'}"
        )

    last_error = str(onboarding.get("last_error") or "").strip()
    status = str(onboarding.get("status") or "pending")
    current_step = str(onboarding.get("current_step") or "auth")
    gateway_status = str(runtime_snapshot.get("status") or gateway.get("status") or "unknown")
    gateway_url = str(runtime_snapshot.get("gateway_url") or gateway.get("gateway_url") or "n/a")
    install_method = str(runtime_snapshot.get("install_method") or "npm")
    last_seen = str(runtime_snapshot.get("last_seen_at") or "n/a")
    binary_path = str(runtime_snapshot.get("binary_path") or "n/a")
    tracking_mode = str(runtime_snapshot.get("tracking_mode") or "track_external_runtime")
    privacy_summary = str(runtime_snapshot.get("privacy_summary") or "Local-only runtime tracking.")

    lines = [
        f"API URL: {api_url}",
        f"Auth: {'ready' if authenticated else 'required'}",
        f"Assistant: {assistant_name or 'not deployed'}",
        "",
        f"Wizard status: {status} | current: {current_step}",
        *_render_provider_lines(onboarding),
        "",
        *_render_step_lines(onboarding),
        "",
        "Runtime:",
        f"  provider=openclaw | install={install_method} | gateway={gateway_status}",
        f"  binary={binary_path}",
        f"  url={gateway_url}",
        f"  home={runtime_snapshot.get('home_path') or 'n/a'}",
        f"  config={runtime_snapshot.get('config_path') or 'n/a'}",
        f"  tracking={tracking_mode}",
        f"  last_seen={last_seen}",
        "",
        "Binding:",
        f"  {binding_line}",
        "",
        "Privacy:",
        f"  {privacy_summary}",
    ]
    if last_error:
        lines.extend(["", f"Last error: {last_error}"])
    if not authenticated:
        lines.extend(
            [
                "",
                "Run `mutx setup hosted` or `mutx setup local` first, then return here to continue the provider wizard.",
            ]
        )
    elif not assistant_name:
        lines.extend(["", "Use Deploy Personal Assistant to run the OpenClaw provider wizard."])
    else:
        lines.extend(["", "OpenClaw is tracked under ~/.mutx/providers/openclaw and overlaid into Control Plane."])
    return "\n".join(lines)


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
        width: 46;
        min-width: 46;
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

    def compose(self) -> ComposeResult:
        with Horizontal(id="brand-rail"):
            yield Static(MUTX_ASCII_LOGO, id="brand-art")
            with Vertical(id="brand-meta"):
                yield Static("MUTX operator terminal", id="brand-title")
                yield Static(MUTX_OPERATOR_COPY, id="brand-copy")
                yield Static(id="brand-signal")
                yield Static("setup · assistant · deployments · control plane", id="brand-context")
        yield Static(id="status-banner")
        with TabbedContent(id="workspace"):
            with TabPane("Setup", id="setup-pane"):
                with Vertical(classes="panel detail-panel"):
                    yield Static("Setup workspace", id="setup-summary")
                    with Horizontal(classes="action-bar"):
                        yield Button("Refresh", id="setup-refresh", variant="primary")
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
            MUTX_SIGNAL_PATTERN[(offset + index) % len(MUTX_SIGNAL_PATTERN)] for index in range(width)
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
        self.query_one("#brand-signal", Static).update(self._brand_signal_text(status.authenticated))
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
            "Setup complete" if assistant_name else f"Setup {str(onboarding.get('status') or 'pending')}"
        )
        self.query_one("#setup-body", Static).update(
            _render_setup_body(status.authenticated, status.api_url, assistant_name, onboarding, runtime_snapshot)
        )
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
        self.query_one("#setup-summary", Static).update(
            f"OpenClaw wizard | {step} | {state}"
        )
        self.query_one("#setup-body", Static).update(
            _render_setup_body(
                self.auth_service.status().authenticated,
                self.auth_service.status().api_url,
                self._assistant_name,
                self._wizard_state_cache,
                self._runtime_snapshot_cache,
            )
        )
        self._set_notice(message)

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

    def _run_setup_wizard(self) -> None:
        status = self.auth_service.status()
        if not status.authenticated:
            self.notify("Authenticate with `mutx setup hosted` or `mutx setup local` first.", severity="warning")
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
                progress=self._render_setup_progress,
                install_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Installing OpenClaw",
                ),
                onboard_command_runner=lambda command: self._run_external_command(
                    command,
                    label="🦞 Onboarding OpenClaw gateway",
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
        self.call_from_thread(self._render_setup_payload, assistant_name, onboarding, runtime_snapshot)

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

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        if button_id == "setup-refresh":
            self.load_setup()
        elif button_id == "setup-deploy":
            self.action_deploy_selected_agent()
        elif button_id == "agents-refresh":
            self.load_agents()
        elif button_id == "agents-deploy":
            self.action_deploy_selected_agent()
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
        else:
            self._set_activity("loading deployments")
            self.load_deployments()

    def action_deploy_selected_agent(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        if active == "setup-pane":
            self._run_setup_wizard()
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
