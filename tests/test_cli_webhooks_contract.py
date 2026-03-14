from __future__ import annotations

import sys
from pathlib import Path
from typing import Any
from types import SimpleNamespace

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


def test_webhooks_list_hits_contract_route(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": "wh-1",
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
    result = runner.invoke(cli, ["webhooks", "list", "--limit", "5", "--skip", "2"])

    assert result.exit_code == 0
    assert captured == {
        "path": "/webhooks",
        "params": {
            "limit": 5,
            "skip": 2,
        },
    }
    assert "wh-1 | https://example.com/hook | active | events: agent.status" in result.output


def test_webhook_deliveries_hits_contract_route_and_filters(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": "dlv-1",
                    "webhook_id": "wh-1",
                    "event": "agent.status",
                    "payload": "{}",
                    "status_code": 200,
                    "success": False,
                    "error_message": None,
                    "attempts": 1,
                    "created_at": "2026-03-14T16:00:00Z",
                    "delivered_at": None,
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
            "wh-1",
            "--limit",
            "10",
            "--skip",
            "1",
            "--event",
            "agent.status",
            "--success",
            "false",
        ],
    )

    assert result.exit_code == 0
    assert captured["path"] == "/webhooks/wh-1/deliveries"
    assert captured["params"] == {
        "skip": 1,
        "limit": 10,
        "event": "agent.status",
        "success": False,
    }
    assert "dlv-1 | event=agent.status | success=False | attempts=1 | status=200" in result.output
