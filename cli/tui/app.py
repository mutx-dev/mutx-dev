from __future__ import annotations

import json

from textual import on, work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import ModalScreen
from textual.widgets import (
    Button,
    DataTable,
    Footer,
    Header,
    Input,
    Label,
    Static,
    TabbedContent,
    TabPane,
)

from cli.services import (
    AgentRecord,
    AgentsService,
    AuthService,
    CLIServiceError,
    DeploymentEventHistory,
    DeploymentRecord,
    DeploymentsService,
    LogEntry,
    MetricPoint,
)


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


class ConfirmActionScreen(ModalScreen[bool]):
    CSS = """
    ConfirmActionScreen {
        align: center middle;
    }

    #confirm-dialog {
        width: 60;
        height: auto;
        border: round #6f8d9a;
        background: #12222b;
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
        border: round #6f8d9a;
        background: #12222b;
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
        background: #0b1318;
        color: #e5eef2;
    }

    Header {
        background: #133042;
        color: #f5fbff;
    }

    Footer {
        background: #08141c;
        color: #98aeb9;
    }

    #status-banner {
        height: 2;
        padding: 0 1;
        background: #10212b;
        color: #d4e0e7;
    }

    TabbedContent {
        height: 1fr;
    }

    TabPane {
        padding: 0;
    }

    .workspace-split {
        height: 1fr;
    }

    .panel {
        border: round #4a6978;
        background: #101c24;
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
        self.deployments_service = DeploymentsService()
        self.selected_agent_id: str | None = None
        self.selected_deployment_id: str | None = None
        self._deployment_cache: dict[str, DeploymentRecord] = {}

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        yield Static(id="status-banner")
        with TabbedContent(id="workspace"):
            with TabPane("Agents", id="agents-pane"):
                with Horizontal(classes="workspace-split"):
                    yield DataTable(id="agents-table", classes="panel entity-table")
                    with Vertical(classes="panel detail-panel"):
                        yield Static("Agent detail", id="agents-summary")
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
        yield Footer()

    def on_mount(self) -> None:
        self._configure_tables()
        self._refresh_status_banner()

        if self.auth_service.status().authenticated:
            self.load_agents()
            self.load_deployments()
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

    def _refresh_status_banner(self, message: str | None = None) -> None:
        status = self.auth_service.status()
        auth_state = "logged in" if status.authenticated else "local only"
        banner = f"API: {status.api_url} | Auth: {auth_state} | Config: {status.config_path}"
        if message:
            banner = f"{banner} | {message}"

        self.sub_title = status.api_url
        self.query_one("#status-banner", Static).update(banner)

    def _render_logged_out_state(self) -> None:
        message = (
            "No stored CLI auth. Run `mutx login --email you@example.com` and relaunch `mutx tui`."
        )
        self.query_one("#agents-summary", Static).update("Agents unavailable")
        self.query_one("#deployments-summary", Static).update("Deployments unavailable")
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

    def _handle_service_error(self, error: CLIServiceError) -> None:
        self.notify(str(error), severity="error")
        self._refresh_status_banner(str(error))

    def _render_agents(self, agents: list[AgentRecord]) -> None:
        table = self.query_one("#agents-table", DataTable)
        table.clear(columns=False)
        if not agents:
            self.selected_agent_id = None
            self.query_one("#agent-detail-body", Static).update("No agents found.")
            self.query_one("#agent-logs-body", Static).update("No logs found.")
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
        self.load_agent_detail(agents[0].id)
        self.query_one("#agents-summary", Static).update(
            f"Agents: {len(agents)} | Selected: {agents[0].name}"
        )
        self._refresh_status_banner("Agents refreshed")

    def _render_agent_payload(self, agent: AgentRecord, logs: list[LogEntry]) -> None:
        self.query_one("#agent-detail-body", Static).update(_render_agent_detail(agent))
        self.query_one("#agent-logs-body", Static).update(
            _render_logs(logs, empty="No agent logs found.")
        )
        self.query_one("#agents-summary", Static).update(
            f"Agent: {agent.name} | Status: {agent.status} | Deployments: {len(agent.deployments)}"
        )

    def _render_deployments(self, deployments: list[DeploymentRecord]) -> None:
        table = self.query_one("#deployments-table", DataTable)
        table.clear(columns=False)
        self._deployment_cache = {deployment.id: deployment for deployment in deployments}
        if not deployments:
            self.selected_deployment_id = None
            self.query_one("#deployment-detail-body", Static).update("No deployments found.")
            self.query_one("#deployment-events-body", Static).update("No deployment events found.")
            self.query_one("#deployment-logs-body", Static).update("No deployment logs found.")
            self.query_one("#deployment-metrics-body", Static).update(
                "No deployment metrics found."
            )
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
        self.load_deployment_detail(deployments[0].id)
        self.query_one("#deployments-summary", Static).update(
            f"Deployments: {len(deployments)} | Selected: {_shorten(deployments[0].id, 12)}"
        )
        self._refresh_status_banner("Deployments refreshed")

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

    @work(thread=True, exclusive=True, group="agent-action")
    def deploy_selected_agent_worker(self, agent_id: str) -> None:
        try:
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
        self._refresh_status_banner(message)
        if refresh_agents:
            self.load_agents()
        self.load_deployments()

    @on(DataTable.RowSelected, "#agents-table")
    def on_agent_row_selected(self, event: DataTable.RowSelected) -> None:
        agent_id = str(event.row_key.value)
        self.selected_agent_id = agent_id
        self.load_agent_detail(agent_id)

    @on(DataTable.RowSelected, "#deployments-table")
    def on_deployment_row_selected(self, event: DataTable.RowSelected) -> None:
        deployment_id = str(event.row_key.value)
        self.selected_deployment_id = deployment_id
        self.load_deployment_detail(deployment_id)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        if button_id == "agents-refresh":
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

    def action_refresh_current(self) -> None:
        active = self.query_one("#workspace", TabbedContent).active
        if active == "agents-pane":
            self.load_agents()
        else:
            self.load_deployments()

    def action_deploy_selected_agent(self) -> None:
        if not self.selected_agent_id:
            self.notify("Select an agent first.", severity="warning")
            return
        self.deploy_selected_agent_worker(self.selected_agent_id)

    def action_restart_selected_deployment(self) -> None:
        if not self.selected_deployment_id:
            self.notify("Select a deployment first.", severity="warning")
            return

        deployment_id = self.selected_deployment_id

        def _handle(confirm: bool) -> None:
            if confirm:
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
                self.scale_selected_deployment_worker(deployment_id, replicas)

        self.push_screen(ScaleDeploymentScreen(current_replicas), _handle)

    def action_delete_selected_deployment(self) -> None:
        if not self.selected_deployment_id:
            self.notify("Select a deployment first.", severity="warning")
            return

        deployment_id = self.selected_deployment_id

        def _handle(confirm: bool) -> None:
            if confirm:
                self.delete_selected_deployment_worker(deployment_id)

        self.push_screen(
            ConfirmActionScreen(
                "Delete deployment",
                f"Delete deployment {_shorten(deployment_id, 12)}? This cannot be undone.",
            ),
            _handle,
        )
