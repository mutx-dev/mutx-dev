import click

from cli.config import CLIConfig, get_client
from cli.commands.agents import agents_group
from cli.commands.api_keys import api_keys_group
from cli.commands.clawhub import clawhub_group
from cli.commands.config import config_group
from cli.commands.deploy import deploy_group
from cli.commands.tui import tui_command
from cli.commands.webhooks import webhooks_group
from cli.services import AuthService, CLIServiceError


@click.group()
@click.option("--api-url", default=None, help="API URL (overrides config)")
@click.pass_context
def cli(ctx, api_url):
    """mutx.dev CLI - Deploy and manage agents"""
    ctx.ensure_object(dict)
    config = CLIConfig()
    if api_url:
        config.api_url = api_url
    ctx.obj["config"] = config


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


def _auth_service() -> AuthService:
    return AuthService(config=CLIConfig(), client_factory=get_client)


@cli.command(name="login")
@click.option("--email", "-e", required=True, help="Email address")
@click.option("--password", "-p", prompt=True, hide_input=True, help="Password")
@click.option("--api-url", "-u", default=None, help="API URL")
def login(email: str, password: str, api_url: str):
    """Login to mutx.dev"""
    try:
        _auth_service().login(email=email, password=password, api_url=api_url)
        click.echo("Logged in successfully!")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@cli.command(name="logout")
def logout():
    """Logout from mutx.dev"""
    if not _auth_service().logout():
        click.echo("No local access token is stored.")
        click.echo("Run 'mutx status' to inspect current CLI state.")
        return

    click.echo("Logged out successfully.")
    click.echo("Local access and refresh tokens cleared.")
    click.echo("Run 'mutx status' to confirm local auth state.")


@cli.command(name="whoami")
def whoami():
    """Show current user info"""
    try:
        user = _auth_service().whoami()
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    click.echo(f"Email: {user.email}")
    click.echo(f"Name: {user.name}")
    click.echo(f"Plan: {user.plan}")


@cli.command(name="status")
def status():
    """Show CLI status"""
    cli_status = _auth_service().status()
    click.echo(f"API URL: {cli_status.api_url}")
    if cli_status.authenticated:
        click.echo("Status: Logged in")
    else:
        click.echo("Status: Not logged in")


cli.add_command(agents_group)
cli.add_command(api_keys_group)
cli.add_command(clawhub_group)
cli.add_command(deploy_group)
cli.add_command(config_group)
cli.add_command(webhooks_group)
cli.add_command(tui_command)


if __name__ == "__main__":
    cli()
