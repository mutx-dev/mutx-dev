from __future__ import annotations

import sys
import uuid
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


def test_agents_create_hits_canonical_route_and_renders_agent(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": str(uuid.uuid4()),
                "name": "test-agent",
                "description": "A test agent",
                "status": "creating",
                "config": {"model": "gpt-4o"},
                "created_at": "2026-03-14T10:00:00",
                "updated_at": "2026-03-14T10:00:00",
                "user_id": str(uuid.uuid4()),
            },
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "agents",
            "create",
            "-n",
            "test-agent",
            "-d",
            "A test agent",
            "-t",
            "openai",
            "-c",
            '{"model":"gpt-4o"}',
        ],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/agents",
        "json": {
            "name": "test-agent",
            "description": "A test agent",
            "type": "openai",
            "config": {"model": "gpt-4o"},
        },
    }
    assert "Created agent:" in result.output
    assert "test-agent" in result.output


def test_agents_create_with_minimal_args(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": str(uuid.uuid4()),
                "name": "minimal-agent",
                "description": "",
                "status": "creating",
                "config": {},
                "created_at": "2026-03-14T10:00:00",
                "updated_at": "2026-03-14T10:00:00",
                "user_id": str(uuid.uuid4()),
            },
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "create", "-n", "minimal-agent"])

    assert result.exit_code == 0
    assert captured["path"] == "/agents"
    assert captured["json"]["name"] == "minimal-agent"
    assert captured["json"]["description"] == ""
    assert captured["json"]["type"] == "openai"


def test_agents_create_with_invalid_json_config(monkeypatch) -> None:
    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["agents", "create", "-n", "test-agent", "-c", "invalid json"],
    )

    assert "Error: Invalid JSON in config" in result.output


def test_agents_deploy_hits_contract_route_and_renders_deployment(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            200,
            {
                "deployment_id": str(uuid.uuid4()),
                "status": "deploying",
            },
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "deploy", agent_id])

    assert result.exit_code == 0
    assert captured == {
        "path": f"/agents/{agent_id}/deploy",
        "json": None,
    }
    assert f"Deploying agent: {agent_id}" in result.output
    assert "Deployment ID:" in result.output
    assert "Status: deploying" in result.output


def test_agents_list_hits_contract_route_and_renders_rows(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": "agent-123",
                    "name": "agent-one",
                    "status": "running",
                }
            ],
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get))

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "list", "--limit", "25", "--skip", "4"])

    assert result.exit_code == 0
    assert captured == {
        "path": "/agents",
        "params": {
            "limit": 25,
            "skip": 4,
        },
    }
    assert "agent-123 | agent-one | running" in result.output


def test_agents_status_hits_contract_route_and_renders_details(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            {
                "id": agent_id,
                "name": "status-agent",
                "description": "tracks status",
                "status": "running",
                "created_at": "2026-03-14T10:00:00",
            },
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get))

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "status", agent_id])

    assert result.exit_code == 0
    assert captured == {
        "path": f"/agents/{agent_id}",
        "params": None,
    }
    assert f"Agent ID: {agent_id}" in result.output
    assert "Name: status-agent" in result.output
    assert "Description: tracks status" in result.output
    assert "Status: running" in result.output


def test_agents_logs_hits_contract_route_and_supports_level_filter(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "timestamp": "2026-03-14T11:00:00",
                    "level": "ERROR",
                    "message": "failed to connect",
                }
            ],
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr("cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get))

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["agents", "logs", agent_id, "--limit", "40", "--level", "ERROR"],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": f"/agents/{agent_id}/logs",
        "params": {
            "limit": 40,
            "level": "ERROR",
        },
    }
    assert "2026-03-14T11:00:00 | ERROR | failed to connect" in result.output


def test_agents_delete_hits_contract_route_with_force(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_delete(path: str) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(204, {})

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client",
        lambda config: SimpleNamespace(delete=fake_delete),
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "delete", agent_id, "--force"])

    assert result.exit_code == 0
    assert captured == {
        "path": f"/agents/{agent_id}",
    }
    assert f"Deleted agent: {agent_id}" in result.output
