import json
from typing import Optional

import click

from cli.config import current_config, get_client
from cli.services import CLIServiceError, DeploymentsService


@click.group(name="deploy")
def deploy_group():
    """Manage deployments"""
    pass


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


def _deployments_service() -> DeploymentsService:
    return DeploymentsService(config=current_config(), client_factory=get_client)


def _parse_config_snapshot(snapshot: object) -> dict[str, object]:
    if isinstance(snapshot, dict):
        return snapshot
    if not isinstance(snapshot, str):
        return {}
    try:
        parsed = json.loads(snapshot)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


@deploy_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of deployments to list")
@click.option("--skip", "-s", default=0, help="Number of deployments to skip")
@click.option("--agent-id", "-a", default=None, help="Filter by agent ID")
@click.option("--status", "-S", default=None, help="Filter by status")
def list_deployments(limit: int, skip: int, agent_id: Optional[str], status: Optional[str]):
    """List all deployments"""
    try:
        deployments = _deployments_service().list_deployments(
            limit=limit,
            skip=skip,
            agent_id=agent_id,
            status=status,
        )
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if not deployments:
        click.echo("No deployments found.")
        return

    for dep in deployments:
        click.echo(f"{dep.id} | {dep.agent_id} | {dep.status} | replicas: {dep.replicas}")


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
    try:
        result = _deployments_service().create_deployment(agent_id=agent_id, replicas=replicas)
        deployment_id = result.id
        click.echo(f"Created deployment: {deployment_id}")
        click.echo(f"Status: {result.status}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@deploy_group.command(name="scale")
@click.argument("deployment_id")
@click.option("--replicas", "-r", required=True, type=int, help="Number of replicas")
def scale_deployment(deployment_id: str, replicas: int):
    """Scale a deployment"""
    try:
        deployment = _deployments_service().scale_deployment(deployment_id, replicas=replicas)
        click.echo(f"Scaled deployment {deployment_id} to {deployment.replicas} replicas")
    except CLIServiceError as exc:
        _echo_service_error(exc)


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
    try:
        payload = _deployments_service().get_events(
            deployment_id,
            limit=limit,
            skip=skip,
            event_type=event_type,
            status=status,
        )
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if not payload.items:
        click.echo("No deployment events found.")
        return

    click.echo(f"Deployment: {payload.deployment_id} | status: {payload.deployment_status}")
    for item in payload.items:
        click.echo(
            " | ".join(
                [
                    item.created_at or "",
                    item.event_type,
                    item.status,
                    f"node: {item.node_id or 'n/a'}",
                ]
            )
        )


@deploy_group.command(name="restart")
@click.argument("deployment_id")
def restart_deployment(deployment_id: str):
    """Restart a deployment"""
    try:
        deployment = _deployments_service().restart_deployment(deployment_id)
        click.echo(f"Restarted deployment: {deployment.id or deployment_id}")
        click.echo(f"Status: {deployment.status}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@deploy_group.command(name="versions")
@click.argument("deployment_id")
def deployment_versions(deployment_id: str):
    """Get deployment version history"""
    try:
        payload = _deployments_service().get_versions(deployment_id)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if not payload.items:
        click.echo("No deployment versions found.")
        return

    click.echo(f"Deployment: {payload.deployment_id} | versions: {payload.total}")
    for item in payload.items:
        snapshot = _parse_config_snapshot(item.config_snapshot)
        fragments = [
            f"v{item.version}",
            item.status,
            f"created: {item.created_at or 'n/a'}",
        ]
        runtime_version = snapshot.get("version")
        if isinstance(runtime_version, str) and runtime_version:
            fragments.append(f"runtime version: {runtime_version}")
        replicas = snapshot.get("replicas")
        if isinstance(replicas, int):
            fragments.append(f"replicas: {replicas}")
        if item.rolled_back_at:
            fragments.append(f"rolled back: {item.rolled_back_at}")
        click.echo(" | ".join(fragments))


@deploy_group.command(name="rollback")
@click.argument("deployment_id")
@click.option("--version", "target_version", required=True, type=int, help="Version number to restore")
def rollback_deployment_command(deployment_id: str, target_version: int):
    """Rollback a deployment to a recorded version"""
    try:
        deployment = _deployments_service().rollback_deployment(
            deployment_id,
            version=target_version,
        )
        click.echo(f"Rolled back deployment: {deployment.id or deployment_id}")
        click.echo(f"Status: {deployment.status}")
        if deployment.version:
            click.echo(f"Version: {deployment.version}")
        click.echo(f"Replicas: {deployment.replicas}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@deploy_group.command(name="logs")
@click.argument("deployment_id")
@click.option("--limit", "-l", default=100, help="Number of log lines to fetch")
@click.option("--skip", "-s", default=0, help="Number of log lines to skip")
@click.option("--level", default=None, help="Filter by log level (e.g. ERROR)")
def deployment_logs(deployment_id: str, limit: int, skip: int, level: Optional[str]):
    """Get deployment logs"""
    try:
        logs = _deployments_service().get_logs(
            deployment_id,
            limit=limit,
            skip=skip,
            level=level,
        )
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if not logs:
        click.echo("No deployment logs found.")
        return

    for log in logs:
        click.echo(" | ".join([str(log.timestamp or ""), log.level, log.message]))


@deploy_group.command(name="metrics")
@click.argument("deployment_id")
@click.option("--limit", "-l", default=100, help="Number of metric points to fetch")
@click.option("--skip", "-s", default=0, help="Number of metric points to skip")
def deployment_metrics(deployment_id: str, limit: int, skip: int):
    """Get deployment metrics"""
    try:
        metrics = _deployments_service().get_metrics(deployment_id, limit=limit, skip=skip)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if not metrics:
        click.echo("No deployment metrics found.")
        return

    for metric in metrics:
        click.echo(
            " | ".join(
                [
                    str(metric.timestamp or ""),
                    f"cpu: {metric.cpu_usage if metric.cpu_usage is not None else 'n/a'}",
                    f"memory: {metric.memory_usage if metric.memory_usage is not None else 'n/a'}",
                ]
            )
        )


@deploy_group.command(name="delete")
@click.argument("deployment_id")
@click.option("--force", "-f", is_flag=True, help="Force deletion without confirmation")
def delete_deployment(deployment_id: str, force: bool):
    """Delete a deployment"""
    if not force:
        if not click.confirm(f"Are you sure you want to delete deployment {deployment_id}?"):
            return

    try:
        _deployments_service().delete_deployment(deployment_id)
        click.echo(f"Deleted deployment: {deployment_id}")
    except CLIServiceError as exc:
        _echo_service_error(exc)
