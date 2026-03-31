import click

from cli.config import CLIConfig, get_client
from cli.commands.agents import agents_group
from cli.commands.api_keys import api_keys_group
from cli.commands.clawhub import clawhub_group
from cli.commands.deploy import deploy_group
from cli.commands.config import config_group
from cli.commands.webhooks import webhooks_group
from cli.commands.tui import tui_group
from cli.commands.scheduler import scheduler_group
from cli.commands.observability import runs_group
from cli.commands.budgets import budgets_group
from cli.commands.usage import usage_group


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


@cli.command(name="login")
@click.option("--email", "-e", required=True, help="Email address")
@click.option("--password", "-p", prompt=True, hide_input=True, help="Password")
@click.option("--api-url", "-u", default=None, help="API URL")
def login(email: str, password: str, api_url: str):
    """Login to mutx.dev"""
    config = CLIConfig()

    if api_url:
        config.api_url = api_url
    elif not config.api_url:
        config.api_url = "http://localhost:8000"

    client = get_client(config)
    response = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
    )

    if response.status_code == 200:
        tokens = response.json()
        config.api_key = tokens.get("access_token")
        config.refresh_token = tokens.get("refresh_token")
        click.echo("Logged in successfully!")
    elif response.status_code == 401:
        click.echo("Error: Invalid email or password", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@cli.command(name="logout")
def logout():
    """Logout from mutx.dev"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("No local access token is stored.")
        click.echo("Run 'mutx status' to inspect current CLI state.")
        return

    config.clear_auth()
    click.echo("Logged out successfully.")
    click.echo("Local access and refresh tokens cleared.")
    click.echo("Run 'mutx status' to confirm local auth state.")


@cli.command(name="whoami")
def whoami():
    """Show current user info"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Not logged in. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/v1/auth/me")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        user = response.json()
        click.echo(f"Email: {user['email']}")
        click.echo(f"Name: {user['name']}")
        click.echo(f"Plan: {user['plan']}")
    else:
        click.echo(f"Error: {response.text}", err=True)


@cli.command(name="status")
def status():
    """Show CLI status"""
    config = CLIConfig()
    click.echo(f"API URL: {config.api_url}")
    if config.is_authenticated():
        click.echo("Status: Logged in")
    else:
        click.echo("Status: Not logged in")


cli.add_command(agents_group)
cli.add_command(api_keys_group)
cli.add_command(clawhub_group)
cli.add_command(deploy_group)
cli.add_command(config_group)
cli.add_command(webhooks_group)
cli.add_command(tui_group)
cli.add_command(scheduler_group)
cli.add_command(runs_group)
cli.add_command(budgets_group)
cli.add_command(usage_group)


if __name__ == "__main__":
    cli()
