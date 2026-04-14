import click
from typing import Any, Optional

from cli.config import current_config, get_client
from cli.operator_readiness import describe_webhook_delivery_health, describe_webhook_lifecycle


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

    payload = response.json()
    webhooks = payload.get("items", payload) if isinstance(payload, dict) else payload
    if not webhooks:
        click.echo("No webhooks found.")
        return

    for webhook in webhooks:
        lifecycle = describe_webhook_lifecycle(webhook)
        delivery = lifecycle
        last_delivery = "never"

        if lifecycle == "active":
            delivery_response = client.get(
                f"/v1/webhooks/{webhook['id']}/deliveries",
                params={"limit": 5, "skip": 0},
            )
            if delivery_response.status_code == 200:
                delivery_payload = delivery_response.json()
                deliveries = (
                    delivery_payload.get("deliveries", delivery_payload)
                    if isinstance(delivery_payload, dict)
                    else delivery_payload
                )
                delivery = describe_webhook_delivery_health(webhook, deliveries)
                if deliveries:
                    latest_delivery = deliveries[0]
                    last_delivery = (
                        latest_delivery.get("created_at")
                        or latest_delivery.get("delivered_at")
                        or "unknown"
                    )
            else:
                delivery = "delivery-data-unavailable"

        events = ",".join(webhook.get("events", [])) or "*"
        click.echo(
            f"{webhook['id']} | {webhook['url']} | state={lifecycle} | delivery={delivery} | "
            f"last delivery: {last_delivery} | events: {events}"
        )


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

    payload = response.json()
    deliveries = payload.get("deliveries", payload) if isinstance(payload, dict) else payload
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
    lifecycle = describe_webhook_lifecycle(webhook)
    click.echo(f"{webhook['id']} | {webhook['url']} | state={lifecycle}")
    click.echo(f"Events: {','.join(webhook.get('events', [])) or '*'}")
    click.echo(f"Created: {webhook.get('created_at')}")


@webhooks_group.command(name="test")
@click.argument("webhook_id")
def test_webhook(webhook_id: str):
    """Trigger a test delivery for a webhook"""
    config = current_config()
    if not config.is_authenticated():
        click.echo("Error: Not authenticated. Run 'mutx login' first.", err=True)
        return

    client = get_client(config)
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
    click.echo(f"Triggered webhook test: {webhook_id}")
    if isinstance(payload, dict) and payload.get("message"):
        click.echo(str(payload["message"]))
