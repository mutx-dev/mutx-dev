from __future__ import annotations

import sys
import json
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
