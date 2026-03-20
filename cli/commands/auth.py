import click

from cli.config import current_config, get_client
from cli.services import AuthService, CLIServiceError


@click.group(name="auth")
def auth_group():
    """Manage authentication."""
    pass


def _service() -> AuthService:
    return AuthService(config=current_config(), client_factory=get_client)


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


@auth_group.command(name="login")
@click.option("--email", "-e", required=True, help="Email address")
@click.option("--password", "-p", prompt=True, hide_input=True, help="Password")
def login_command(email: str, password: str):
    try:
        _service().login(email=email, password=password)
        click.echo("Logged in successfully.")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@auth_group.command(name="register")
@click.option("--name", "-n", required=True, help="Display name")
@click.option("--email", "-e", required=True, help="Email address")
@click.option("--password", "-p", prompt=True, hide_input=True, help="Password")
def register_command(name: str, email: str, password: str):
    try:
        _service().register(name=name, email=email, password=password)
        click.echo("Registered and logged in successfully.")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@auth_group.command(name="logout")
def logout_command():
    if not _service().logout():
        click.echo("No local access token is stored.")
        return
    click.echo("Logged out successfully.")


@auth_group.command(name="whoami")
def whoami_command():
    try:
        user = _service().whoami()
        click.echo(f"{user.email} | {user.name} | {user.plan}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@auth_group.command(name="status")
def status_command():
    status = _service().status()
    click.echo(f"API URL: {status.api_url}")
    click.echo(f"Source: {status.api_url_source}")
    click.echo(f"Authenticated: {'yes' if status.authenticated else 'no'}")
