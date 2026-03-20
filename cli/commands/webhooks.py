import click
from typing import Any, Optional

from cli.config import current_config, get_client


@click.group(name="webhooks")
def webhooks_group():
    """Manage webhooks and delivery history"""
    pass


@webhooks_group.command(name="list")
@click.option("--limit", "-l", default=50, help="Number of webhooks to fetch")
@click.option("--skip", "-s", default=0, help="Number of webhooks to skip")
def list_webhooks(limit: int, skip: int):
    """List all configured webhooks"""
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
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
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    params: dict[str, Any] = {"skip": skip, "limit": limit}
    if event:
        params["event"] = event
    if success is not None:
        params["success"] = success.lower() == "true"

    client = get_client(config)
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
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
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
