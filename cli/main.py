import click

from cli.config import CLIConfig, get_client
from cli.commands.agents import agents_group
from cli.commands.api_keys import api_keys_group
from cli.commands.clawhub import clawhub_group
from cli.commands.deploy import deploy_group
from cli.commands.webhooks import webhooks_group


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
    
    click.echo("=== mutx CLI Status ===")
    click.echo(f"Config file: {config.config_path}")
    click.echo(f"API URL: {config.api_url}")
    
    # Check API connectivity
    try:
        client = get_client(config)
        health_response = client.get("/health", timeout=5.0)
        if health_response.status_code == 200:
            click.echo("API: ✓ Reachable")
        else:
            click.echo(f"API: ⚠ Status {health_response.status_code}")
    except Exception as e:
        click.echo(f"API: ✗ Unreachable ({type(e).__name__})")
    
    # Auth status
    if config.is_authenticated():
        click.echo("Auth: ✓ Logged in")
        
        # Show user info
        try:
            client = get_client(config)
            user_response = client.get("/v1/auth/me", timeout=5.0)
            if user_response.status_code == 200:
                user = user_response.json()
                click.echo(f"User: {user.get('email', 'N/A')}")
                click.echo(f"Plan: {user.get('plan', 'N/A')}")
            elif user_response.status_code == 401:
                click.echo("Auth: ⚠ Token may be expired")
        except Exception:
            pass
        
        # Show agent count
        try:
            client = get_client(config)
            agents_response = client.get("/v1/agents", params={"limit": 1}, timeout=5.0)
            if agents_response.status_code == 200:
                agents = agents_response.json()
                click.echo(f"Agents: {len(agents)} (use 'mutx agents list' for details)")
        except Exception:
            pass
    else:
        click.echo("Auth: ✗ Not logged in")
    
    click.echo("========================")


cli.add_command(agents_group)
cli.add_command(api_keys_group)
cli.add_command(clawhub_group)
cli.add_command(deploy_group)
cli.add_command(webhooks_group)


if __name__ == "__main__":
    cli()
