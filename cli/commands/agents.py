import json
from typing import Optional

import click

from cli.config import CLIConfig, get_client
from cli.services import AgentsService, CLIServiceError


@click.group(name="agents")
def agents_group():
    """Manage agents"""
    pass


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


def _agents_service() -> AgentsService:
    return AgentsService(config=CLIConfig(), client_factory=get_client)


@agents_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of agents to list")
@click.option("--skip", "-s", default=0, help="Number of agents to skip")
@click.option(
    "--format",
    "-f",
    type=click.Choice(["table", "simple"]),
    default="table",
    help="Output format",
)
def list_agents(limit: int, skip: int, format: str):
    """List all agents"""
    try:
        agents = _agents_service().list_agents(limit=limit, skip=skip)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return
    if not agents:
        click.echo("No agents found.")
        return

    if format == "table":
        # Print table header
        header = f"{'ID':<40} {'NAME':<30} {'STATUS':<12}"
        click.echo(header)
        click.echo("-" * len(header))

        # Print each agent row
        for agent in agents:
            agent_id = agent.id[:38]
            name = agent.name[:28]
            status = agent.status[:10]
            click.echo(f"{agent_id:<40} {name:<30} {status:<12}")
    else:
        # Simple format (original)
        for agent in agents:
            click.echo(f"{agent.id} | {agent.name} | {agent.status}")


@agents_group.command(name="create")
@click.option("--name", "-n", required=True, help="Agent name")
@click.option("--description", "-d", default="", help="Agent description")
@click.option(
    "--type",
    "-t",
    "agent_type",
    default="openai",
    help="Agent type (openai, anthropic, langchain, custom)",
)
@click.option("--config", "-c", default="{}", help="Agent config as JSON object string")
def create_agent(name: str, description: str, agent_type: str, config: str):
    """Create a new agent"""
    try:
        agent = _agents_service().create_agent(
            name=name,
            description=description,
            agent_type=agent_type,
            config=config,
        )
        click.echo(f"Created agent: {agent.id} - {agent.name}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@agents_group.command(name="delete")
@click.argument("agent_id")
@click.option("--force", "-f", is_flag=True, help="Force deletion without confirmation")
def delete_agent(agent_id: str, force: bool):
    """Delete an agent"""
    if not force:
        if not click.confirm(f"Are you sure you want to delete agent {agent_id}?"):
            return

    try:
        _agents_service().delete_agent(agent_id)
        click.echo(f"Deleted agent: {agent_id}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@agents_group.command(name="deploy")
@click.argument("agent_id")
def deploy_agent(agent_id: str):
    """Deploy an agent"""
    try:
        result = _agents_service().deploy_agent(agent_id)
        click.echo(f"Deploying agent: {agent_id}")
        click.echo(f"Deployment ID: {result.deployment_id}")
        click.echo(f"Status: {result.status}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@agents_group.command(name="logs")
@click.argument("agent_id")
@click.option("--limit", "-l", default=100, help="Number of log entries to fetch")
@click.option("--level", "-L", default=None, help="Filter by log level (INFO, WARNING, ERROR)")
def get_logs(agent_id: str, limit: int, level: Optional[str]):
    """Get logs for an agent"""
    try:
        logs = _agents_service().get_logs(agent_id, limit=limit, level=level)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if not logs:
        click.echo("No logs found.")
        return

    for log in logs:
        click.echo(f"{log.timestamp or ''} | {log.level} | {log.message}")


@agents_group.command(name="stop")
@click.argument("agent_id")
def stop_agent(agent_id: str):
    """Stop a running agent"""
    try:
        status = _agents_service().stop_agent(agent_id)
        click.echo(f"Stopped agent: {agent_id}")
        click.echo(f"Status: {status}")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@agents_group.command(name="metrics")
@click.argument("agent_id")
@click.option("--limit", "-l", default=100, help="Number of metric samples to fetch")
@click.option("--skip", "-s", default=0, help="Number of metric samples to skip")
def get_metrics(agent_id: str, limit: int, skip: int):
    """Get metrics for an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    response = client.get(f"/v1/agents/{agent_id}/metrics", params={"limit": limit, "skip": skip})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        metrics = response.json()
        if not metrics:
            click.echo("No metrics found.")
            return

        for metric in metrics:
            click.echo(
                f"{metric.get('timestamp', '')} | cpu={metric.get('cpu_usage', 'n/a')} | memory={metric.get('memory_usage', 'n/a')}"
            )
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@agents_group.command(name="config")
@click.argument("agent_id")
def get_config(agent_id: str):
    """Get runtime config for an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    response = client.get(f"/v1/agents/{agent_id}/config")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        payload = response.json()
        click.echo(f"Agent ID: {payload['agent_id']}")
        click.echo(f"Type: {payload['type']}")
        click.echo(f"Config version: {payload['config_version']}")
        click.echo(f"Updated at: {payload.get('updated_at', 'N/A')}")
        click.echo("Config:")
        click.echo(json.dumps(payload.get("config", {}), indent=2, sort_keys=True))
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@agents_group.command(name="update-config")
@click.argument("agent_id")
@click.option("--config", "config_json", required=True, help="Agent config as JSON object string")
def update_config(agent_id: str, config_json: str):
    """Update runtime config for an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    try:
        parsed_config = json.loads(config_json)
    except json.JSONDecodeError:
        click.echo("Error: Invalid JSON in config", err=True)
        return

    client = get_client(config_obj)
    response = client.patch(f"/v1/agents/{agent_id}/config", json={"config": parsed_config})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        payload = response.json()
        click.echo(f"Updated config for agent: {payload['agent_id']}")
        click.echo(f"Config version: {payload['config_version']}")
        click.echo("Config:")
        click.echo(json.dumps(payload.get("config", {}), indent=2, sort_keys=True))
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@agents_group.command(name="status")
@click.argument("agent_id")
def get_status(agent_id: str):
    """Get status of an agent"""
    try:
        agent = _agents_service().get_agent(agent_id)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    click.echo(f"Agent ID: {agent.id}")
    click.echo(f"Name: {agent.name}")
    click.echo(f"Description: {agent.description or 'N/A'}")
    click.echo(f"Status: {agent.status}")
    click.echo(f"Created at: {agent.created_at or 'N/A'}")
