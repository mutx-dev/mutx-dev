from pathlib import Path

repo = Path('/Users/fortune/mutx-worktrees/factory/backend')

(repo / 'cli/commands/webhooks.py').write_text('''import click
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
@click.option("--event", "events", multiple=True, required=True, help="Event to subscribe to; repeat for multiple values")
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
@click.option("--success", type=click.Choice(["true", "false"], case_sensitive=False), help="Filter by success status (true/false)")
def webhook_deliveries(webhook_id: str, skip: int, limit: int, event: Optional[str], success: Optional[str]):
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
        click.echo(f"{item['id']} | event={item['event']} | success={item['success']} | attempts={item['attempts']} | status={item.get('status_code') or 'n/a'}")


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
@click.option("--event", "events", multiple=True, help="Replace subscribed events; repeat for multiple values")
@click.option("--active/--inactive", "is_active", default=None, help="Set webhook status")
def update_webhook(webhook_id: str, url: Optional[str], events: tuple[str, ...], is_active: Optional[bool]):
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
''')

(repo / 'tests/test_cli_webhooks_contract.py').write_text('''from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from click.testing import CliRunner

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.main import cli


class DummyConfig:
    def is_authenticated(self) -> bool:
        return True


class DummyResponse:
    def __init__(self, status_code: int, payload: Any):
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self) -> Any:
        return self._payload


def test_webhooks_list_hits_contract_route_and_forwards_filters(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(200, [{"id": "wh-123", "url": "https://example.com/hook", "is_active": True, "events": ["agent.status"]}])

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(get=fake_get))

    result = CliRunner().invoke(cli, ["webhooks", "list", "--limit", "25", "--skip", "5"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks", "params": {"limit": 25, "skip": 5}}
    assert "wh-123 | https://example.com/hook | active | events: agent.status" in result.output


def test_webhooks_create_hits_contract_route_and_renders_resource(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(201, {"id": "wh-new", "url": json["url"], "events": json["events"], "is_active": json["is_active"], "created_at": "2026-03-19T00:00:00"})

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(post=fake_post))

    result = CliRunner().invoke(cli, ["webhooks", "create", "--url", "https://example.com/webhooks/mutx", "--event", "deployment.failed", "--event", "agent.status", "--inactive"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks/", "json": {"url": "https://example.com/webhooks/mutx", "events": ["deployment.failed", "agent.status"], "is_active": False}}
    assert "Created webhook: wh-new" in result.output
    assert "Status: inactive" in result.output


def test_webhooks_deliveries_hits_live_delivery_route_and_query_contract(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    webhook_id = "wh-delivery-1"

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(200, [{"id": "delivery-1", "event": "agent.status", "success": False, "attempts": 2, "status_code": 502, "delivered_at": None, "created_at": "2026-03-12T15:00:00"}])

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(get=fake_get))

    result = CliRunner().invoke(cli, ["webhooks", "deliveries", webhook_id, "--skip", "3", "--limit", "10", "--event", "agent.status", "--success", "true"])

    assert result.exit_code == 0
    assert captured == {"path": f"/v1/webhooks/{webhook_id}/deliveries", "params": {"skip": 3, "limit": 10, "event": "agent.status", "success": True}}
    assert "delivery-1 | event=agent.status | success=False | attempts=2 | status=502" in result.output


def test_webhooks_get_hits_contract_route_and_prints_created_timestamp(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(200, {"id": "wh-456", "url": "https://example.com/hook", "is_active": False, "events": ["deployment.failed"], "created_at": "2026-03-12T15:00:00"})

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(get=fake_get))

    result = CliRunner().invoke(cli, ["webhooks", "get", "wh-456"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks/wh-456", "params": None}
    assert "wh-456 | https://example.com/hook | inactive" in result.output
    assert "Created: 2026-03-12T15:00:00" in result.output


def test_webhooks_update_hits_contract_route_and_sends_patch_payload(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_patch(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(200, {"id": "wh-456", "url": json["url"], "events": json["events"], "is_active": json["is_active"], "created_at": "2026-03-12T15:00:00"})

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(patch=fake_patch))

    result = CliRunner().invoke(cli, ["webhooks", "update", "wh-456", "--url", "https://example.com/new", "--event", "deployment.failed", "--event", "deployment.started", "--active"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks/wh-456", "json": {"url": "https://example.com/new", "events": ["deployment.failed", "deployment.started"], "is_active": True}}
    assert "Updated webhook: wh-456" in result.output
    assert "Status: active" in result.output


def test_webhooks_test_hits_contract_route_and_renders_delivery_status(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(200, {"status": "test_delivered", "message": "Test event delivered successfully"})

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(post=fake_post))

    result = CliRunner().invoke(cli, ["webhooks", "test", "wh-456"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks/wh-456/test", "json": None}
    assert "Tested webhook: wh-456" in result.output
    assert "Status: test_delivered" in result.output


def test_webhooks_delete_hits_contract_route_and_supports_force(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_delete(path: str) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(204, None)

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.webhooks.get_client", lambda config: SimpleNamespace(delete=fake_delete))

    result = CliRunner().invoke(cli, ["webhooks", "delete", "wh-456", "--force"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks/wh-456"}
    assert "Deleted webhook: wh-456" in result.output
''')

