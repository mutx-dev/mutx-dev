"""Main TUI Application for mutx CLI."""

from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import Header, Button, Static, ListView, ListItem
from textual.screen import Screen
from textual.binding import Binding
from textual import work

from cli.config import CLIConfig, get_client


class AgentsScreen(Screen):
    """Screen for listing and managing agents."""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Vertical(
            Static("📋 Agents", classes="title"),
            ListView(id="agents-list"),
            Horizontal(
                Button("Refresh", id="refresh", variant="primary"),
                Button("Back", id="back", variant="default"),
            ),
            id="agents-screen",
        )

    def on_mount(self) -> None:
        self.load_agents()

    @work(exclusive=True)
    async def load_agents(self):
        """Load agents from API."""
        list_view = self.query_one("#agents-list", ListView)
        list_view.clear()

        try:
            config = CLIConfig()
            client = get_client(config)
            response = client.get("/v1/agents")

            if response.status_code == 200:
                agents = response.json()
                for agent in agents:
                    agent_id = agent.get("id", "unknown")[:8]
                    agent_name = agent.get("name", "unnamed")
                    status = agent.get("status", "unknown")
                    list_view.append(ListItem(Static(f"{agent_id} - {agent_name} [{status}]")))
            else:
                list_view.append(ListItem(Static(f"Error: {response.status_code}")))
        except Exception as e:
            list_view.append(ListItem(Static(f"Error: {str(e)}")))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "back":
            self.app.pop_screen()
        elif event.button.id == "refresh":
            self.load_agents()


class DeploymentsScreen(Screen):
    """Screen for listing and managing deployments."""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Vertical(
            Static("🚀 Deployments", classes="title"),
            ListView(id="deployments-list"),
            Horizontal(
                Button("Refresh", id="refresh", variant="primary"),
                Button("Back", id="back", variant="default"),
            ),
            id="deployments-screen",
        )

    def on_mount(self) -> None:
        self.load_deployments()

    @work(exclusive=True)
    async def load_deployments(self):
        """Load deployments from API."""
        list_view = self.query_one("#deployments-list", ListView)
        list_view.clear()

        try:
            config = CLIConfig()
            client = get_client(config)
            response = client.get("/v1/deployments")

            if response.status_code == 200:
                deployments = response.json()
                for deploy in deployments:
                    deploy_id = deploy.get("id", "unknown")[:8]
                    agent_id = deploy.get("agent_id", "unknown")[:8]
                    status = deploy.get("status", "unknown")
                    list_view.append(ListItem(Static(f"{deploy_id} - Agent:{agent_id} [{status}]")))
            else:
                list_view.append(ListItem(Static(f"Error: {response.status_code}")))
        except Exception as e:
            list_view.append(ListItem(Static(f"Error: {str(e)}")))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "back":
            self.app.pop_screen()
        elif event.button.id == "refresh":
            self.load_deployments()


class MutxTUI(App):
    """Main TUI Application."""

    CSS = """
    Screen {
        background: $surface;
    }
    .title {
        text-align: center;
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }
    #agents-screen, #deployments-screen {
        height: 100%;
    }
    ListView {
        height: 80%;
        margin-bottom: 1;
    }
    Horizontal {
        align: center middle;
        height: auto;
    }
    Button {
        margin: 0 1;
    }
    """

    BINDINGS = [
        Binding("a", "push_screen('agents')", "Agents"),
        Binding("d", "push_screen('deployments')", "Deployments"),
        Binding("q", "quit", "Quit"),
        Binding("escape", "pop_screen", "Back"),
    ]

    def compose(self) -> ComposeResult:
        yield Header()
        yield Vertical(
            Static("🖥️  mutx TUI", classes="title"),
            Static("Navigate: [A]gents | [D]eployments | [Q]uit"),
            id="main-menu",
        )

    def action_push_screen(self, screen_name: str) -> None:
        """Push a screen by name."""
        if screen_name == "agents":
            self.push_screen(AgentsScreen())
        elif screen_name == "deployments":
            self.push_screen(DeploymentsScreen())

    def action_quit(self) -> None:
        """Quit the application."""
        self.exit()


def run_tui():
    """Entry point for the TUI."""
    app = MutxTUI()
    app.run()


if __name__ == "__main__":
    run_tui()
