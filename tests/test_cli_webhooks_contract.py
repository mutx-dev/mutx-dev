from __future__ import annotations

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
        return DummyResponse(
            200,
            [
                {
                    "id": "wh-123",
                    "url": "https://example.com/hook",
                    "is_active": True,
                    "events": ["agent.status"],
                }
            ],
        )

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    result = CliRunner().invoke(cli, ["webhooks", "list", "--limit", "25", "--skip", "5"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks", "params": {"limit": 25, "skip": 5}}
    assert "wh-123 | https://example.com/hook | active | events: agent.status" in result.output


def test_webhooks_create_hits_contract_route_and_renders_resource(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": "wh-new",
                "url": json["url"],
                "events": json["events"],
                "is_active": json["is_active"],
                "created_at": "2026-03-19T00:00:00",
            },
        )

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    result = CliRunner().invoke(
        cli,
        [
            "webhooks",
            "create",
            "--url",
            "https://example.com/webhooks/mutx",
            "--event",
            "deployment.failed",
            "--event",
            "agent.status",
            "--inactive",
        ],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/webhooks/",
        "json": {
            "url": "https://example.com/webhooks/mutx",
            "events": ["deployment.failed", "agent.status"],
            "is_active": False,
        },
    }
    assert "Created webhook: wh-new" in result.output
    assert "Status: inactive" in result.output


def test_webhooks_deliveries_hits_live_delivery_route_and_query_contract(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    webhook_id = "wh-delivery-1"

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": "delivery-1",
                    "event": "agent.status",
                    "success": False,
                    "attempts": 2,
                    "status_code": 502,
                    "delivered_at": None,
                    "created_at": "2026-03-12T15:00:00",
                }
            ],
        )

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    result = CliRunner().invoke(
        cli,
        [
            "webhooks",
            "deliveries",
            webhook_id,
            "--skip",
            "3",
            "--limit",
            "10",
            "--event",
            "agent.status",
            "--success",
            "true",
        ],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": f"/v1/webhooks/{webhook_id}/deliveries",
        "params": {"skip": 3, "limit": 10, "event": "agent.status", "success": True},
    }
    assert (
        "delivery-1 | event=agent.status | success=False | attempts=2 | status=502" in result.output
    )


def test_webhooks_get_hits_contract_route_and_prints_created_timestamp(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            {
                "id": "wh-456",
                "url": "https://example.com/hook",
                "is_active": False,
                "events": ["deployment.failed"],
                "created_at": "2026-03-12T15:00:00",
            },
        )

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

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
        return DummyResponse(
            200,
            {
                "id": "wh-456",
                "url": json["url"],
                "events": json["events"],
                "is_active": json["is_active"],
                "created_at": "2026-03-12T15:00:00",
            },
        )

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(patch=fake_patch)
    )

    result = CliRunner().invoke(
        cli,
        [
            "webhooks",
            "update",
            "wh-456",
            "--url",
            "https://example.com/new",
            "--event",
            "deployment.failed",
            "--event",
            "deployment.started",
            "--active",
        ],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/webhooks/wh-456",
        "json": {
            "url": "https://example.com/new",
            "events": ["deployment.failed", "deployment.started"],
            "is_active": True,
        },
    }
    assert "Updated webhook: wh-456" in result.output
    assert "Status: active" in result.output


def test_webhooks_test_hits_contract_route_and_renders_delivery_status(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            200, {"status": "test_delivered", "message": "Test event delivered successfully"}
        )

    monkeypatch.setattr("cli.commands.webhooks.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

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
    monkeypatch.setattr(
        "cli.commands.webhooks.get_client", lambda config: SimpleNamespace(delete=fake_delete)
    )

    result = CliRunner().invoke(cli, ["webhooks", "delete", "wh-456", "--force"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/webhooks/wh-456"}
    assert "Deleted webhook: wh-456" in result.output