(repo / 'docs/api/webhooks.md').write_text('''# Webhooks

Webhooks let MUTX push agent and deployment events to your endpoint in near real time.

## Canonical base path

All webhook routes live under:

```http
/v1/webhooks
```

Authentication supports either:
- `Authorization: Bearer <token>`
- `X-API-Key: <api-key>`

Responses are returned as raw JSON resources/arrays rather than `{ "data": ... }` envelopes.

## Resource shape

Webhook objects currently look like:

```json
{
  "id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true,
  "created_at": "2026-03-19T00:00:00Z"
}
```

Delivery records currently look like:

```json
{
  "id": "4fed8ef3-2fd7-4883-82d0-77c45ec3e4e7",
  "webhook_id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "event": "deployment.failed",
  "payload": {"deployment_id": "dep_123"},
  "status_code": 502,
  "success": false,
  "error_message": "upstream timeout",
  "attempts": 2,
  "created_at": "2026-03-19T00:00:00Z",
  "delivered_at": null
}
```

## Endpoints

### List webhooks

```http
GET /v1/webhooks?skip=0&limit=50
```

**Response**

```json
[
  {
    "id": "9db63131-8e22-4698-991d-f4b460e4b761",
    "url": "https://example.com/webhooks/mutx",
    "events": ["deployment.failed", "agent.status"],
    "secret": "whsec_optional",
    "is_active": true,
    "created_at": "2026-03-19T00:00:00Z"
  }
]
```

### Create webhook

```http
POST /v1/webhooks/
Content-Type: application/json
```

**Request body**

```json
{
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true
}
```

Notes:
- `url` must start with `http://` or `https://`
- `events` may contain explicit event names or `*`
- invalid event names return `400`

**Response**

```json
{
  "id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true,
  "created_at": "2026-03-19T00:00:00Z"
}
```

### Get webhook

```http
GET /v1/webhooks/{webhook_id}
```

**Response**

```json
{
  "id": "9db63131-8e22-4698-991d-f4b460e4b761",
  "url": "https://example.com/webhooks/mutx",
  "events": ["deployment.failed", "agent.status"],
  "secret": "whsec_optional",
  "is_active": true,
  "created_at": "2026-03-19T00:00:00Z"
}
```

### Update webhook

```http
PATCH /v1/webhooks/{webhook_id}
Content-Type: application/json
```

Send only the fields you want to change.

```json
{
  "url": "https://example.com/webhooks/new-destination",
  "events": ["deployment.failed"],
  "is_active": false
}
```

**Response**

Returns the updated webhook object.

### Delete webhook

```http
DELETE /v1/webhooks/{webhook_id}
```

**Response**
- `204 No Content` on success

### Test webhook

```http
POST /v1/webhooks/{webhook_id}/test
```

Sends a synthetic `test` event to the configured destination.

**Success response**

```json
{
  "status": "test_delivered",
  "message": "Test event delivered successfully"
}
```

**Failure response**

```json
{
  "detail": "Test event delivery failed. Check webhook URL and ensure it's reachable."
}
```

### Delivery history

```http
GET /v1/webhooks/{webhook_id}/deliveries?event=deployment.failed&success=false&skip=0&limit=50
```

**Query parameters**
- `event` — exact event-name filter
- `success` — `true` / `false`
- `skip` — pagination offset
- `limit` — page size (`1..500`)

**Response**

```json
[
  {
    "id": "4fed8ef3-2fd7-4883-82d0-77c45ec3e4e7",
    "webhook_id": "9db63131-8e22-4698-991d-f4b460e4b761",
    "event": "deployment.failed",
    "payload": {"deployment_id": "dep_123"},
    "status_code": 502,
    "success": false,
    "error_message": "upstream timeout",
    "attempts": 2,
    "created_at": "2026-03-19T00:00:00Z",
    "delivered_at": null
  }
]
```

## Event subscriptions

The backend validates requested events against the live webhook event enum. Wildcard `*` is allowed, and event-prefix wildcards like `deployment.*` are accepted when they match a real event namespace.

## CLI parity

```bash
mutx webhooks list
mutx webhooks create --url https://example.com/hook --event deployment.failed --event agent.status
mutx webhooks get <webhook-id>
mutx webhooks update <webhook-id> --inactive
mutx webhooks test <webhook-id>
mutx webhooks deliveries <webhook-id> --success false
mutx webhooks delete <webhook-id> --force
```
''')
