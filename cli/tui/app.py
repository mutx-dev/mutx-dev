"""Main MUTX TUI Application"""

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal
from textual.widgets import Header, Static, Button
from textual.binding import Binding


class MutxTUI(App):
    """MUTX Textual-based TUI shell."""

    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("c", "clear", "Clear", show=True),
        Binding("r", "refresh", "Refresh", show=True),
    ]

    CSS = """
    Screen {
        background: $surface;
    }
    
    #sidebar {
        width: 30;
        background: $panel;
        border-right: solid $border;
    }
    
    #main {
        width: 1fr;
    }
    
    .title {
        text-style: bold;
        color: $accent;
        padding: 1;
    }
    
    Button {
        margin: 1;
    }
    
    #status {
        dock: bottom;
        height: 3;
        background: $panel;
        border-top: solid $border;
    }
    """

    def compose(self) -> ComposeResult:
        """Create child widgets."""
        yield Header()

        with Horizontal():
            with Container(id="sidebar"):
                yield Static("MUTX", classes="title")
                yield Button("Agents", variant="primary", id="btn_agents")
                yield Button("Deployments", variant="primary", id="btn_deployments")
                yield Button("Config", variant="primary", id="btn_config")
                yield Button("Refresh", variant="default", id="btn_refresh")

            with Container(id="main"):
                yield Static("Welcome to MUTX TUI!", id="welcome")
                yield Static("Use the sidebar to navigate.", id="help")

        yield Static("Ready", id="status")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press events."""
        button_id = event.button.id

        if button_id == "btn_agents":
            self.query_one("#welcome", Static).update("Loading agents...")
            self.query_one("#help", Static).update("Agent list would appear here")
        elif button_id == "btn_deployments":
            self.query_one("#welcome", Static).update("Loading deployments...")
            self.query_one("#help", Static).update("Deployment list would appear here")
        elif button_id == "btn_config":
            self.query_one("#welcome", Static).update("Config")
            self.query_one("#help", Static).update("Configuration would appear here")
        elif button_id == "btn_refresh":
            self.action_refresh()

    def action_quit(self) -> None:
        """Quit the application."""
        self.exit()

    def action_clear(self) -> None:
        """Clear the main content."""
        self.query_one("#welcome", Static).update("Welcome to MUTX TUI!")
        self.query_one("#help", Static).update("Use the sidebar to navigate.")

    def action_refresh(self) -> None:
        """Refresh the view."""
        self.query_one("#status", Static).update("Refreshed at " + self.get_time())
        self.notify("Refreshed!")

    def get_time(self) -> str:
        """Get current time string."""
        from datetime import datetime

        return datetime.now().strftime("%H:%M:%S")


def run_tui() -> None:
    """Run the TUI application."""
    app = MutxTUI()
    app.run()
