"""TUI command for MUTX CLI."""

import click


@click.command(name="tui")
def tui_command():
    """Launch the MUTX Textual TUI."""
    try:
        from cli.tui.app import run_tui

        run_tui()
    except ImportError:
        click.echo("Error: TUI dependencies not installed.", err=True)
        click.echo("Install with: pip install mutx[tui]", err=True)
        raise click.Abort()


@click.group(name="tui")
def tui_group():
    """MUTX TUI commands."""
    pass


tui_group.add_command(tui_command)
