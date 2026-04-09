from __future__ import annotations

import subprocess
import threading
import time
import webbrowser

try:
    from textual import on, work
    from textual.app import App, ComposeResult
    from textual.binding import Binding
    from textual.css.query import NoMatches
    from textual.containers import Horizontal, Vertical, VerticalScroll
    from textual.widgets import Button, DataTable, Footer, Static, TabbedContent, TabPane
    _TEXTUAL_AVAILABLE = True
except ImportError:
    _TEXTUAL_AVAILABLE = False
    # Stubs so the module can be imported for introspection without textual installed
    App = object
    ComposeResult = None
    Binding = None
    Horizontal = Vertical = VerticalScroll = object
    Button = DataTable = Footer = Static = TabbedContent = TabPane = object
    def on(*a, **kw): pass
    def work(*a, **kw):
        def decorator(fn): return fn
        return decorator

from cli.config import current_config
from cli.faramesh_runtime import get_pending_defers, get_recent_decisions
from cli.openclaw_runtime import open_openclaw_surface, persist_openclaw_runtime_snapshot
from cli.runtime_registry import load_wizard_state
from cli.services import (
    AgentsService,
    AssistantService,
    AuthService,
    CLIServiceError,
    DeploymentRecord,
    DeploymentsService,
    LogEntry,
    ObservabilityService,
    RuntimeStateService,
    TemplatesService,
)
from cli.setup_wizard import (
    mark_auth_completed,
    prepare_runtime_state_sync,
    run_openclaw_setup_wizard,
)
from cli.tui.cockpit import build_cockpit_snapshot
from cli.tui.models import (
    CockpitSnapshot,
    IncidentRecord,
    SelectionContext,
    SessionRecord,
    WorkspaceRecord,
)
from cli.tui.renderers import (
    render_deployment_inspector,
    render_openclaw_runtime_detail as _render_openclaw_runtime_detail,
    render_setup_body as _render_setup_body,
    render_session_inspector,
    render_workspace_inspector,
    shorten,
)
from cli.tui.screens import (
    CommandEntry,
    CommandPaletteScreen,
    ConfirmActionScreen,
    ScaleDeploymentScreen,
    ShortcutHelpScreen,
    _safe_row_key,
)


MUTX_ASCII_LOGO = """\
 __  __ _   _ _____ __  __
|  \\/  | | | |_   _|\\ \\/ /
| |\\/| | | | | | |   \\  /
| |  | | |_| | | |   /  \\
|_|  |_|\\___/  |_|  /_/\\_\\
"""

MUTX_OPERATOR_COPY = "operator cockpit for agent infrastructure"
KEY_HINTS = "r refresh  enter action  ctrl+k commands  ? shortcuts  o dashboard"
MUTX_ACCENT_FRAMES = ("#3B82F6", "#2563EB", "#06B6D4", "#22D3EE")
MUTX_IDLE_FRAMES = ("◢", "◣", "◤", "◥")
MUTX_BUSY_FRAMES = ("◐", "◓", "◑", "◒")
MUTX_SIGNAL_PATTERN = "▁▂▃▄▅▆▇█▇▆▅▄▃▂"
HOSTED_DASHBOARD_URL = "https://app.mutx.dev/dashboard"
HOSTED_LOGIN_URL = "https://app.mutx.dev/login"


