"""TUI command for mutx CLI."""

import click


@click.command(name="tui")
def tui_command():
    """Launch the Textual TUI interface."""
    try:
        from cli.tui.app import run_tui
        run_tui()
    except ImportError:
        raise click.ClickException(
            "Textual is not installed. Install with: pip install mutx[tui]"
        )
