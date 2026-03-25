from __future__ import annotations

from dataclasses import dataclass

from textual import on
from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, DataTable, Input, Label, Static


def _safe_row_key(event: DataTable.RowSelected) -> str | None:
    row_key = getattr(event, "row_key", None)
    if row_key is None:
        return None
    value = getattr(row_key, "value", row_key)
    if value in (None, ""):
        return None
    return str(value)


@dataclass(slots=True)
class CommandEntry:
    id: str
    label: str
    description: str


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


class ShortcutHelpScreen(ModalScreen[None]):
    CSS = """
    ShortcutHelpScreen {
        align: center middle;
    }

    #shortcut-dialog {
        width: 76;
        height: auto;
        border: round #2563eb;
        background: #050816;
        padding: 1 2;
    }
    """

    def compose(self) -> ComposeResult:
        with Vertical(id="shortcut-dialog"):
            yield Label("Cockpit shortcuts")
            yield Static(
                "\n".join(
                    [
                        "r      refresh current surface",
                        "enter  default row action",
                        "ctrl+k open command palette",
                        "?      show this help",
                        "o      open hosted dashboard",
                        "tab    next focus",
                        "shift+tab previous focus",
                        "d      deploy selected workspace",
                        "x      restart selected deployment",
                        "s      scale selected deployment",
                        "backspace delete selected deployment",
                    ]
                )
            )
            yield Button("Close", id="shortcut-close", variant="primary")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(None)


class CommandPaletteScreen(ModalScreen[str | None]):
    CSS = """
    CommandPaletteScreen {
        align: center middle;
    }

    #palette-dialog {
        width: 82;
        height: auto;
        border: round #2563eb;
        background: #050816;
        padding: 1 2;
    }

    #palette-table {
        height: 12;
        margin-top: 1;
    }

    #palette-actions {
        height: auto;
        margin-top: 1;
    }

    #palette-actions Button {
        margin-right: 1;
    }
    """

    def __init__(self, entries: list[CommandEntry]):
        super().__init__()
        self._entries = entries
        self._selected_command_id: str | None = None

    def compose(self) -> ComposeResult:
        with Vertical(id="palette-dialog"):
            yield Label("Command palette")
            yield Input(placeholder="Filter commands…", id="palette-filter")
            yield DataTable(id="palette-table")
            with Horizontal(id="palette-actions"):
                yield Button("Run", id="palette-run", variant="primary")
                yield Button("Close", id="palette-close")

    def on_mount(self) -> None:
        table = self.query_one("#palette-table", DataTable)
        table.cursor_type = "row"
        table.zebra_stripes = True
        table.add_columns("Command", "Description")
        self._populate()

    def _populate(self, query: str = "") -> None:
        needle = query.strip().lower()
        table = self.query_one("#palette-table", DataTable)
        table.clear(columns=False)
        filtered = [
            entry
            for entry in self._entries
            if not needle
            or needle in entry.label.lower()
            or needle in entry.description.lower()
        ]
        for entry in filtered:
            table.add_row(entry.label, entry.description, key=entry.id)
        if filtered:
            table.cursor_coordinate = (0, 0)
            self._selected_command_id = filtered[0].id
        else:
            self._selected_command_id = None

    @on(Input.Changed, "#palette-filter")
    def on_filter_changed(self, event: Input.Changed) -> None:
        self._populate(event.value)

    @on(DataTable.RowSelected, "#palette-table")
    def on_row_selected(self, event: DataTable.RowSelected) -> None:
        command_id = _safe_row_key(event)
        if command_id:
            self._selected_command_id = command_id
            self.dismiss(command_id)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "palette-close":
            self.dismiss(None)
            return
        self.dismiss(self._selected_command_id)
