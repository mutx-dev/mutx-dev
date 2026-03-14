import click
from typing import Optional

from cli.config import CLIConfig, get_client


@click.group(name="api-keys")
def api_keys_group():
    """Manage API keys"""
    pass


@api_keys_group.command(name="list")
def list_api_keys():
    """List all API keys"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/api/api-keys")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    keys = response.json()
    if not keys:
        click.echo("No API keys found.")
        return

    for key in keys:
        active = "active" if key.get("is_active") else "revoked"
        expires = key.get("expires_at") or "never"
        click.echo(f"{key['id']} | {key['name']} | {active} | expires: {expires}")


@api_keys_group.command(name="create")
@click.option("--name", "-n", required=True, help="Name for the API key")
@click.option("--expires-in-days", "-e", default=None, type=int, help="Expiration in days (1-365)")
def create_api_key(name: str, expires_in_days: Optional[int]):
    """Create a new API key"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    payload = {"name": name}
    if expires_in_days is not None:
        payload["expires_in_days"] = expires_in_days

    client = get_client(config)
    response = client.post("/api/api-keys", json=payload)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 201:
        data = response.json()
        click.echo(f"Created API key: {data['name']}")
        click.echo(f"Key ID:  {data['id']}")
        click.echo(f"Secret:  {data['key']}")
        click.echo("")
        click.echo("⚠  Save this secret now — it will not be shown again.")
    else:
        click.echo(f"Error: {response.text}", err=True)


@api_keys_group.command(name="revoke")
@click.argument("key_id")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation prompt")
def revoke_api_key(key_id: str, force: bool):
    """Revoke (delete) an API key"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    if not force:
        if not click.confirm(f"Are you sure you want to revoke API key {key_id}?"):
            return

    client = get_client(config)
    response = client.delete(f"/api/api-keys/{key_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 204:
        click.echo(f"Revoked API key: {key_id}")
    elif response.status_code == 404:
        click.echo("Error: API key not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)


@api_keys_group.command(name="rotate")
@click.argument("key_id")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation prompt")
def rotate_api_key(key_id: str, force: bool):
    """Rotate an API key (revoke old, create new)"""
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    if not force:
        if not click.confirm(
            f"Rotating will revoke the old key immediately. Continue for {key_id}?"
        ):
            return

    client = get_client(config)
    response = client.post(f"/api/api-keys/{key_id}/rotate")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 200:
        data = response.json()
        click.echo(f"Rotated API key: {data['name']}")
        click.echo(f"New Key ID:  {data['id']}")
        click.echo(f"New Secret:  {data['key']}")
        click.echo("")
        click.echo("⚠  Save this secret now — it will not be shown again.")
    elif response.status_code == 404:
        click.echo("Error: API key not found", err=True)
    else:
        click.echo(f"Error: {response.text}", err=True)
