from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path
from typing import Any

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.webhooks import Webhook, Webhooks


def _webhook_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "url": "https://example.com/hook",
        "events": ["*"],
        "secret": None,
        "is_active": True,
        "created_at": "2026-03-12T08:16:00",
    }
    payload.update(overrides)
    return payload


def test_webhook_parses_is_active_and_keeps_active_alias() -> None:
    webhook = Webhook(_webhook_payload(is_active=False))

    assert webhook.is_active is False
    assert webhook.active is False


def test_webhooks_create_uses_trailing_slash_route_and_is_active_contract_field() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_webhook_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    webhooks = Webhooks(client)

    webhooks.create(
        url="https://example.com/hook",
        events=["agent.status"],
        is_active=False,
    )

    assert captured["path"] == "/webhooks/"
    assert captured["json"]["is_active"] is False
    assert "active" not in captured["json"]


def test_webhooks_update_maps_legacy_active_to_is_active_field() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_webhook_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    webhooks = Webhooks(client)

    webhooks.update(webhook_id=uuid.uuid4(), active=False)

    assert captured["json"] == {"is_active": False}


def test_webhooks_get_events_uses_expected_route_and_query_params() -> None:
    captured: dict[str, Any] = {}
    webhook_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    webhooks = Webhooks(client)

    webhooks.get_events(webhook_id=webhook_id, skip=5, limit=10)

    assert captured["path"] == f"/webhooks/{webhook_id}/events"
    assert captured["query"] == {"skip": "5", "limit": "10"}
