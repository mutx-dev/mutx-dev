import click
from typing import Any, Optional

from cli.config import CLIConfig, get_client


@click.group(name="webhooks")
def webhooks_group():
    """Manage webhooks and delivery history"""
    pass


def _require_auth() -> tuple[CLIConfig, Any] | tuple[None, None]:
    config = CLIConfig()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return None, None
    return config, get_client(config)


@webhooks_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of webhooks to fetch")
@click.option("--skip", "-s", default=0, help="Number of webhooks to skip")
def list_webhooks(limit: int, skip: int):
    """List all configured webhooks"""
    config, client = _require_auth()
    if not config:
        return

    response = client.get("/v1/webhooks", params={"limit": limit, "skip": skip})

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    webhooks = response.json()
    if not webhooks:
        click.echo("No webhooks found.")
        return

    for webhook in webhooks:
        active = "active" if webhook.get("is_active", False) else "inactive"
        events = ",".join(webhook.get("events", [])) or "*"
        click.echo(f"{webhook['id']} | {webhook['url']} | {active} | events: {events}")


@webhooks_group.command(name="create")
@click.option("--url", required=True, help="Webhook destination URL")
@click.option(
    "--event",
    "events",
    multiple=True,
    required=True,
    help="Event to subscribe to; repeat for multiple values",
)
@click.option("--secret", default=None, help="Optional webhook secret")
@click.option("--inactive", is_flag=True, help="Create the webhook disabled")
def create_webhook(url: str, events: tuple[str, ...], secret: Optional[str], inactive: bool):
    """Create a webhook"""
    config, client = _require_auth()
    if not config:
        return

    payload: dict[str, Any] = {"url": url, "events": list(events), "is_active": not inactive}
    if secret is not None:
        payload["secret"] = secret

    response = client.post("/v1/webhooks/", json=payload)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code in (200, 201):
        webhook = response.json()
        active = "active" if webhook.get("is_active", False) else "inactive"
        click.echo(f"Created webhook: {webhook.get('id')}")
        click.echo(f"URL: {webhook.get('url')}")
        click.echo(f"Status: {active}")
        click.echo(f"Events: {','.join(webhook.get('events', [])) or '*'}")
        return

    click.echo(f"Error: {response.text}", err=True)


@webhooks_group.command(name="deliveries")
@click.argument("webhook_id")
@click.option("--skip", "-s", default=0, help="Number of deliveries to skip")
@click.option("--limit", "-l", default=50, help="Number of deliveries to fetch")
@click.option("--event", help="Filter by event")
@click.option(
    "--success",
    type=click.Choice(["true", "false"], case_sensitive=False),
    help="Filter by success status (true/false)",
)
def webhook_deliveries(
    webhook_id: str, skip: int, limit: int, event: Optional[str], success: Optional[str]
):
    """Fetch delivery history for a webhook"""
    config, client = _require_auth()
    if not config:
        return

    params: dict[str, Any] = {"skip": skip, "limit": limit}
    if event:
        params["event"] = event
    if success is not None:
        params["success"] = success.lower() == "true"

    response = client.get(f"/v1/webhooks/{webhook_id}/deliveries", params=params)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    deliveries = response.json()
    if not deliveries:
        click.echo("No webhook deliveries found.")
        return

    for item in deliveries:
        click.echo(
            f"{item['id']} | event={item['event']} | success={item['success']} | attempts={item['attempts']} | status={item.get('status_code') or 'n/a'}"
        )


@webhooks_group.command(name="get")
@click.argument("webhook_id")
def get_webhook(webhook_id: str):
    """Fetch one webhook by id"""
    config, client = _require_auth()
    if not config:
        return

    response = client.get(f"/v1/webhooks/{webhook_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Webhook not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    webhook = response.json()
    active = "active" if webhook.get("is_active", False) else "inactive"
    click.echo(f"{webhook['id']} | {webhook['url']} | {active}")
    click.echo(f"Events: {','.join(webhook.get('events', [])) or '*'}")
    click.echo(f"Created: {webhook.get('created_at')}")


@webhooks_group.command(name="update")
@click.argument("webhook_id")
@click.option("--url", default=None, help="Replace the webhook URL")
@click.option(
    "--event", "events", multiple=True, help="Replace subscribed events; repeat for multiple values"
)
@click.option("--active/--inactive", "is_active", default=None, help="Set webhook status")
def update_webhook(
    webhook_id: str, url: Optional[str], events: tuple[str, ...], is_active: Optional[bool]
):
    """Update a webhook"""
    config, client = _require_auth()
    if not config:
        return

    payload: dict[str, Any] = {}
    if url is not None:
        payload["url"] = url
    if events:
        payload["events"] = list(events)
    if is_active is not None:
        payload["is_active"] = is_active

    if not payload:
        click.echo("Error: Provide at least one field to update.", err=True)
        return

    response = client.patch(f"/v1/webhooks/{webhook_id}", json=payload)

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Webhook not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    webhook = response.json()
    active = "active" if webhook.get("is_active", False) else "inactive"
    click.echo(f"Updated webhook: {webhook.get('id')}")
    click.echo(f"URL: {webhook.get('url')}")
    click.echo(f"Status: {active}")
    click.echo(f"Events: {','.join(webhook.get('events', [])) or '*'}")


@webhooks_group.command(name="test")
@click.argument("webhook_id")
def test_webhook(webhook_id: str):
    """Send a test event to a webhook"""
    config, client = _require_auth()
    if not config:
        return

    response = client.post(f"/v1/webhooks/{webhook_id}/test")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Webhook not found", err=True)
        return

    if response.status_code != 200:
        click.echo(f"Error: {response.text}", err=True)
        return

    payload = response.json()
    click.echo(f"Tested webhook: {webhook_id}")
    click.echo(f"Status: {payload.get('status')}")
    click.echo(f"Message: {payload.get('message')}")


@webhooks_group.command(name="delete")
@click.argument("webhook_id")
@click.option("--force", "force", is_flag=True, help="Delete without confirmation")
def delete_webhook(webhook_id: str, force: bool):
    """Delete a webhook"""
    config, client = _require_auth()
    if not config:
        return

    if not force and not click.confirm(f"Are you sure you want to delete webhook {webhook_id}?"):
        return

    response = client.delete(f"/v1/webhooks/{webhook_id}")

    if response.status_code == 401:
        click.echo("Error: Authentication expired. Run 'mutx login' again.", err=True)
        return

    if response.status_code == 404:
        click.echo("Error: Webhook not found", err=True)
        return

    if response.status_code != 204:
        click.echo(f"Error: {response.text}", err=True)
        return

    click.echo(f"Deleted webhook: {webhook_id}")
