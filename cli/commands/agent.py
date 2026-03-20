import json
from dataclasses import asdict

import click

from cli.config import current_config, get_client
from cli.services import AgentsService, CLIServiceError
from src.api.services.assistant_control_plane import build_personal_assistant_config


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
def create_agent_command(
    name: str,
    description: str,
    agent_type: str,
    template: str | None,
    config: str,
):
    try:
        config_payload: dict | str = config
        if template == "personal_assistant":
            agent_type = "openclaw"
            config_payload = build_personal_assistant_config(name=name, description=description)
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
def deploy_agent_command(agent_id: str):
    try:
        result = _service().deploy_agent(agent_id)
        click.echo(f"Deployment ID: {result.deployment_id} | status: {result.status}")
    except CLIServiceError as exc:
        _echo_service_error(exc)
