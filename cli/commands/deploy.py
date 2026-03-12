import click
from typing import Optional

from cli.config import CLIConfig, get_client


@click.group(name="deploy")
def deploy_group():
    """Manage deployments"""
    pass


@deploy_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of deployments to list")
@click.option("--skip", "-s", default=0, help="Number of deployments to skip")
@click.option("--agent-id", "-a", default=None, help="Filter by agent ID")
@click.option("--status", "-S", default=None, help="Filter by status")
def list_deployments(limit: int, skip: int, agent_id: Optional[str], status: Optional[str]):
    """List all deployments"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    params = {"limit": limit, "skip": skip}
    if agent_id:
        params["agent_id"] = agent_id
    if status:
        params["status"] = status

    client = get_client(config)
    response = client.get("/deployments", params=params)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    deployments = response.json()
    if not deployments:
        click.echo("No deployments found.")
        return

    for dep in deployments:
        click.echo(
            f"{dep['id']} | {dep['agent_id']} | {dep['status']} | replicas: {dep.get('replicas', 1)}"
        )


@deploy_group.command(name="create")
@click.option("--agent-id", "-a", required=True, help="Agent ID to deploy")
@click.option(
    "--replicas",
    "-r",
    default=1,
    help="Requested replica count. Supported via /deployments create route.",
)
@click.option(
    "--route",
    type=click.Choice(["deployments", "agent"], case_sensitive=False),
    default="deployments",
    show_default=True,
    help="Backend route to use: canonical /deployments or legacy/live /agents/{agent_id}/deploy.",
)
def create_deployment(agent_id: str, replicas: int, route: str):
    """Create a new deployment"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)

    if route == "deployments":
        response = client.post("/deployments", json={"agent_id": agent_id, "replicas": replicas})
    else:
        response = client.post(f"/agents/{agent_id}/deploy")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code in (200, 201):
        result = response.json()
        deployment_id = result.get("deployment_id") or result.get("id")
        click.echo(f"Created deployment: {deployment_id}")
        click.echo(f"Status: {result.get('status')}")
        if route == "agent" and replicas != 1:
            click.echo(
                "Note: /agents/{agent_id}/deploy currently ignores --replicas and starts with 1 replica.",
                err=True,
            )
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="scale")
@click.argument("deployment_id")
@click.option("--replicas", "-r", required=True, type=int, help="Number of replicas")
def scale_deployment(deployment_id: str, replicas: int):
    """Scale a deployment"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.post(
        f"/deployments/{deployment_id}/scale",
        json={"replicas": replicas},
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        deployment = response.json()
        click.echo(f"Scaled deployment {deployment_id} to {deployment.get('replicas')} replicas")
    elif response.status_code == 400:
        click.echo(f"Error: {response.json().get('detail', 'Cannot scale deployment')}", err=True)
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="delete")
@click.argument("deployment_id")
@click.option("--force", "-f", is_flag=True, help="Force deletion without confirmation")
def delete_deployment(deployment_id: str, force: bool):
    """Delete a deployment"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    if not force:
        if not click.confirm(f"Are you sure you want to delete deployment {deployment_id}?"):
            return

    client = get_client(config_obj)
    response = client.delete(f"/deployments/{deployment_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 204:
        click.echo(f"Deleted deployment: {deployment_id}")
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)
