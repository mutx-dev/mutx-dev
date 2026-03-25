import json
from dataclasses import asdict

import click

from cli.config import current_config, get_client
from cli.openclaw_runtime import prepare_personal_assistant_runtime
from cli.personal_assistant import build_personal_assistant_config
from cli.services import AgentsService, CLIServiceError


@click.group(name="agent")
def agent_group():
    """Manage agents with the new grouped surface."""
    pass


def _service() -> AgentsService:
    return AgentsService(config=current_config(), client_factory=get_client)


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


@agent_group.command(name="list")
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def list_agents_command(output: str):
    try:
        agents = _service().list_agents(limit=100, skip=0)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if output == "json":
        click.echo(json.dumps([asdict(agent) for agent in agents], indent=2))
        return

    for agent in agents:
        click.echo(f"{agent.id} | {agent.name} | {agent.type} | {agent.status}")


@agent_group.command(name="create")
@click.option("--name", "-n", required=True, help="Agent name")
@click.option("--description", "-d", default="", help="Agent description")
@click.option("--type", "agent_type", default="openai", help="Agent type")
@click.option("--template", default=None, help="Starter template id")
@click.option("--config", default="{}", help="Agent config JSON")
@click.option(
    "--install-openclaw", is_flag=True, help="Install OpenClaw automatically if it is missing"
)
@click.option(
    "--openclaw-install-method",
    type=click.Choice(["npm", "git"]),
    default="npm",
    show_default=True,
    help="OpenClaw install method when installation is required",
)
def create_agent_command(
    name: str,
    description: str,
    agent_type: str,
    template: str | None,
    config: str,
    install_openclaw: bool,
    openclaw_install_method: str,
):
    try:
        config_payload: dict | str = config
        if template == "personal_assistant":
            binding, health = prepare_personal_assistant_runtime(
                assistant_name=name,
                install_if_missing=install_openclaw,
                install_method=openclaw_install_method,
                no_input=False,
                prompt_install=lambda: click.confirm(
                    "OpenClaw is required for the Personal Assistant and is not installed. Install it now?",
                    default=True,
                ),
            )
            agent_type = "openclaw"
            config_payload = build_personal_assistant_config(
                name=name,
                description=description,
                assistant_id=binding.agent_id,
                workspace=binding.workspace,
                runtime_metadata={
                    **binding.runtime_metadata(),
                    "gateway_status": health.status,
                    "gateway_url": health.gateway_url,
                },
            )
        agent = _service().create_agent(
            name=name,
            description=description,
            agent_type=agent_type,
            config=config_payload,
        )
        click.echo(f"Created agent: {agent.id} | {agent.name} | {agent.type}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@agent_group.command(name="deploy")
@click.argument("agent_id")
@click.option(
    "--install-openclaw", is_flag=True, help="Install OpenClaw automatically if it is missing"
)
@click.option(
    "--openclaw-install-method",
    type=click.Choice(["npm", "git"]),
    default="npm",
    show_default=True,
    help="OpenClaw install method when installation is required",
)
def deploy_agent_command(agent_id: str, install_openclaw: bool, openclaw_install_method: str):
    try:
        agent = _service().get_agent(agent_id)
        agent = _service().ensure_openclaw_binding(
            agent,
            install_if_missing=install_openclaw,
            install_method=openclaw_install_method,
            no_input=False,
            prompt_install=lambda: click.confirm(
                "OpenClaw is required for this assistant deployment and is not installed. Install it now?",
                default=True,
            ),
        )
        result = _service().deploy_agent(agent_id)
        click.echo(
            f"Deployment ID: {result.deployment_id} | status: {result.status} | agent: {agent.name}"
        )
    except CLIServiceError as exc:
        _echo_service_error(exc)
