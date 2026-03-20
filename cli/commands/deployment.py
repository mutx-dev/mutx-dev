import json
from dataclasses import asdict

import click

from cli.config import current_config, get_client
from cli.services import CLIServiceError, DeploymentsService


@click.group(name="deployment")
def deployment_group():
    """Manage deployments with the new grouped surface."""
    pass


def _service() -> DeploymentsService:
    return DeploymentsService(config=current_config(), client_factory=get_client)


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


@deployment_group.command(name="list")
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def list_deployments_command(output: str):
    try:
        deployments = _service().list_deployments(limit=100, skip=0)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if output == "json":
        click.echo(json.dumps([asdict(deployment) for deployment in deployments], indent=2))
        return

    for deployment in deployments:
        click.echo(
            f"{deployment.id} | {deployment.agent_id} | {deployment.status} | replicas={deployment.replicas}"
        )


@deployment_group.command(name="create")
@click.option("--agent-id", required=True, help="Agent id")
@click.option("--replicas", default=1, type=int, help="Replica count")
def create_deployment_command(agent_id: str, replicas: int):
    try:
        deployment = _service().create_deployment(agent_id=agent_id, replicas=replicas)
        click.echo(f"Created deployment: {deployment.id} | {deployment.status}")
    except CLIServiceError as exc:
        _echo_service_error(exc)