class MutxTUI(App[None]):
    TITLE = "mutx cockpit"
    CSS = """
    Screen {
        background: #02050b;
        color: #e5edf7;
    }

    Footer {
        background: #050816;
        color: #94a3b8;
    }

    #brand-rail {
        height: auto;
        padding: 1 2;
        background: #07111d;
        border-bottom: solid #16314f;
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
        padding: 0 1 0 2;
        background: #0b1727;
        color: #67e8f9;
        border: round #1d4ed8;
    }

    #brand-context {
        color: #64748b;
        margin-top: 1;
    }

    #brand-actions {
        height: auto;
        margin-top: 1;
    }

    #brand-actions Button {
        margin-right: 1;
    }

    #status-banner {
        height: 2;
        padding: 0 2;
        background: #0c1b2d;
        color: #dcecff;
        border-bottom: solid #1b3657;
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
        border: round #1c385b;
        background: #08111b;
    }

    .entity-table {
        width: 56;
        min-width: 48;
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
        padding: 1;
    }

    .detail-body {
        width: 1fr;
        color: #dbe5f0;
    }

    Button {
        background: #0d1b2f;
        color: #dbeafe;
        border: round #29486c;
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

    Button.-warning {
        background: #3a2508;
        color: #fde68a;
        border: round #f59e0b;
    }

    Button:focus {
        border: round #67e8f9;
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
        Binding("enter", "default_current_row", "Default Action"),
        Binding("ctrl+k", "open_command_palette", "Commands"),
        Binding("question_mark", "show_shortcuts", "Shortcuts"),
        Binding("d", "deploy_selected_agent", "Deploy"),
        Binding("x", "restart_selected_deployment", "Restart"),
        Binding("s", "scale_selected_deployment", "Scale"),
        Binding("o", "open_hosted_dashboard", "Dashboard"),
        Binding("backspace", "delete_selected_deployment", "Delete"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.auth_service = AuthService()
        self.config = getattr(self.auth_service, "config", current_config())
        self.agents_service = AgentsService()
        self.assistant_service = AssistantService()
        self.deployments_service = DeploymentsService()
        self.templates_service = TemplatesService()
        self.runtime_service = RuntimeStateService()
        self.observability_service = ObservabilityService()

        self._selection = SelectionContext()
        self._snapshot: CockpitSnapshot | None = None
        self._workspace_cache: dict[str, WorkspaceRecord] = {}
        self._incident_cache: dict[str, IncidentRecord] = {}
        self._session_cache: dict[str, SessionRecord] = {}
        self._deployment_cache: dict[str, DeploymentRecord] = {}
        self._governance_defers: list[object] = []
        self._governance_decisions: list[object] = []

        self._assistant_name: str | None = None
        self._operator_profile = "operator unknown"
        self._activity_label = "idle"
        self._activity_started_at: float | None = None
        self._notice_text: str | None = None
        self._notice_deadline = 0.0
        self._animation_tick = 0
        self._last_surface_refresh: dict[str, float] = {}
        self._external_command_running = False
        self._initial_workspace_selected = False

    def compose(self) -> ComposeResult:
        with Horizontal(id="brand-rail"):
            yield Static(MUTX_ASCII_LOGO, id="brand-art")
            with Vertical(id="brand-meta"):
                yield Static("MUTX operator cockpit", id="brand-title")
                yield Static(MUTX_OPERATOR_COPY, id="brand-copy")
                yield Static(id="brand-signal")
                yield Static(
                    "fleet · incidents · sessions · deployments · setup",
                    id="brand-context",
                )
                with Horizontal(id="brand-actions"):
                    yield Button("Open Dashboard", id="brand-open-dashboard", variant="primary")
                    yield Button("Refresh Auth", id="brand-refresh-auth")

        yield Static(id="status-banner")
        with TabbedContent(id="workspace"):
            with TabPane("Fleet", id="fleet-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="fleet-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Workspace fleet", id="fleet-summary-label")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="fleet-refresh", variant="primary")
                            yield Button("Open Session", id="fleet-open-session")
                            yield Button("Open OpenClaw", id="fleet-open-openclaw")
                            yield Button("Open Dashboard", id="fleet-open-dashboard")
                            yield Button("Deploy", id="fleet-deploy")
                        with TabbedContent(id="fleet-inspector-tabs"):
                            with TabPane("Summary"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="fleet-summary-body", classes="detail-body")
                            with TabPane("Activity"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="fleet-activity-body", classes="detail-body")
                            with TabPane("Logs"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="fleet-logs-body", classes="detail-body")
                            with TabPane("Events"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="fleet-events-body", classes="detail-body")
                            with TabPane("Actions"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="fleet-actions-body", classes="detail-body")

            with TabPane("Incidents", id="incidents-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="incidents-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Incident queue", id="incidents-summary-label")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="incidents-refresh", variant="primary")
                            yield Button("Jump", id="incidents-jump")
                            yield Button("Restart", id="incidents-restart")
                            yield Button("Open OpenClaw", id="incidents-open-openclaw")
                            yield Button("Open Dashboard", id="incidents-open-dashboard")
                        with TabbedContent(id="incidents-inspector-tabs"):
                            with TabPane("Summary"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="incidents-summary-body", classes="detail-body")
                            with TabPane("Activity"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(
                                        id="incidents-activity-body", classes="detail-body"
                                    )
                            with TabPane("Logs"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="incidents-logs-body", classes="detail-body")
                            with TabPane("Events"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="incidents-events-body", classes="detail-body")
                            with TabPane("Actions"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="incidents-actions-body", classes="detail-body")

            with TabPane("Sessions", id="sessions-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="sessions-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Live sessions", id="sessions-summary-label")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="sessions-refresh", variant="primary")
                            yield Button("Open Session", id="sessions-open-session")
                            yield Button("Open OpenClaw", id="sessions-open-openclaw")
                            yield Button("Open Dashboard", id="sessions-open-dashboard")
                        with TabbedContent(id="sessions-inspector-tabs"):
                            with TabPane("Summary"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="sessions-summary-body", classes="detail-body")
                            with TabPane("Activity"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="sessions-activity-body", classes="detail-body")
                            with TabPane("Logs"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="sessions-logs-body", classes="detail-body")
                            with TabPane("Events"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="sessions-events-body", classes="detail-body")
                            with TabPane("Actions"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="sessions-actions-body", classes="detail-body")

            with TabPane("Deployments", id="deployments-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="deployments-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Deployments", id="deployments-summary-label")
                        with Horizontal(classes="action-bar"):
                            yield Button("Refresh", id="deployments-refresh", variant="primary")
                            yield Button("Restart", id="deployments-restart")
                            yield Button("Scale", id="deployments-scale")
                            yield Button("Delete", id="deployments-delete", variant="error")
                            yield Button("Open Dashboard", id="deployments-open-dashboard")
                        with TabbedContent(id="deployments-inspector-tabs"):
                            with TabPane("Summary"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(
                                        id="deployments-summary-body", classes="detail-body"
                                    )
                            with TabPane("Activity"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(
                                        id="deployments-activity-body", classes="detail-body"
                                    )
                            with TabPane("Logs"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(id="deployments-logs-body", classes="detail-body")
                            with TabPane("Events"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(
                                        id="deployments-events-body", classes="detail-body"
                                    )
                            with TabPane("Actions"):
                                with VerticalScroll(classes="detail-scroll"):
                                    yield Static(
                                        id="deployments-actions-body", classes="detail-body"
                                    )

            with TabPane("Setup", id="setup-pane"):
                with Vertical(classes="panel detail-panel"):
                    yield Static("Setup workspace", id="setup-summary-label")
                    with Horizontal(classes="action-bar"):
                        yield Button("Refresh", id="setup-refresh", variant="primary")
                        yield Button("Import Existing OpenClaw", id="setup-import")
                        yield Button("Repair in OpenClaw", id="setup-configure-openclaw")
                        yield Button("Open OpenClaw", id="setup-open-openclaw")
                        yield Button("Deploy Managed Assistant", id="setup-deploy")
                    with VerticalScroll(classes="detail-scroll"):
                        yield Static(id="setup-body", classes="detail-body")

        yield Static(id="context-footer")
        yield Footer()

    def _invoke_ui(self, callback, *args, **kwargs):
        if getattr(self, "_thread_id", None) == threading.get_ident():
            return callback(*args, **kwargs)
        return self.call_from_thread(callback, *args, **kwargs)

    def on_mount(self) -> None:
        self._configure_tables()
        self.set_interval(0.2, self._advance_animation)
        self.set_interval(1.0, self._maybe_auto_refresh)
        self._refresh_chrome()

        if self.auth_service.status().authenticated:
            self.query_one("#workspace", TabbedContent).active = "fleet-pane"
            self.load_operator_profile()
            self._set_activity("loading cockpit")
            self.load_cockpit()
        else:
            self.query_one("#workspace", TabbedContent).active = "setup-pane"
            self._render_logged_out_state()

    def _configure_tables(self) -> None:
        fleet = self.query_one("#fleet-table", DataTable)
        fleet.cursor_type = "row"
        fleet.zebra_stripes = True
        fleet.add_columns("Workspace", "Status", "Managed", "Sessions", "Activity", "Incident")

        incidents = self.query_one("#incidents-table", DataTable)
        incidents.cursor_type = "row"
        incidents.zebra_stripes = True
        incidents.add_columns("Severity", "Workspace", "Status", "Summary", "Sessions")

        sessions = self.query_one("#sessions-table", DataTable)
        sessions.cursor_type = "row"
        sessions.zebra_stripes = True
        sessions.add_columns("Assistant", "Channel", "Age", "Tokens", "Source")

        deployments = self.query_one("#deployments-table", DataTable)
        deployments.cursor_type = "row"
        deployments.zebra_stripes = True
        deployments.add_columns("Deployment", "Status", "Workspace", "Replicas")

    def _active_workspace(self) -> str:
        active = self.query_one("#workspace", TabbedContent).active
        mapping = {
            "fleet-pane": "fleet",
            "incidents-pane": "incidents",
            "sessions-pane": "sessions",
            "deployments-pane": "deployments",
            "setup-pane": "setup",
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

    def _selected_workspace(self) -> WorkspaceRecord | None:
        if self._selection.workspace_id:
            return self._workspace_cache.get(self._selection.workspace_id)
        if self._selection.incident_id:
            incident = self._incident_cache.get(self._selection.incident_id)
            if incident is not None:
                return self._workspace_cache.get(incident.workspace_id)
        if self._selection.session_id:
            session = self._session_cache.get(self._selection.session_id)
            if session is not None:
                return self._workspace_cache.get(session.assistant_id)
        return None

    def _selected_incident(self) -> IncidentRecord | None:
        if not self._selection.incident_id:
            return None
        return self._incident_cache.get(self._selection.incident_id)

    def _selected_session(self) -> SessionRecord | None:
        if not self._selection.session_id:
            return None
        return self._session_cache.get(self._selection.session_id)

    def _selected_deployment(self) -> DeploymentRecord | None:
        if self._selection.deployment_id:
            return self._deployment_cache.get(self._selection.deployment_id)
        workspace = self._selected_workspace()
        if workspace is not None and workspace.deployment_id:
            return self._deployment_cache.get(workspace.deployment_id)
        incident = self._selected_incident()
        if incident is not None and incident.deployment_id:
            return self._deployment_cache.get(incident.deployment_id)
        return None

    def _selected_agent_id(self) -> str | None:
        workspace = self._selected_workspace()
        return workspace.agent_id if workspace is not None else None

    def _selected_session_key(self) -> str | None:
        session = self._selected_session()
        if session is not None and session.key:
            return session.key
        workspace = self._selected_workspace()
        if workspace is not None:
            return workspace.default_session_key
        return None

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

        workspace_count = len(self._workspace_cache)
        incident_count = len(self._incident_cache)
        session_count = len(self._session_cache)
        deployment_count = len(self._deployment_cache)

        banner = (
            f"{self._status_glyph(busy)} mutx cockpit | API: {status.api_url} | Auth: {auth_state}"
            f" | {self._activity_label}{elapsed}{notice}"
        )
        self.sub_title = status.api_url
        try:
            status_banner = self.query_one("#status-banner", Static)
            brand_signal = self.query_one("#brand-signal", Static)
            brand_context = self.query_one("#brand-context", Static)
            context_footer = self.query_one("#context-footer", Static)
            brand_art = self.query_one("#brand-art", Static)
        except NoMatches:
            return

        status_banner.update(banner)
        brand_signal.update(self._brand_signal_text(status.authenticated))
        selected_workspace = self._selected_workspace()
        selected_deployment = self._selected_deployment()
        brand_context.update(
            f"{self._operator_profile} · workspaces {workspace_count} · incidents {incident_count} · sessions {session_count} · deployments {deployment_count} · selected {selected_workspace.name if selected_workspace else 'none'}"
        )
        context_footer.update(
            f"{KEY_HINTS} | dashboard {self._hosted_dashboard_url()} | workspace {self._active_workspace()} | selected workspace {shorten(selected_workspace.assistant_id if selected_workspace else None, 18)} | selected deployment {shorten(selected_deployment.id if selected_deployment else None, 12)}"
        )
        accent = MUTX_ACCENT_FRAMES[self._animation_tick % len(MUTX_ACCENT_FRAMES)]
        brand_art.styles.color = accent
        brand_signal.styles.color = accent

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

    def _hosted_dashboard_url(self) -> str:
        return (
            HOSTED_DASHBOARD_URL if self.auth_service.status().authenticated else HOSTED_LOGIN_URL
        )

    def _open_hosted_dashboard(self) -> None:
        url = self._hosted_dashboard_url()
        if webbrowser.open(url):
            self._set_notice(f"Opened {url}")
            return
        self.notify(f"Unable to open {url}", severity="error")

    def _external_work_paused(self) -> bool:
        return self._external_command_running or len(self.screen_stack) > 1

    def _advance_animation(self) -> None:
        self._animation_tick += 1
        self._refresh_chrome()

    def _mark_surfaces_refreshed(self) -> None:
        now = time.monotonic()
        for surface in (
            "fleet-pane",
            "incidents-pane",
            "sessions-pane",
            "deployments-pane",
            "setup-pane",
        ):
            self._last_surface_refresh[surface] = now

    def _maybe_auto_refresh(self) -> None:
        if not self.auth_service.status().authenticated or self._external_work_paused():
            return
        active = self.query_one("#workspace", TabbedContent).active
        if active == "setup-pane":
            return
        interval = 10.0 if active == "deployments-pane" else 5.0
        last = self._last_surface_refresh.get(active, 0.0)
        if time.monotonic() - last < interval:
            return
        if self._activity_label != "idle":
            return
        self._set_activity(f"auto-refresh {self._active_workspace()}")
        self.load_cockpit()
        if active == "deployments-pane" and self._selection.deployment_id:
            self.load_deployment_detail(self._selection.deployment_id)
        elif active == "fleet-pane" and self._selection.workspace_id:
            self.load_workspace_detail(self._selection.workspace_id, surface="fleet-pane")
        elif active == "incidents-pane" and self._selection.incident_id:
            incident = self._selected_incident()
            if incident is not None:
                self.load_workspace_detail(incident.workspace_id, surface="incidents-pane")
        elif active == "sessions-pane" and self._selection.session_id:
            self._render_selected_session_detail()

    def _update_body(
        self, prefix: str, *, summary: str, activity: str, logs: str, events: str, actions: str
    ) -> None:
        self.query_one(f"#{prefix}-summary-body", Static).update(summary)
        self.query_one(f"#{prefix}-activity-body", Static).update(activity)
        self.query_one(f"#{prefix}-logs-body", Static).update(logs)
        self.query_one(f"#{prefix}-events-body", Static).update(events)
        self.query_one(f"#{prefix}-actions-body", Static).update(actions)

    def _render_logged_out_state(self) -> None:
        self._workspace_cache.clear()
        self._incident_cache.clear()
        self._session_cache.clear()
        self._deployment_cache.clear()
        self._assistant_name = None
        self._operator_profile = "operator unauthenticated"
        onboarding = load_wizard_state("openclaw")
        runtime_snapshot = persist_openclaw_runtime_snapshot().to_payload()
        message = _render_setup_body(
            False,
            self.auth_service.status().api_url,
            None,
            onboarding,
            runtime_snapshot,
        )
        self.query_one("#setup-summary-label", Static).update("Setup required")
        self.query_one("#setup-body", Static).update(message)
        self.query_one("#fleet-summary-label", Static).update("Workspace fleet unavailable")
        self.query_one("#incidents-summary-label", Static).update("Incidents unavailable")
        self.query_one("#sessions-summary-label", Static).update("Sessions unavailable")
        self.query_one("#deployments-summary-label", Static).update("Deployments unavailable")
        for prefix, text in (
            ("fleet", message),
            ("incidents", "Incident data requires an authenticated session."),
            ("sessions", "Session data requires an authenticated session."),
            ("deployments", "Deployment data requires an authenticated session."),
        ):
            self._update_body(
                prefix,
                summary=text,
                activity=text,
                logs=text,
                events=text,
                actions=text,
            )
        self._refresh_setup_actions(runtime_snapshot)
        self._refresh_action_states()
        self._clear_activity()

    @work(thread=True, exclusive=True, group="auth-profile")
    def load_operator_profile(self) -> None:
        try:
            profile = self.auth_service.whoami()
        except CLIServiceError as exc:
            self.call_from_thread(self._set_notice, str(exc), ttl=8.0)
            return

        self.call_from_thread(
            setattr, self, "_operator_profile", f"{profile.email} · {profile.plan}"
        )
        self.call_from_thread(self._refresh_chrome)

    def _refresh_setup_actions(self, runtime_snapshot: dict[str, object]) -> None:
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

        repair_button = self.query_one("#setup-configure-openclaw", Button)
        repair_button.display = needs_repair
        repair_button.disabled = not needs_repair

        open_button = self.query_one("#setup-open-openclaw", Button)
        open_button.display = has_openclaw
        open_button.disabled = not has_openclaw

        deploy_button = self.query_one("#setup-deploy", Button)
        deploy_button.display = not assistant_exists
        deploy_button.disabled = not self.auth_service.status().authenticated

    def _refresh_action_states(self) -> None:
        authenticated = self.auth_service.status().authenticated
        workspace = self._selected_workspace()
        incident = self._selected_incident()
        session = self._selected_session()
        deployment = self._selected_deployment()
        session_key = self._selected_session_key()

        self.query_one("#fleet-open-session", Button).disabled = not bool(session_key)
        self.query_one("#fleet-open-openclaw", Button).disabled = not bool(workspace)
        self.query_one("#fleet-open-dashboard", Button).disabled = False
        self.query_one("#fleet-deploy", Button).disabled = not (
            authenticated
            and workspace is not None
            and workspace.managed_by_mutx
            and workspace.agent_id
        )

        self.query_one("#incidents-jump", Button).disabled = not bool(incident)
        self.query_one("#incidents-restart", Button).disabled = not (
            authenticated and incident is not None and incident.deployment_id
        )
        self.query_one("#incidents-open-openclaw", Button).disabled = not bool(workspace)
        self.query_one("#incidents-open-dashboard", Button).disabled = False

        self.query_one("#sessions-open-session", Button).disabled = not bool(
            session and session.key
        )
        self.query_one("#sessions-open-openclaw", Button).disabled = not bool(session)
        self.query_one("#sessions-open-dashboard", Button).disabled = False

        self.query_one("#deployments-restart", Button).disabled = not (authenticated and deployment)
        self.query_one("#deployments-scale", Button).disabled = not (authenticated and deployment)
        self.query_one("#deployments-delete", Button).disabled = not (authenticated and deployment)
        self.query_one("#deployments-open-dashboard", Button).disabled = False

    def _resolve_workspace_row(
        self, table: DataTable, keys: list[str], selected_id: str | None
    ) -> str | None:
        if not keys:
            return None
        resolved = selected_id if selected_id in keys else keys[0]
        table.cursor_coordinate = (keys.index(resolved), 0)
        return resolved

    def _render_fleet_table(self, workspaces: list[WorkspaceRecord]) -> None:
        table = self.query_one("#fleet-table", DataTable)
        table.clear(columns=False)
        keys: list[str] = []
        for workspace in workspaces:
            keys.append(workspace.id)
            table.add_row(
                workspace.name,
                workspace.status,
                workspace.managed_label,
                str(workspace.session_count),
                workspace.last_activity_label,
                workspace.incident_severity,
                key=workspace.id,
            )
        self._selection.workspace_id = self._resolve_workspace_row(
            table, keys, self._selection.workspace_id
        )
        label = f"Workspace fleet | {len(workspaces)} workspaces"
        if workspaces:
            label += f" | critical {sum(1 for item in workspaces if item.incident_severity == 'critical')}"
        self.query_one("#fleet-summary-label", Static).update(label)

    def _render_incident_table(self, incidents: list[IncidentRecord]) -> None:
        table = self.query_one("#incidents-table", DataTable)
        table.clear(columns=False)
        keys: list[str] = []
        for incident in incidents:
            keys.append(incident.id)
            table.add_row(
                incident.severity,
                incident.workspace_name,
                incident.status,
                shorten(incident.summary, 42),
                str(incident.session_count),
                key=incident.id,
            )
        self._selection.incident_id = self._resolve_workspace_row(
            table, keys, self._selection.incident_id
        )
        self.query_one("#incidents-summary-label", Static).update(
            f"Incident queue | {len(incidents)} active"
        )

    def _render_sessions_table(self, sessions: list[SessionRecord]) -> None:
        table = self.query_one("#sessions-table", DataTable)
        table.clear(columns=False)
        keys: list[str] = []
        for session in sessions[:200]:
            keys.append(session.id)
            table.add_row(
                session.assistant_id,
                session.channel,
                session.age,
                session.tokens,
                session.source,
                key=session.id,
            )
        self._selection.session_id = self._resolve_workspace_row(
            table, keys, self._selection.session_id
        )
        self.query_one("#sessions-summary-label", Static).update(
            f"Live sessions | {len(sessions)} visible"
        )

    def _render_deployments_table(self, deployments: list[DeploymentRecord]) -> None:
        table = self.query_one("#deployments-table", DataTable)
        table.clear(columns=False)
        keys: list[str] = []
        workspace_by_agent = {
            workspace.agent_id: workspace
            for workspace in self._workspace_cache.values()
            if workspace.agent_id
        }
        for deployment in deployments:
            workspace = workspace_by_agent.get(deployment.agent_id)
            keys.append(deployment.id)
            table.add_row(
                shorten(deployment.id, 12),
                deployment.status,
                workspace.name if workspace is not None else shorten(deployment.agent_id, 12),
                str(deployment.replicas),
                key=deployment.id,
            )
        self._selection.deployment_id = self._resolve_workspace_row(
            table, keys, self._selection.deployment_id
        )
        self.query_one("#deployments-summary-label", Static).update(
            f"Deployments | {len(deployments)} visible"
        )

    def _apply_cockpit_snapshot(self, snapshot: CockpitSnapshot) -> None:
        self._snapshot = snapshot
        self._assistant_name = snapshot.assistant_name
        self._workspace_cache = {item.id: item for item in snapshot.workspaces}
        self._incident_cache = {item.id: item for item in snapshot.incidents}
        self._session_cache = {item.id: item for item in snapshot.sessions}
        self._deployment_cache = {item.id: item for item in snapshot.deployments}
        self._render_fleet_table(snapshot.workspaces)
        self._render_incident_table(snapshot.incidents)
        self._render_sessions_table(snapshot.sessions)
        self._render_deployments_table(snapshot.deployments)
        self.query_one("#setup-summary-label", Static).update(
            "Setup complete" if snapshot.assistant_name else "Setup available"
        )
        self.query_one("#setup-body", Static).update(
            _render_setup_body(
                self.auth_service.status().authenticated,
                self.auth_service.status().api_url,
                snapshot.assistant_name,
                snapshot.onboarding,
                snapshot.runtime_snapshot,
            )
        )
        self._refresh_setup_actions(snapshot.runtime_snapshot)
        self._mark_surfaces_refreshed()
        self._refresh_action_states()
        self._refresh_chrome()
        self._clear_activity()

        active = self.query_one("#workspace", TabbedContent).active
        if not self._initial_workspace_selected and self.auth_service.status().authenticated:
            self.query_one("#workspace", TabbedContent).active = "fleet-pane"
            self._initial_workspace_selected = True
            active = "fleet-pane"
        if active == "fleet-pane" and self._selection.workspace_id:
            self.load_workspace_detail(self._selection.workspace_id, surface="fleet-pane")
        elif active == "incidents-pane" and self._selection.incident_id:
            incident = self._selected_incident()
            if incident is not None:
                self.load_workspace_detail(incident.workspace_id, surface="incidents-pane")
        elif active == "sessions-pane" and self._selection.session_id:
            self._render_selected_session_detail()
        elif active == "deployments-pane" and self._selection.deployment_id:
            self.load_deployment_detail(self._selection.deployment_id)

    @work(thread=True, exclusive=True, group="cockpit")
    def load_cockpit(self) -> None:
        try:
            overview = self.assistant_service.overview()
            onboarding = load_wizard_state("openclaw")
            runtime_snapshot = persist_openclaw_runtime_snapshot(
                assistant_name=overview.name
                if overview
                else str(onboarding.get("assistant_name") or "") or None
            ).to_payload()
            agents = self.agents_service.list_agents(limit=100, skip=0)
            deployments = self.deployments_service.list_deployments(limit=100, skip=0)
            raw_sessions = self.assistant_service.list_sessions()
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return

        try:
            governance_defers = get_pending_defers()
        except Exception:
            governance_defers = []
        try:
            governance_decisions = get_recent_decisions(limit=20)
        except Exception:
            governance_decisions = []

        self._governance_defers = governance_defers
        self._governance_decisions = governance_decisions
        snapshot = build_cockpit_snapshot(
            runtime_snapshot=runtime_snapshot,
            onboarding=onboarding,
            assistant_name=overview.name if overview else None,
            agents=agents,
            deployments=deployments,
            raw_sessions=raw_sessions,
            governance_defers=governance_defers,
            governance_decisions=governance_decisions,
        )
        self.call_from_thread(self._apply_cockpit_snapshot, snapshot)

    def _governance_for_workspace(
        self, workspace: WorkspaceRecord
    ) -> tuple[list[object], list[object]]:
        keys = {workspace.assistant_id}
        if workspace.agent_id:
            keys.add(workspace.agent_id)
        defers = [
            item for item in self._governance_defers if str(getattr(item, "agent_id", "")) in keys
        ]
        decisions = [
            item
            for item in self._governance_decisions
            if str(getattr(item, "agent_id", "")) in keys
        ]
        return defers, decisions

    @work(thread=True, exclusive=True, group="workspace-detail")
    def load_workspace_detail(self, workspace_id: str, *, surface: str) -> None:
        workspace = self._workspace_cache.get(workspace_id)
        if workspace is None or self._snapshot is None:
            return
        logs: list[LogEntry] = []
        deployment_events = None
        deployment_logs: list[LogEntry] = []
        observability_runs: list[dict[str, object]] = []
        if workspace.agent_id:
            try:
                logs = self.agents_service.get_logs(workspace.agent_id, limit=50)
            except CLIServiceError:
                logs = []
            if workspace.deployment_id:
                try:
                    deployment_events = self.deployments_service.get_events(
                        workspace.deployment_id, limit=50
                    )
                    deployment_logs = self.deployments_service.get_logs(
                        workspace.deployment_id, limit=50
                    )
                except CLIServiceError:
                    deployment_events = None
                    deployment_logs = []
            try:
                observability_runs = self.observability_service.list_runs(
                    agent_id=workspace.agent_id, limit=10
                )
            except CLIServiceError:
                observability_runs = []
        sessions = [
            session
            for session in self._session_cache.values()
            if session.assistant_id == workspace.assistant_id
        ]
        governance_defers, governance_decisions = self._governance_for_workspace(workspace)
        incident = self._selected_incident() if surface == "incidents-pane" else None
        inspector = render_workspace_inspector(
            workspace=workspace,
            runtime_snapshot=self._snapshot.runtime_snapshot,
            sessions=sessions,
            logs=logs,
            deployment_events=deployment_events,
            deployment_logs=deployment_logs,
            observability_runs=observability_runs,
            governance_defers=governance_defers,
            governance_decisions=governance_decisions,
            incident=incident,
        )
        self.call_from_thread(self._apply_workspace_detail, surface, inspector)

    def _apply_workspace_detail(self, surface: str, inspector) -> None:
        prefix = "fleet" if surface == "fleet-pane" else "incidents"
        label = f"{inspector.workspace.name} | {inspector.workspace.status} | sessions {inspector.workspace.session_count}"
        self.query_one(f"#{prefix}-summary-label", Static).update(label)
        self._update_body(
            prefix,
            summary=inspector.summary,
            activity=inspector.activity,
            logs=inspector.logs,
            events=inspector.events,
            actions=inspector.actions,
        )
        self._refresh_action_states()
        self._clear_activity()

    def _render_selected_session_detail(self) -> None:
        session = self._selected_session()
        if session is None:
            self._update_body(
                "sessions",
                summary="No session selected.",
                activity="Select a session row to inspect it.",
                logs="No session logs.",
                events="No session events.",
                actions="Open Session becomes available when a row is selected.",
            )
            self._refresh_action_states()
            return
        workspace = self._workspace_cache.get(session.assistant_id)
        sections = render_session_inspector(session=session, workspace=workspace)
        self.query_one("#sessions-summary-label", Static).update(
            f"Live sessions | {session.assistant_id} | {session.channel}"
        )
        self._update_body(
            "sessions",
            summary=sections["summary"],
            activity=sections["activity"],
            logs=sections["logs"],
            events=sections["events"],
            actions=sections["actions"],
        )
        self._refresh_action_states()
        self._clear_activity()

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

        workspace = next(
            (
                item
                for item in self._workspace_cache.values()
                if item.agent_id == deployment.agent_id
            ),
            None,
        )
        sections = render_deployment_inspector(
            deployment=deployment,
            events=events,
            logs=logs,
            metrics=metrics,
            workspace=workspace,
        )
        self.call_from_thread(self._apply_deployment_detail, deployment, sections)

    def _apply_deployment_detail(
        self, deployment: DeploymentRecord, sections: dict[str, str]
    ) -> None:
        self._deployment_cache[deployment.id] = deployment
        self.query_one("#deployments-summary-label", Static).update(
            f"Deployments | {shorten(deployment.id, 12)} | {deployment.status}"
        )
        self._update_body(
            "deployments",
            summary=sections["summary"],
            activity=sections["activity"],
            logs=sections["logs"],
            events=sections["events"],
            actions=sections["actions"],
        )
        self._refresh_action_states()
        self._clear_activity()

    def _handle_service_error(self, error: CLIServiceError) -> None:
        self.notify(str(error), severity="error")
        self._set_notice(str(error), ttl=8.0)
        self._clear_activity()

    def _run_external_command(self, command: str | list[str], *, label: str) -> None:
        self._set_notice(label, ttl=12.0)
        self._refresh_chrome()
        self._external_command_running = True
        try:
            with self.suspend():
                if isinstance(command, str):
                    result = subprocess.run(["/bin/bash", "-lc", command], check=False)
                else:
                    result = subprocess.run(command, check=False)
        finally:
            self._external_command_running = False
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
                install_command_runner=lambda command: self._run_external_command(
                    command, label="Installing OpenClaw"
                ),
                onboard_command_runner=lambda command: self._run_external_command(
                    command, label="Onboarding OpenClaw gateway"
                ),
                configure_command_runner=lambda command: self._run_external_command(
                    command, label="Opening OpenClaw"
                ),
            )
        except CLIServiceError as exc:
            self._handle_service_error(exc)
            self.load_cockpit()
            return

        message = (
            f"Reused assistant {result.assistant_id}"
            if result.reused_existing_assistant
            else f"Deployed assistant {result.assistant_id}"
        )
        self.notify(message, severity="information")
        self._set_notice(message)
        self.query_one("#workspace", TabbedContent).active = "fleet-pane"
        self._set_activity("loading cockpit")
        self.load_cockpit()

    def _open_openclaw_surface(self, surface: str, *, session_key: str | None = None) -> None:
        runtime_snapshot = self._snapshot.runtime_snapshot if self._snapshot is not None else {}
        gateway_url = str(runtime_snapshot.get("gateway_url") or "") or None
        install_method = str(runtime_snapshot.get("install_method") or "npm")
        label = "Opening OpenClaw TUI" if surface == "tui" else "Opening OpenClaw configure"
        self._set_activity(label.lower())
        try:
            open_openclaw_surface(
                surface=surface,
                gateway_url=gateway_url,
                session_key=session_key,
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
            self.load_cockpit()
            return

        self.notify("Returned from OpenClaw", severity="information")
        self._set_notice("Returned from OpenClaw")
        self._set_activity("loading cockpit")
        self.load_cockpit()

    def _open_selected_session(self) -> None:
        session_key = self._selected_session_key()
        if not session_key:
            self.notify("No session available for the current selection.", severity="warning")
            return
        self._open_openclaw_surface("tui", session_key=session_key)

    def _open_selected_workspace(self) -> None:
        if self._selected_workspace() is None and self._selected_session() is None:
            self.notify("Select a workspace or session first.", severity="warning")
            return
        self._open_openclaw_surface("tui")

    def _command_entries(self) -> list[CommandEntry]:
        return [
            CommandEntry(
                "refresh", "Refresh current surface", "Reload the active cockpit surface."
            ),
            CommandEntry(
                "open-dashboard", "Open hosted dashboard", "Open app.mutx.dev in a browser."
            ),
            CommandEntry(
                "open-session", "Open selected session", "Jump into the selected OpenClaw session."
            ),
            CommandEntry(
                "open-workspace", "Open selected workspace", "Open the upstream OpenClaw TUI."
            ),
            CommandEntry("deploy", "Deploy selected workspace", "Trigger a managed deploy."),
            CommandEntry(
                "restart", "Restart selected deployment", "Restart the active deployment."
            ),
            CommandEntry(
                "scale",
                "Scale selected deployment",
                "Change replica count for the active deployment.",
            ),
            CommandEntry("delete", "Delete selected deployment", "Kill the active deployment."),
            CommandEntry("show-shortcuts", "Show shortcuts", "Open the shortcut reference."),
            CommandEntry("go-setup", "Open setup", "Switch to the setup surface."),
        ]

    def _dispatch_palette_command(self, command_id: str | None) -> None:
        if not command_id:
            return
        if command_id == "refresh":
            self.action_refresh_current()
        elif command_id == "open-dashboard":
            self.action_open_hosted_dashboard()
        elif command_id == "open-session":
            self._open_selected_session()
        elif command_id == "open-workspace":
            self._open_selected_workspace()
        elif command_id == "deploy":
            self.action_deploy_selected_agent()
        elif command_id == "restart":
            self.action_restart_selected_deployment()
        elif command_id == "scale":
            self.action_scale_selected_deployment()
        elif command_id == "delete":
            self.action_delete_selected_deployment()
        elif command_id == "show-shortcuts":
            self.action_show_shortcuts()
        elif command_id == "go-setup":
            self.query_one("#workspace", TabbedContent).active = "setup-pane"

    @on(DataTable.RowSelected, "#fleet-table")
    def on_fleet_row_selected(self, event: DataTable.RowSelected) -> None:
        workspace_id = _safe_row_key(event)
        if not workspace_id:
            return
        self._selection.workspace_id = workspace_id
        self._refresh_action_states()
        self._set_activity(f"loading {shorten(workspace_id, 18)}")
        self.load_workspace_detail(workspace_id, surface="fleet-pane")

    @on(DataTable.RowSelected, "#incidents-table")
    def on_incident_row_selected(self, event: DataTable.RowSelected) -> None:
        incident_id = _safe_row_key(event)
        if not incident_id:
            return
        self._selection.incident_id = incident_id
        incident = self._selected_incident()
        self._refresh_action_states()
        if incident is None:
            return
        self._set_activity(f"loading {shorten(incident.workspace_id, 18)}")
        self.load_workspace_detail(incident.workspace_id, surface="incidents-pane")

    @on(DataTable.RowSelected, "#sessions-table")
    def on_session_row_selected(self, event: DataTable.RowSelected) -> None:
        session_id = _safe_row_key(event)
        if not session_id:
            return
        self._selection.session_id = session_id
        self._refresh_action_states()
        self._render_selected_session_detail()

    @on(DataTable.RowSelected, "#deployments-table")
    def on_deployment_row_selected(self, event: DataTable.RowSelected) -> None:
        deployment_id = _safe_row_key(event)
        if not deployment_id:
            return
        self._selection.deployment_id = deployment_id
        self._refresh_action_states()
        self._set_activity(f"loading {shorten(deployment_id, 12)}")
        self.load_deployment_detail(deployment_id)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        if button_id == "brand-open-dashboard":
            self._open_hosted_dashboard()
        elif button_id == "brand-refresh-auth":
            self.load_operator_profile()
        elif button_id in {
            "fleet-refresh",
            "incidents-refresh",
            "sessions-refresh",
            "deployments-refresh",
            "setup-refresh",
        }:
            self.action_refresh_current()
        elif button_id == "fleet-open-session":
            self._open_selected_session()
        elif button_id == "fleet-open-openclaw":
            self._open_selected_workspace()
        elif button_id == "fleet-open-dashboard":
            self._open_hosted_dashboard()
        elif button_id == "fleet-deploy":
            self.action_deploy_selected_agent()
        elif button_id == "incidents-jump":
            self._jump_to_selected_incident()
        elif button_id == "incidents-restart":
            self.action_restart_selected_deployment()
        elif button_id == "incidents-open-openclaw":
            self._open_selected_workspace()
        elif button_id == "incidents-open-dashboard":
            self._open_hosted_dashboard()
        elif button_id == "sessions-open-session":
            self._open_selected_session()
        elif button_id == "sessions-open-openclaw":
            self._open_selected_workspace()
        elif button_id == "sessions-open-dashboard":
            self._open_hosted_dashboard()
        elif button_id == "deployments-restart":
            self.action_restart_selected_deployment()
        elif button_id == "deployments-scale":
            self.action_scale_selected_deployment()
        elif button_id == "deployments-delete":
            self.action_delete_selected_deployment()
        elif button_id == "deployments-open-dashboard":
            self._open_hosted_dashboard()
        elif button_id == "setup-import":
            self._run_setup_wizard(requested_action="import")
        elif button_id == "setup-configure-openclaw":
            self._open_openclaw_surface("configure")
        elif button_id == "setup-open-openclaw":
            self._open_openclaw_surface("tui")
        elif button_id == "setup-deploy":
            self.action_deploy_selected_agent()

    def action_open_command_palette(self) -> None:
        self.push_screen(
            CommandPaletteScreen(self._command_entries()), self._dispatch_palette_command
        )

    def action_show_shortcuts(self) -> None:
        self.push_screen(ShortcutHelpScreen())

    def action_open_hosted_dashboard(self) -> None:
        self._open_hosted_dashboard()

    def action_default_current_row(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        if active == "fleet-pane":
            if self._selection.workspace_id:
                self._set_activity(f"loading {shorten(self._selection.workspace_id, 18)}")
                self.load_workspace_detail(self._selection.workspace_id, surface="fleet-pane")
        elif active == "incidents-pane":
            self._jump_to_selected_incident()
        elif active == "sessions-pane":
            self._open_selected_session()
        elif active == "deployments-pane" and self._selection.deployment_id:
            self._set_activity(f"loading {shorten(self._selection.deployment_id, 12)}")
            self.load_deployment_detail(self._selection.deployment_id)

    def action_refresh_current(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        self._set_activity(f"loading {self._active_workspace()}")
        if active == "deployments-pane" and self._selection.deployment_id:
            self.load_deployment_detail(self._selection.deployment_id)
        elif active == "fleet-pane" and self._selection.workspace_id:
            self.load_workspace_detail(self._selection.workspace_id, surface="fleet-pane")
        elif active == "incidents-pane" and self._selection.incident_id:
            incident = self._selected_incident()
            if incident is not None:
                self.load_workspace_detail(incident.workspace_id, surface="incidents-pane")
        elif active == "sessions-pane" and self._selection.session_id:
            self._render_selected_session_detail()
        self.load_cockpit()

    def action_deploy_selected_agent(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        if active == "setup-pane":
            self._run_setup_wizard(requested_action=None)
            return
        workspace = self._selected_workspace()
        if workspace is None or not workspace.agent_id:
            self.notify("Select a managed workspace first.", severity="warning")
            return
        self._set_activity(f"deploying {shorten(workspace.assistant_id, 18)}")
        self.deploy_selected_agent_worker(workspace.agent_id)

    def _jump_to_selected_incident(self) -> None:
        incident = self._selected_incident()
        if incident is None:
            self.notify("Select an incident first.", severity="warning")
            return
        if incident.deployment_id:
            self.query_one("#workspace", TabbedContent).active = "deployments-pane"
            self._selection.deployment_id = incident.deployment_id
            self._refresh_action_states()
            self._set_activity(f"loading {shorten(incident.deployment_id, 12)}")
            self.load_deployment_detail(incident.deployment_id)
            return
        self.query_one("#workspace", TabbedContent).active = "fleet-pane"
        self._selection.workspace_id = incident.workspace_id
        self._refresh_action_states()
        self._set_activity(f"loading {shorten(incident.workspace_id, 18)}")
        self.load_workspace_detail(incident.workspace_id, surface="fleet-pane")

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
            f"Deploy started for {shorten(agent.name, 18)} ({result.status or 'pending'})",
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
            f"Restarted {shorten(deployment.id, 12)} -> {deployment.status}",
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
            f"Scaled {shorten(deployment.id, 12)} to {deployment.replicas} replicas",
        )

    @work(thread=True, exclusive=True, group="deployment-action")
    def delete_selected_deployment_worker(self, deployment_id: str) -> None:
        try:
            self.deployments_service.delete_deployment(deployment_id)
        except CLIServiceError as exc:
            self.call_from_thread(self._handle_service_error, exc)
            return
        self.call_from_thread(self._after_action, f"Deleted {shorten(deployment_id, 12)}")

    def _after_action(self, message: str) -> None:
        self.notify(message, severity="information")
        self._set_notice(message)
        self._clear_activity()
        self._set_activity("loading cockpit")
        self.load_cockpit()

    def action_restart_selected_deployment(self) -> None:
        deployment = self._selected_deployment()
        if deployment is None:
            self.notify("Select a deployment first.", severity="warning")
            return

        def _handle(confirm: bool) -> None:
            if confirm:
                self._set_activity(f"restarting {shorten(deployment.id, 12)}")
                self.restart_selected_deployment_worker(deployment.id)

        self.push_screen(
            ConfirmActionScreen(
                "Restart deployment",
                f"Restart deployment {shorten(deployment.id, 12)}?",
            ),
            _handle,
        )

    def action_scale_selected_deployment(self) -> None:
        deployment = self._selected_deployment()
        if deployment is None:
            self.notify("Select a deployment first.", severity="warning")
            return

        def _handle(replicas: int | None) -> None:
            if replicas is None:
                return
            self._set_activity(f"scaling {shorten(deployment.id, 12)}")
            self.scale_selected_deployment_worker(deployment.id, replicas)

        self.push_screen(ScaleDeploymentScreen(deployment.replicas), _handle)

    def action_delete_selected_deployment(self) -> None:
        deployment = self._selected_deployment()
        if deployment is None:
            self.notify("Select a deployment first.", severity="warning")
            return

        def _handle(confirm: bool) -> None:
            if confirm:
                self._set_activity(f"deleting {shorten(deployment.id, 12)}")
                self.delete_selected_deployment_worker(deployment.id)

        self.push_screen(
            ConfirmActionScreen(
                "Delete deployment",
                f"Delete deployment {shorten(deployment.id, 12)}?",
            ),
            _handle,
        )


__all__ = [
    "HOSTED_DASHBOARD_URL",
    "HOSTED_LOGIN_URL",
    "MUTX_ASCII_LOGO",
    "MutxTUI",
    "_render_openclaw_runtime_detail",
    "_render_setup_body",
]
