import click
from typing import Optional

from cli.config import CLIConfig, get_client


@click.group(name="agents")
def agents_group():
    """Manage agents"""
    pass


@agents_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of agents to list")
@click.option("--skip", "-s", default=0, help="Number of agents to skip")
def list_agents(limit: int, skip: int):
    """List all agents"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/api/agents", params={"limit": limit, "skip": skip})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    agents = response.json()
    if not agents:
        click.echo("No agents found.")
        return

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
        # Validate JSON locally; backend accepts dict or string and normalizes it.
        config_json = json.loads(config)
    except json.JSONDecodeError:
        click.echo("Error: Invalid JSON in config", err=True)
        return

    client = get_client(cli_config)
    response = client.post(
        "/api/agents",
        json={
            "name": name,
            "description": description,
            "type": agent_type,
            "config": config_json,
        },
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 201:
        agent = response.json()
        click.echo(f"Created agent: {agent['id']} - {agent['name']}")
    else:
        click.echo(f"Error: {response.text}", err=True)


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
    response = client.delete(f"/api/agents/{agent_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 204:
        click.echo(f"Deleted agent: {agent_id}")
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@agents_group.command(name="deploy")
@click.argument("agent_id")
def deploy_agent(agent_id: str):
    """Deploy an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    response = client.post(f"/api/agents/{agent_id}/deploy")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        result = response.json()
        click.echo(f"Deploying agent: {agent_id}")
        click.echo(f"Deployment ID: {result.get('deployment_id')}")
        click.echo(f"Status: {result.get('status')}")
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


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

    params = {"limit": limit}
    if level:
        params["level"] = level

    client = get_client(config_obj)
    response = client.get(f"/api/agents/{agent_id}/logs", params=params)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        logs = response.json()
        if not logs:
            click.echo("No logs found.")
            return

        for log in logs:
            timestamp = log.get("timestamp", "")
            level_str = log.get("level", "INFO")
            message = log.get("message", "")
            click.echo(f"{timestamp} | {level_str} | {message}")
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@agents_group.command(name="stop")
@click.argument("agent_id")
def stop_agent(agent_id: str):
    """Stop a running agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    response = client.post(f"/api/agents/{agent_id}/stop")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        result = response.json()
        click.echo(f"Stopped agent: {agent_id}")
        click.echo(f"Status: {result.get('status')}")
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@agents_group.command(name="status")
@click.argument("agent_id")
def get_status(agent_id: str):
    """Get status of an agent"""
    config_obj = CLIConfig()
    if not config_obj.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config_obj)
    response = client.get(f"/api/agents/{agent_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        agent = response.json()
        click.echo(f"Agent ID: {agent['id']}")
        click.echo(f"Name: {agent['name']}")
        click.echo(f"Description: {agent.get('description', 'N/A')}")
        click.echo(f"Status: {agent['status']}")
        click.echo(f"Created at: {agent.get('created_at', 'N/A')}")
    elif response.status_code == 404:
        click.echo("Error: Agent not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)
