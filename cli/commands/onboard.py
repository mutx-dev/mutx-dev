import click

from cli.commands.tui import launch_tui
from cli.config import current_config, get_client
from cli.services import AuthService


@click.command(name="onboard")
@click.option(
    "--open-tui",
    is_flag=True,
    default=False,
    help="Skip menu and open TUI directly (if already authenticated)",
)
@click.pass_context
def onboard_command(ctx: click.Context, open_tui: bool):
    """Guided first-run onboarding: create account, set up assistant, open TUI."""
    config = current_config()
    auth_service = AuthService(config=config, client_factory=get_client)
    auth_status = auth_service.status()

    if auth_status.authenticated:
        _handle_authenticated(ctx, auth_service, open_tui)
    else:
        _handle_unauthenticated(ctx)


def _handle_authenticated(ctx: click.Context, auth_service: AuthService, open_tui: bool):
    if open_tui:
        click.echo("Opening MUTX TUI...")
        launch_tui()
        return

    click.echo("")
    click.echo("You are already signed in.")
    click.echo("")
    click.echo("  1.  Open MUTX TUI  (recommended)")
    click.echo("  2.  Sign in with a different account")
    click.echo("  3.  Later")
    click.echo("")

    selection = click.prompt("Select an action", type=click.IntRange(1, 3), default=1)

    if selection == 1:
        click.echo("Opening MUTX TUI...")
        launch_tui()
    elif selection == 2:
        click.echo("Reauthenticating...")
        ctx.invoke(_get_setup_hosted_command(), register=False)
    else:
        click.echo("Run 'mutx onboard' when ready to continue.")


def _handle_unauthenticated(ctx: click.Context):
    click.echo("")
    click.echo("  1.  Hosted  (recommended)  — sign up or log in to your MUTX account")
    click.echo("  2.  Local   (advanced)       — run everything on this machine")
    click.echo("  3.  Later")
    click.echo("")

    selection = click.prompt("Select a lane", type=click.IntRange(1, 3), default=1)

    if selection == 1:
        _handle_hosted_account_flow(ctx)
    elif selection == 2:
        click.echo("Launching local setup...")
        ctx.invoke(_get_setup_local_command())
    else:
        click.echo("Run 'mutx onboard' when ready to continue.")


def _handle_hosted_account_flow(ctx: click.Context) -> None:
    click.echo("")
    click.echo("  1.  Create a new MUTX account  (recommended)")
    click.echo("  2.  Sign in to an existing account")
    click.echo("  3.  Back")
    click.echo("")

    selection = click.prompt("Select a hosted action", type=click.IntRange(1, 3), default=1)

    if selection == 1:
        click.echo("Launching hosted setup — create a new account...")
        ctx.invoke(_get_setup_hosted_command(), register=True)
    elif selection == 2:
        click.echo("Launching hosted setup — sign in to an existing account...")
        ctx.invoke(_get_setup_hosted_command(), register=False)
    else:
        click.echo("Run 'mutx onboard' when ready to continue.")


def _get_setup_hosted_command():
    from cli.commands.setup import setup_hosted

    return setup_hosted


def _get_setup_local_command():
    from cli.commands.setup import setup_local

    return setup_local
