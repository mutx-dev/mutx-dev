"""TUI command for MUTX CLI."""

import click


def launch_tui() -> None:
    from cli.tui import run_tui

    run_tui()


@click.command(name="tui")
def tui_command():
    """Launch the MUTX Textual TUI."""
    try:
        launch_tui()
    except ModuleNotFoundError as exc:
        if exc.name == "textual" or str(exc.name).startswith("textual."):
            click.echo(
                'Error: TUI dependencies not installed. Reinstall with `pip install -e ".[tui]"`.',
                err=True,
            )
            raise click.Abort()
        raise
    except ImportError:
        click.echo("Error: TUI dependencies not installed.", err=True)
        click.echo('Install with: pip install -e ".[tui]"', err=True)
        raise click.Abort()
