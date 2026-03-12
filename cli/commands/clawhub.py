import click

from cli.config import CLIConfig, get_client


@click.group(name="clawhub")
def clawhub_group():
    """Manage ClawHub skills"""
    pass


@clawhub_group.command(name="list")
def list_skills():
    """List trending skills from ClawHub"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/clawhub/skills")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    skills = response.json()
    if not skills:
        click.echo("No skills found.")
        return

    click.echo(f"{'ID':<20} | {'NAME':<20} | {'STARS':<6} | {'AUTHOR':<20}")
    click.echo("-" * 75)
    for skill in skills:
        click.echo(
            f"{skill['id']:<20} | {skill['name']:<20} | {skill['stars']:<6} | {skill['author']:<20}"
        )


@clawhub_group.command(name="install")
@click.option("--agent-id", "-a", required=True, help="Agent ID to install the skill to")
@click.option("--skill-id", "-s", required=True, help="Skill ID to install")
def install_skill(agent_id: str, skill_id: str):
    """Install a skill to an agent"""
    cli_config = CLIConfig()
    if not cli_config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(cli_config)
    response = client.post(
        "/clawhub/install",
        json={
            "agent_id": agent_id,
            "skill_id": skill_id,
        },
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        click.echo(f"Successfully initiated installation of '{skill_id}' for agent {agent_id}")
    elif response.status_code == 404:
        click.echo(f"Error: Agent {agent_id} not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@clawhub_group.command(name="uninstall")
@click.option("--agent-id", "-a", required=True, help="Agent ID to uninstall the skill from")
@click.option("--skill-id", "-s", required=True, help="Skill ID to uninstall")
def uninstall_skill(agent_id: str, skill_id: str):
    """Uninstall a skill from an agent"""
    cli_config = CLIConfig()
    if not cli_config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(cli_config)
    response = client.post(
        "/clawhub/uninstall",
        json={
            "agent_id": agent_id,
            "skill_id": skill_id,
        },
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        click.echo(f"Successfully uninstalled '{skill_id}' from agent {agent_id}")
    elif response.status_code == 404:
        click.echo(f"Error: Agent {agent_id} not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)
