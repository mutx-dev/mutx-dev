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



def test_deploy_events_hits_contract_route_and_renders_items(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            {
                "deployment_id": "dep-123",
                "deployment_status": "running",
                "items": [
                    {
                        "created_at": "2026-03-12T15:00:00",
                        "event_type": "scale",
                        "status": "running",
                        "node_id": "node-1",
                    }
                ],
            },
        )

    monkeypatch.setattr("cli.commands.deploy.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.deploy.get_client", lambda config: SimpleNamespace(get=fake_get))

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["deploy", "events", "dep-123", "--limit", "25", "--skip", "10", "--event-type", "scale", "--status", "running"],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/deployments/dep-123/events",
        "params": {
            "limit": 25,
            "skip": 10,
            "event_type": "scale",
            "status": "running",
        },
    }
    assert "Deployment: dep-123 | status: running" in result.output
    assert "scale | running | node: node-1" in result.output


def test_deploy_list_passes_agent_and_status_filters(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": "dep-123",
                    "agent_id": "agent-123",
                    "status": "running",
                    "replicas": 2,
                }
            ],
        )

    monkeypatch.setattr("cli.commands.deploy.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.deploy.get_client", lambda config: SimpleNamespace(get=fake_get))

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["deploy", "list", "--limit", "5", "--skip", "2", "--agent-id", "agent-123", "--status", "running"],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/deployments",
        "params": {
            "limit": 5,
            "skip": 2,
            "agent_id": "agent-123",
            "status": "running",
        },
    }
    assert "dep-123 | agent-123 | running | replicas: 2" in result.output


def test_deploy_create_hits_canonical_route_with_replicas(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(201, {"id": "dep-456", "status": "pending"})

    monkeypatch.setattr("cli.commands.deploy.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.deploy.get_client", lambda config: SimpleNamespace(post=fake_post))

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["deploy", "create", "--agent-id", "agent-123", "--replicas", "3"],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/deployments",
        "json": {"agent_id": "agent-123", "replicas": 3},
    }
    assert "Created deployment: dep-456" in result.output
    assert "Status: pending" in result.output


def test_deploy_restart_hits_contract_route_and_renders_status(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(200, {"id": "dep-789", "status": "pending"})

    monkeypatch.setattr("cli.commands.deploy.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.deploy.get_client", lambda config: SimpleNamespace(post=fake_post))

    runner = CliRunner()
    result = runner.invoke(cli, ["deploy", "restart", "dep-789"])

    assert result.exit_code == 0
    assert captured == {
        "path": "/deployments/dep-789/restart",
        "json": None,
    }
    assert "Restarted deployment: dep-789" in result.output
    assert "Status: pending" in result.output
