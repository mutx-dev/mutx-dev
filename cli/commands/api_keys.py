import click
from datetime import datetime, timezone
from typing import Optional

from cli.config import current_config, get_client


@click.group(name="api-keys")
def api_keys_group():
    """Manage API keys"""
    pass


def _normalize_key_collection(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("items", "keys", "api_keys", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    return []


def _parse_timestamp(value: str | None):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def _render_key_state(key: dict) -> str:
    if key.get("is_active") is False:
        return "revoked"

    expires_at = _parse_timestamp(key.get("expires_at"))
    if expires_at and expires_at <= datetime.now(timezone.utc):
        return "expired"

    return "active"


@api_keys_group.command(name="list")
def list_api_keys():
    """List all API keys"""
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
    response = client.get("/v1/api-keys")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    keys = _normalize_key_collection(response.json())
    if not keys:
        click.echo("No API keys found.")
        return

    for key in keys:
        expires = key.get("expires_at") or "never"
        last_used = key.get("last_used_at") or key.get("last_used") or "never"
        click.echo(
            f"{key['id']} | {key['name']} | {_render_key_state(key)} | expires: {expires} | last used: {last_used}"
        )


@api_keys_group.command(name="create")
@click.option("--name", "-n", required=True, help="Name for the API key")
@click.option("--expires-in-days", "-e", default=None, type=int, help="Expiration in days (1-365)")
def create_api_key(name: str, expires_in_days: Optional[int]):
    """Create a new API key"""
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    payload = {"name": name}
    if expires_in_days is not None:
        payload["expires_in_days"] = expires_in_days

    client = get_client(config)
    response = client.post("/v1/api-keys", json=payload)

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
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    if not force:
        if not click.confirm(f"Are you sure you want to revoke API key {key_id}?"):
            return

    client = get_client(config)
    response = client.delete(f"/v1/api-keys/{key_id}")

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
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    if not force:
        if not click.confirm(
            f"Rotating will revoke the old key immediately. Continue for {key_id}?"
        ):
            return

    client = get_client(config)
    response = client.post(f"/v1/api-keys/{key_id}/rotate")

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
