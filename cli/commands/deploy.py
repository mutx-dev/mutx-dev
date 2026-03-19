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
    response = client.get("/v1/deployments", params=params)

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
def create_deployment(agent_id: str, replicas: int):
    """Create a new deployment"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.post("/v1/deployments", json={"agent_id": agent_id, "replicas": replicas})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code in (200, 201):
        result = response.json()
        deployment_id = result.get("deployment_id") or result.get("id")
        click.echo(f"Created deployment: {deployment_id}")
        click.echo(f"Status: {result.get('status')}")
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
        f"/v1/deployments/{deployment_id}/scale",
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


@deploy_group.command(name="events")
@click.argument("deployment_id")
@click.option("--limit", "-l", default=100, help="Number of events to fetch")
@click.option("--skip", "-s", default=0, help="Number of events to skip")
@click.option("--event-type", default=None, help="Filter by event type")
@click.option("--status", default=None, help="Filter by event status")
def deployment_events(
    deployment_id: str,
    limit: int,
    skip: int,
    event_type: Optional[str],
    status: Optional[str],
):
    """Get deployment event history"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    params = {"limit": limit, "skip": skip}
    if event_type:
        params["event_type"] = event_type
    if status:
        params["status"] = status

    client = get_client(config)
    response = client.get(f"/v1/deployments/{deployment_id}/events", params=params)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        payload = response.json()
        items = payload.get("items", [])
        if not items:
            click.echo("No deployment events found.")
            return

        click.echo(
            f"Deployment: {payload.get('deployment_id')} | status: {payload.get('deployment_status')}"
        )
        for item in items:
            click.echo(
                " | ".join(
                    [
                        item.get("created_at", ""),
                        item.get("event_type", "unknown"),
                        item.get("status", "unknown"),
                        f"node: {item.get('node_id') or 'n/a'}",
                    ]
                )
            )
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="restart")
@click.argument("deployment_id")
def restart_deployment(deployment_id: str):
    """Restart a deployment"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.post(f"/v1/deployments/{deployment_id}/restart")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        deployment = response.json()
        click.echo(f"Restarted deployment: {deployment.get('id', deployment_id)}")
        click.echo(f"Status: {deployment.get('status')}")
    elif response.status_code == 400:
        click.echo(f"Error: {response.json().get('detail', 'Cannot restart deployment')}", err=True)
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="logs")
@click.argument("deployment_id")
@click.option("--limit", "-l", default=100, help="Number of log lines to fetch")
@click.option("--skip", "-s", default=0, help="Number of log lines to skip")
@click.option("--level", default=None, help="Filter by log level (e.g. ERROR)")
def deployment_logs(deployment_id: str, limit: int, skip: int, level: Optional[str]):
    """Get deployment logs"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    params = {"limit": limit, "skip": skip}
    if level:
        params["level"] = level

    client = get_client(config)
    response = client.get(f"/v1/deployments/{deployment_id}/logs", params=params)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        logs = response.json()
        if not logs:
            click.echo("No deployment logs found.")
            return

        for log in logs:
            click.echo(
                " | ".join(
                    [
                        str(log.get("timestamp", "")),
                        str(log.get("level", "unknown")),
                        str(log.get("message", "")),
                    ]
                )
            )
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="metrics")
@click.argument("deployment_id")
@click.option("--limit", "-l", default=100, help="Number of metric points to fetch")
@click.option("--skip", "-s", default=0, help="Number of metric points to skip")
def deployment_metrics(deployment_id: str, limit: int, skip: int):
    """Get deployment metrics"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get(
        f"/v1/deployments/{deployment_id}/metrics",
        params={"limit": limit, "skip": skip},
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        metrics = response.json()
        if not metrics:
            click.echo("No deployment metrics found.")
            return

        for metric in metrics:
            click.echo(
                " | ".join(
                    [
                        str(metric.get("timestamp", "")),
                        f"cpu: {metric.get('cpu_usage', 'n/a')}",
                        f"memory: {metric.get('memory_usage', 'n/a')}",
                    ]
                )
            )
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="versions")
@click.argument("deployment_id")
def deployment_versions(deployment_id: str):
    """Get deployment version history"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get(f"/v1/deployments/{deployment_id}/versions")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        payload = response.json()
        items = payload.get("items", [])
        if not items:
            click.echo("No deployment versions found.")
            return

        click.echo(f"Deployment: {payload.get('deployment_id')} | versions: {payload.get('total', len(items))}")
        for item in items:
            click.echo(
                " | ".join(
                    [
                        f"v{item.get('version', 'unknown')}",
                        str(item.get('status', 'unknown')),
                        str(item.get('created_at', '')),
                    ]
                )
            )
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@deploy_group.command(name="rollback")
@click.argument("deployment_id")
@click.option("--version", "version_number", required=True, type=int, help="Version number to restore")
def rollback_deployment(deployment_id: str, version_number: int):
    """Rollback a deployment to a prior version"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.post(
        f"/v1/deployments/{deployment_id}/rollback",
        json={"version": version_number},
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        deployment = response.json()
        click.echo(f"Rolled back deployment: {deployment.get('id', deployment_id)}")
        click.echo(f"Status: {deployment.get('status')}")
        click.echo(f"Version: {deployment.get('version')}")
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    elif response.status_code == 400:
        click.echo(f"Error: {response.json().get('detail', 'Cannot rollback deployment')}", err=True)
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
    response = client.delete(f"/v1/deployments/{deployment_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 204:
        click.echo(f"Deleted deployment: {deployment_id}")
    elif response.status_code == 404:
        click.echo("Error: Deployment not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)
