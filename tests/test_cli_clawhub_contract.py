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


def test_clawhub_list_hits_canonical_route_and_renders_table(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(
            200,
            [
                {
                    "id": "skill-001",
                    "name": "web-search",
                    "stars": 42,
                    "author": "acme-corp",
                },
                {
                    "id": "skill-002",
                    "name": "pdf-reader",
                    "stars": 15,
                    "author": "open-source",
                },
            ],
        )

    monkeypatch.setattr("cli.commands.clawhub.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.clawhub.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["clawhub", "list"])

    assert result.exit_code == 0
    assert captured["path"] == "/v1/clawhub/skills"
    assert "skill-001" in result.output
    assert "web-search" in result.output
    assert "acme-corp" in result.output
    assert "skill-002" in result.output


def test_clawhub_list_shows_empty_message_when_no_skills(monkeypatch) -> None:
    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        return DummyResponse(200, [])

    monkeypatch.setattr("cli.commands.clawhub.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.clawhub.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["clawhub", "list"])

    assert result.exit_code == 0
    assert "No skills found." in result.output


def test_clawhub_install_hits_canonical_route_and_reports_success(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(200, {"status": "installing"})

    monkeypatch.setattr("cli.commands.clawhub.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.clawhub.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(
        cli, ["clawhub", "install", "--agent-id", "agent-abc", "--skill-id", "skill-001"]
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/clawhub/install",
        "json": {"agent_id": "agent-abc", "skill_id": "skill-001"},
    }
    assert "Successfully initiated installation of 'skill-001' for agent agent-abc" in result.output


def test_clawhub_uninstall_hits_canonical_route_and_reports_success(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(200, {"status": "uninstalling"})

    monkeypatch.setattr("cli.commands.clawhub.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.clawhub.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(
        cli, ["clawhub", "uninstall", "--agent-id", "agent-abc", "--skill-id", "skill-001"]
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/clawhub/uninstall",
        "json": {"agent_id": "agent-abc", "skill_id": "skill-001"},
    }
    assert "Successfully uninstalled 'skill-001' from agent agent-abc" in result.output
