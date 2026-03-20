import click

from cli.commands.tui import launch_tui
from cli.config import current_config, get_client
from cli.services import AuthService, CLIServiceError
from cli.services.assistant import TemplatesService


@click.group(name="setup")
def setup_group():
    """Guided assistant-first onboarding."""
    pass


def _auth_service() -> AuthService:
    return AuthService(config=current_config(), client_factory=get_client)


def _templates_service() -> TemplatesService:
    return TemplatesService(config=current_config(), client_factory=get_client)


def _require_value(label: str, value: str | None, no_input: bool, *, secret: bool = False) -> str:
    if value:
        return value
    if no_input:
        raise click.ClickException(f"{label} is required in --no-input mode.")
    return click.prompt(label, hide_input=secret)


def _finish_setup(
    *,
    assistant_name: str,
    description: str | None,
    replicas: int,
    model: str | None,
    workspace: str | None,
    open_tui: bool,
) -> None:
    result = _templates_service().deploy_template(
        "personal_assistant",
        name=assistant_name,
        description=description,
        replicas=replicas,
        model=model,
        workspace=workspace,
    )
    click.echo(f"Assistant deployed: {result['agent']['id']}")
    click.echo(f"Deployment: {result['deployment']['id']}")
    if open_tui:
        launch_tui()


@setup_group.command(name="hosted")
@click.option("--api-url", default=None, help="Hosted API base URL")
@click.option("--email", default=None, help="Account email")
@click.option("--password", default=None, help="Account password")
@click.option("--assistant-name", default="Personal Assistant", help="Assistant display name")
@click.option("--description", default=None, help="Assistant description")
@click.option("--replicas", default=1, type=int, help="Replica count")
@click.option("--model", default=None, help="Assistant model override")
@click.option("--workspace", default=None, help="Assistant workspace override")
@click.option("--open-tui", is_flag=True, help="Launch the TUI after setup")
@click.option("--no-input", is_flag=True, help="Disable prompts")
def setup_hosted(
    api_url: str | None,
    email: str | None,
    password: str | None,
    assistant_name: str,
    description: str | None,
    replicas: int,
    model: str | None,
    workspace: str | None,
    open_tui: bool,
    no_input: bool,
):
    config = current_config()
    if api_url:
        config.api_url = api_url

    try:
        _auth_service().login(
            email=_require_value("Email", email, no_input),
            password=_require_value("Password", password, no_input, secret=True),
        )
        _finish_setup(
            assistant_name=assistant_name,
            description=description,
            replicas=replicas,
            model=model,
            workspace=workspace,
            open_tui=open_tui,
        )
    except CLIServiceError as exc:
        raise click.ClickException(str(exc)) from exc


@setup_group.command(name="local")
@click.option("--email", default=None, help="Existing local account email (advanced)")
@click.option("--password", default=None, help="Existing local account password (advanced)")
@click.option("--name", "display_name", default="Local Operator", help="Local operator display name")
@click.option(
    "--register/--login-existing",
    default=True,
    help="Legacy credential flow when email and password are supplied",
)
@click.option("--assistant-name", default="Personal Assistant", help="Assistant display name")
@click.option("--description", default=None, help="Assistant description")
@click.option("--replicas", default=1, type=int, help="Replica count")
@click.option("--model", default=None, help="Assistant model override")
@click.option("--workspace", default=None, help="Assistant workspace override")
@click.option("--open-tui", is_flag=True, help="Launch the TUI after setup")
@click.option("--no-input", is_flag=True, help="Disable prompts")
def setup_local(
    email: str | None,
    password: str | None,
    display_name: str,
    register: bool,
    assistant_name: str,
    description: str | None,
    replicas: int,
    model: str | None,
    workspace: str | None,
    open_tui: bool,
    no_input: bool,
):
    current_config().api_url = "http://localhost:8000"

    try:
        if email or password:
            email_value = _require_value("Email", email, no_input)
            password_value = _require_value("Password", password, no_input, secret=True)
            if register:
                _auth_service().register(
                    name=display_name,
                    email=email_value,
                    password=password_value,
                )
            else:
                _auth_service().login(email=email_value, password=password_value)
        else:
            _auth_service().local_bootstrap(name=display_name)
        _finish_setup(
            assistant_name=assistant_name,
            description=description,
            replicas=replicas,
            model=model,
            workspace=workspace,
            open_tui=open_tui,
        )
    except CLIServiceError as exc:
        raise click.ClickException(str(exc)) from exc
