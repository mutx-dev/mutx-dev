import click
from typing import Optional

# Import service classes and config for CLI use
from mutx.services import AgentsService

# Re-export CLIConfig for backwards compatibility with tests
from mutx.services.base import CLIConfig as _CLIConfig
CLIConfig = _CLIConfig


@click.group(name="agents")
def agents_group():
    """Manage agents"""
    pass


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
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    # Pass client for testability (uses get_client for backwards compatibility)
    client = get_client(config)
    service = AgentsService(config, client=client)
    
    try:
        agents = service.list(limit=limit, skip=skip)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        return

    if not agents:
        click.echo("No agents found.")
        return

    if format == "table":
        header = f"{'ID':<40} {'NAME':<30} {'STATUS':<12}"
        click.echo(header)
        click.echo("-" * len(header))
        for agent in agents:
            agent_id = agent.get("id", "")[:38]
            name = agent.get("name", "")[:28]
            status = agent.get("status", "")[:10]
            click.echo(f"{agent_id:<40} {name:<30} {status:<12}")
    else:
        for agent in agents:
            click.echo(f"{agent['id']} | {agent['name']} | {agent['status']}")


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
    cli_config = CLIConfig()
    if not cli_config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    import json

    try:
        config_json = json.loads(config)
    except json.JSONDecodeError:
        click.echo("Error: Invalid JSON in config", err=True)
        return

    client = get_client(cli_config)
    service = AgentsService(cli_config, client=client)
    
    try:
        agent = service.create(
            name=name,
            description=description,
            agent_type=agent_type,
            config=config_json,
        )
        click.echo(f"Created agent: {agent['id']} - {agent['name']}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


@agents_group.command(name="delete")
@click.argument("agent_id")
@click.option("--force", "-f", is_flag=True, help="Force deletion without confirmation")
def delete_agent(agent_id: str, force: bool):
    """Delete an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    if not force:
        if not click.confirm(f"Are you sure you want to delete agent {agent_id}?"):
            return

    client = get_client(config_obj)
    service = AgentsService(config_obj, client=client)
    
    try:
        service.delete(agent_id)
        click.echo(f"Deleted agent: {agent_id}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


@agents_group.command(name="deploy")
@click.argument("agent_id")
def deploy_agent(agent_id: str):
    """Deploy an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    service = AgentsService(config_obj, client=client)
    
    try:
        result = service.deploy(agent_id)
        click.echo(f"Deploying agent: {agent_id}")
        click.echo(f"Deployment ID: {result.get('deployment_id')}")
        click.echo(f"Status: {result.get('status')}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


@agents_group.command(name="logs")
@click.argument("agent_id")
@click.option("--limit", "-l", default=100, help="Number of log entries to fetch")
@click.option("--level", "-L", default=None, help="Filter by log level (INFO, WARNING, ERROR)")
def get_logs(agent_id: str, limit: int, level: Optional[str]):
    """Get logs for an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    service = AgentsService(config_obj, client=client)
    
    try:
        logs = service.get_logs(agent_id, limit=limit, level=level)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        return

    if not logs:
        click.echo("No logs found.")
        return

    for log in logs:
        timestamp = log.get("timestamp", "")
        level_str = log.get("level", "INFO")
        message = log.get("message", "")
        click.echo(f"{timestamp} | {level_str} | {message}")


@agents_group.command(name="stop")
@click.argument("agent_id")
def stop_agent(agent_id: str):
    """Stop a running agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    service = AgentsService(config_obj, client=client)
    
    try:
        result = service.stop(agent_id)
        click.echo(f"Stopped agent: {agent_id}")
        click.echo(f"Status: {result.get('status')}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


@agents_group.command(name="status")
@click.argument("agent_id")
def get_status(agent_id: str):
    """Get status of an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    service = AgentsService(config_obj, client=client)
    
    try:
        agent = service.get(agent_id)
        click.echo(f"Agent ID: {agent['id']}")
        click.echo(f"Name: {agent['name']}")
        click.echo(f"Description: {agent.get('description', 'N/A')}")
        click.echo(f"Status: {agent['status']}")
        click.echo(f"Created at: {agent.get('created_at', 'N/A')}")
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)


# Backwards compatibility - re-export for tests
from mutx.services import get_client
