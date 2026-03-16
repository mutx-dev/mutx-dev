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
        "path": "/v1/agents",
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
    assert captured["path"] == "/v1/agents"
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
        "path": f"/v1/agents/{agent_id}/deploy",
        "json": None,
    }
    assert f"Deploying agent: {agent_id}" in result.output
    assert "Deployment ID:" in result.output
    assert "Status: deploying" in result.output


def test_agents_list_hits_canonical_route_and_renders_agents(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": agent_id,
                    "name": "test-agent-1",
                    "status": "running",
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "test-agent-2",
                    "status": "stopped",
                },
            ],
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "list"])

    assert result.exit_code == 0
    assert captured["path"] == "/v1/agents"
    assert captured["params"] == {"limit": 50, "skip": 0}
    assert agent_id in result.output
    assert "test-agent-1" in result.output
    assert "running" in result.output


def test_agents_list_with_pagination_options(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(200, [])

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "list", "-l", "10", "-s", "20"])

    assert result.exit_code == 0
    assert captured["params"] == {"limit": 10, "skip": 20}


def test_agents_status_hits_canonical_route_and_renders_agent(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(
            200,
            {
                "id": agent_id,
                "name": "test-agent",
                "description": "A test agent",
                "status": "running",
                "created_at": "2026-03-14T10:00:00",
            },
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "status", agent_id])

    assert result.exit_code == 0
    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert f"Agent ID: {agent_id}" in result.output
    assert "Name: test-agent" in result.output
    assert "Description: A test agent" in result.output
    assert "Status: running" in result.output


def test_agents_logs_hits_canonical_route_and_renders_logs(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "timestamp": "2026-03-14T10:00:00",
                    "level": "INFO",
                    "message": "Agent started",
                },
                {
                    "timestamp": "2026-03-14T10:01:00",
                    "level": "WARNING",
                    "message": "High memory usage",
                },
            ],
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "logs", agent_id])

    assert result.exit_code == 0
    assert captured["path"] == f"/v1/agents/{agent_id}/logs"
    assert captured["params"] == {"limit": 100}
    assert "Agent started" in result.output
    assert "WARNING" in result.output


def test_agents_logs_with_level_filter(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(200, [])

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "logs", "agent-id", "-l", "50", "-L", "ERROR"])

    assert result.exit_code == 0
    assert captured["params"] == {"limit": 50, "level": "ERROR"}


def test_agents_delete_hits_canonical_route(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_delete(path: str) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(204, None)

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(delete=fake_delete)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "delete", agent_id, "--force"])

    assert result.exit_code == 0
    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert f"Deleted agent: {agent_id}" in result.output


def test_agents_delete_requires_confirmation_without_force(monkeypatch) -> None:
    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "delete", "agent-id"], input="n\n")

    assert result.exit_code == 0
    assert "Are you sure you want to delete agent" in result.output

def test_agents_list_with_table_format(monkeypatch) -> None:
    """Test that table format outputs properly formatted table"""
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": agent_id,
                    "name": "test-agent-1",
                    "status": "running",
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "test-agent-2",
                    "status": "stopped",
                },
            ],
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "list", "--format", "table"])

    assert result.exit_code == 0
    assert captured["path"] == "/v1/agents"
    assert "ID" in result.output
    assert "NAME" in result.output
    assert "STATUS" in result.output
    assert "test-agent-1" in result.output
    assert "running" in result.output


def test_agents_list_with_simple_format(monkeypatch) -> None:
    """Test that simple format outputs pipe-separated values"""
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["params"] = params
        return DummyResponse(
            200,
            [
                {
                    "id": agent_id,
                    "name": "test-agent-1",
                    "status": "running",
                },
            ],
        )

    monkeypatch.setattr("cli.commands.agents.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.agents.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["agents", "list", "--format", "simple"])

    assert result.exit_code == 0
    assert " | " in result.output
    assert agent_id in result.output

