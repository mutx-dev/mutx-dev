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

    runner = CliRunner()
    result = runner.invoke(cli, ["webhooks", "list", "--limit", "25", "--skip", "5"])

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/webhooks",
        "params": {"limit": 25, "skip": 5},
    }
    assert "wh-123 | https://example.com/hook | active | events: agent.status" in result.output


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

    runner = CliRunner()
    result = runner.invoke(
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
        "params": {
            "skip": 3,
            "limit": 10,
            "event": "agent.status",
            "success": True,
        },
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

    runner = CliRunner()
    result = runner.invoke(cli, ["webhooks", "get", "wh-456"])

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/webhooks/wh-456",
        "params": None,
    }
    assert "wh-456 | https://example.com/hook | inactive" in result.output
    assert "Created: 2026-03-12T15:00:00" in result.output
