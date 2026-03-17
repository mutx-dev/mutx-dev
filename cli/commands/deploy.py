import click
from typing import Optional

# Import service classes and config for CLI use
from mutx.services import DeploymentsService

# Re-export CLIConfig for backwards compatibility with tests
from mutx.services.base import CLIConfig as _CLIConfig

CLIConfig = _CLIConfig


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

    client = get_client(config)
    service = DeploymentsService(config, client=client)

    try:
        deployments = service.list(
            limit=limit,
            skip=skip,
            agent_id=agent_id,
            status=status,
        )
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        return

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
    service = DeploymentsService(config, client=client)

    try:
        result = service.create(agent_id=agent_id, replicas=replicas)
        deployment_id = result.get("deployment_id") or result.get("id")
        click.echo(f"Created deployment: {deployment_id}")
        click.echo(f"Status: {result.get('status')}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


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
    service = DeploymentsService(config, client=client)

    try:
        deployment = service.scale(deployment_id, replicas)
        click.echo(f"Scaled deployment {deployment_id} to {deployment.get('replicas')} replicas")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


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

    client = get_client(config)
    service = DeploymentsService(config, client=client)

    try:
        payload = service.get_events(
            deployment_id,
            limit=limit,
            skip=skip,
            event_type=event_type,
            status=status,
        )
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        return

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


@deploy_group.command(name="restart")
@click.argument("deployment_id")
def restart_deployment(deployment_id: str):
    """Restart a deployment"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    service = DeploymentsService(config, client=client)

    try:
        deployment = service.restart(deployment_id)
        click.echo(f"Restarted deployment: {deployment.get('id', deployment_id)}")
        click.echo(f"Status: {deployment.get('status')}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


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

    client = get_client(config)
    service = DeploymentsService(config, client=client)

    try:
        logs = service.get_logs(deployment_id, limit=limit, skip=skip, level=level)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        return

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
    service = DeploymentsService(config, client=client)

    try:
        metrics = service.get_metrics(deployment_id, limit=limit, skip=skip)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        return

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
    service = DeploymentsService(config_obj, client=client)

    try:
        service.delete(deployment_id)
        click.echo(f"Deleted deployment: {deployment_id}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


# Backwards compatibility - re-export for tests
from mutx.services import get_client
