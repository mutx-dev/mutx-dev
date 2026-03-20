from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

from click.testing import CliRunner

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.config import CLIConfig
from cli.main import cli


class DummyResponse:
    def __init__(self, status_code: int, payload: dict[str, object]):
        self.status_code = status_code
        self._payload = payload
        self.text = json.dumps(payload)

    def json(self) -> dict[str, object]:
        return self._payload


def test_setup_hosted_deploys_personal_assistant(monkeypatch, tmp_path: Path) -> None:
    captured: dict[str, object] = {}
    launched = {"value": False}
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def login(self, email: str, password: str, api_url: str | None = None) -> None:
            captured["login"] = {
                "email": email,
                "password": password,
                "api_url": api_url,
            }

    class DummyTemplates:
        def deploy_template(self, template_id: str, **kwargs: object) -> dict[str, object]:
            captured["template_id"] = template_id
            captured["template_kwargs"] = kwargs
            return {
                "agent": {"id": "agent-pa-01"},
                "deployment": {"id": "dep-pa-01"},
            }

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr("cli.commands.setup._templates_service", lambda: DummyTemplates())
    monkeypatch.setattr(
        "cli.commands.setup.launch_tui",
        lambda: launched.__setitem__("value", True),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "hosted",
            "--api-url",
            "https://control.example.com",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
            "--assistant-name",
            "Personal Assistant",
            "--open-tui",
            "--no-input",
        ],
    )

    assert result.exit_code == 0
    assert config.api_url == "https://control.example.com"
    assert captured["login"] == {
        "email": "operator@example.com",
        "password": "StrongPass1!",
        "api_url": None,
    }
    assert captured["template_id"] == "personal_assistant"
    assert captured["template_kwargs"] == {
        "name": "Personal Assistant",
        "description": None,
        "replicas": 1,
        "model": None,
        "workspace": None,
    }
    assert "Assistant deployed: agent-pa-01" in result.output
    assert "Deployment: dep-pa-01" in result.output
    assert launched["value"] is True


def test_doctor_json_reports_assistant_state(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    config.api_url = "https://control.example.com"
    config.access_token = "access-token"
    config.refresh_token = "refresh-token"
    config.set_runtime_api_url("https://override.example.com")

    class DummyAuth:
        def __init__(self, config: CLIConfig):
            self.config = config

        def status(self):
            return SimpleNamespace(authenticated=True)

        def whoami(self):
            return SimpleNamespace(email="operator@example.com", name="Operator", plan="pro")

    class DummyAssistant:
        def __init__(self, config: CLIConfig):
            self.config = config

        def overview(self):
            return SimpleNamespace(
                name="Personal Assistant",
                status="running",
                onboarding_status="completed",
                session_count=2,
                gateway=SimpleNamespace(status="healthy"),
            )

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.doctor.AuthService", DummyAuth)
    monkeypatch.setattr("cli.commands.doctor.AssistantService", DummyAssistant)
    monkeypatch.setattr(
        "cli.commands.doctor.httpx.get",
        lambda url, timeout=2.0: DummyResponse(200, {"status": "healthy"}),
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["doctor", "--output", "json"])

    assert result.exit_code == 0
    payload = json.loads(result.output)
    assert payload == {
        "api_url": "https://override.example.com",
        "api_url_source": "flag",
        "config_path": str(config.config_path),
        "authenticated": True,
        "api_health": "healthy",
        "user": {
            "email": "operator@example.com",
            "name": "Operator",
            "plan": "pro",
        },
        "assistant": {
            "name": "Personal Assistant",
            "status": "running",
            "onboarding_status": "completed",
            "session_count": 2,
            "gateway_status": "healthy",
        },
    }


def test_cli_config_migrates_legacy_api_key(tmp_path: Path) -> None:
    config_path = tmp_path / "config.json"
    config_path.write_text(
        json.dumps(
            {
                "api_url": "http://localhost:8000",
                "api_key": "legacy-access-token",
                "refresh_token": "refresh-token",
            }
        ),
        encoding="utf-8",
    )

    config = CLIConfig(config_path=config_path)

    assert config.access_token == "legacy-access-token"
    assert config.api_key == "legacy-access-token"
    stored = json.loads(config_path.read_text(encoding="utf-8"))
    assert stored["access_token"] == "legacy-access-token"
    assert "api_key" not in stored
