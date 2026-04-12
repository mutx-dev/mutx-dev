import click

from cli.config import current_config, get_client


@click.group(name="clawhub")
def clawhub_group():
    """Manage ClawHub skills"""
    pass


@clawhub_group.command(name="list")
def list_skills():
    """List skills from the MUTX catalog."""
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/v1/clawhub/skills")

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

    click.echo(f"{'ID':<24} | {'NAME':<28} | {'SRC':<18} | {'AVAIL':<5} | {'AUTHOR':<20}")
    click.echo("-" * 108)
    for skill in skills:
        click.echo(
            f"{skill['id']:<24} | {skill['name'][:28]:<28} | {skill.get('source', 'catalog')[:18]:<18} | "
            f"{('yes' if skill.get('available', True) else 'no'):<5} | {skill['author'][:20]:<20}"
        )


@clawhub_group.command(name="bundles")
def list_bundles():
    """List curated skill bundles."""
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/v1/clawhub/bundles")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    bundles = response.json()
    if not bundles:
        click.echo("No bundles found.")
        return

    click.echo(f"{'ID':<32} | {'NAME':<28} | {'SKILLS':<13} | {'TEMPLATE':<28}")
    click.echo("-" * 113)
    for bundle in bundles:
        click.echo(
            f"{bundle['id']:<32} | {bundle['name'][:28]:<28} | "
            f"{f\"{bundle.get('available_skill_count', 0)}/{bundle.get('skill_count', 0)}\":<13} | "
            f"{str(bundle.get('recommended_template_id') or '')[:28]:<28}"
        )


@clawhub_group.command(name="install")
@click.option("--agent-id", "-a", required=True, help="Agent ID to install the skill to")
@click.option("--skill-id", "-s", required=True, help="Skill ID to install")
def install_skill(agent_id: str, skill_id: str):
    """Install a skill to an agent"""
    cli_config = current_config()
    if not cli_config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(cli_config)
    response = client.post(
        "/v1/clawhub/install",
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
        click.echo(f"Error: Unknown skill or agent not found for '{skill_id}'", err=True)
    elif response.status_code == 409:
        click.echo(f"Error: {response.json().get('detail', response.text)}", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@clawhub_group.command(name="install-bundle")
@click.option("--agent-id", "-a", required=True, help="Agent ID to install the bundle to")
@click.option("--bundle-id", "-b", required=True, help="Bundle ID to install")
def install_bundle(agent_id: str, bundle_id: str):
    """Install a curated bundle to an agent"""
    cli_config = current_config()
    if not cli_config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(cli_config)
    response = client.post(
        "/v1/clawhub/install-bundle",
        json={
            "agent_id": agent_id,
            "bundle_id": bundle_id,
        },
    )

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        payload = response.json()
        click.echo(
            f"Installed bundle '{bundle_id}' for agent {agent_id}: "
            f"{len(payload.get('installed_skill_ids', []))} installed, "
            f"{len(payload.get('unavailable_skill_ids', []))} unavailable"
        )
    elif response.status_code == 404:
        click.echo(f"Error: Unknown bundle or agent not found for '{bundle_id}'", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@clawhub_group.command(name="uninstall")
@click.option("--agent-id", "-a", required=True, help="Agent ID to uninstall the skill from")
@click.option("--skill-id", "-s", required=True, help="Skill ID to uninstall")
def uninstall_skill(agent_id: str, skill_id: str):
    """Uninstall a skill from an agent"""
    cli_config = current_config()
    if not cli_config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(cli_config)
    response = client.post(
        "/v1/clawhub/uninstall",
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
