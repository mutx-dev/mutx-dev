from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

from click.testing import CliRunner

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.config import CLIConfig
from cli.config import HOSTED_API_URL
from cli.main import cli
from cli.services.base import ValidationError


class DummyResponse:
    def __init__(self, status_code: int, payload: dict[str, object]):
        self.status_code = status_code
        self._payload = payload
        self.text = json.dumps(payload)

    def json(self) -> dict[str, object]:
        return self._payload


def wizard_result_payload(*, reused_existing_assistant: bool = False) -> SimpleNamespace:
    return SimpleNamespace(
        binding=SimpleNamespace(
            agent_id="personal-assistant",
            workspace="/tmp/openclaw/workspace-personal-assistant",
        ),
        health=SimpleNamespace(status="healthy", gateway_url="http://127.0.0.1:18789"),
        deployment=None
        if reused_existing_assistant
        else {
            "agent": {"id": "agent-pa-01"},
            "deployment": {"id": "dep-pa-01"},
        },
        assistant_id="agent-pa-01",
        reused_existing_assistant=reused_existing_assistant,
        action_type="import",
        runtime_snapshot={
            "binary_path": "/opt/homebrew/bin/openclaw",
            "config_path": "/tmp/.openclaw/openclaw.json",
            "home_path": "/tmp/.openclaw",
            "privacy_summary": "MUTX tracks your local OpenClaw runtime without uploading local gateway keys or secrets.",
        },
    )




def test_setup_faramesh_does_not_auto_install(monkeypatch) -> None:
    from cli.commands import setup as setup_module

    captured: dict[str, object] = {}

    def fake_ensure(*, install_if_missing: bool, non_interactive: bool):
        captured["install_if_missing"] = install_if_missing
        captured["non_interactive"] = non_interactive
        return False, None

    monkeypatch.setattr(setup_module, "ensure_faramesh_installed", fake_ensure)

    setup_module._install_faramesh_governance()

    assert captured == {"install_if_missing": False, "non_interactive": True}

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

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: None)
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr(
        "cli.commands.setup.mark_auth_completed",
        lambda **kwargs: captured.__setitem__("auth_kwargs", kwargs),
    )
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: captured.__setitem__("wizard_kwargs", kwargs) or wizard_result_payload(),
    )
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
        "api_url": "https://control.example.com",
    }
    assert captured["auth_kwargs"]["mode"] == "hosted"
    assert captured["auth_kwargs"]["provider"] == "openclaw"
    assert captured["auth_kwargs"]["assistant_name"] == "Personal Assistant"
    assert captured["auth_kwargs"]["reset"] is True
    assert captured["wizard_kwargs"]["mode"] == "hosted"
    assert captured["wizard_kwargs"]["assistant_name"] == "Personal Assistant"
    assert captured["wizard_kwargs"]["install_openclaw"] is False
    assert captured["wizard_kwargs"]["requested_action"] == "install"
    assert captured["wizard_kwargs"]["openclaw_install_method"] == "npm"
    assert "Assistant deployed: agent-pa-01" in result.output
    assert "Deployment: dep-pa-01" in result.output
    assert "OpenClaw assistant_id: personal-assistant" in result.output
    assert "OpenClaw binary: /opt/homebrew/bin/openclaw" in result.output
    assert "Tracking: imported into ~/.mutx/providers/openclaw" in result.output
    assert launched["value"] is True


def test_setup_hosted_defaults_to_hosted_api(monkeypatch, tmp_path: Path) -> None:
    captured: dict[str, object] = {}
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def login(self, email: str, password: str, api_url: str | None = None) -> None:
            captured["login"] = {
                "email": email,
                "password": password,
                "api_url": api_url,
            }

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: None)
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr(
        "cli.commands.setup.mark_auth_completed",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: wizard_result_payload(),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "hosted",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
            "--no-input",
        ],
    )

    assert result.exit_code == 0
    assert config.api_url == HOSTED_API_URL
    assert captured["login"] == {
        "email": "operator@example.com",
        "password": "StrongPass1!",
        "api_url": HOSTED_API_URL,
    }


def test_setup_local_bootstraps_local_operator_without_credentials(
    monkeypatch, tmp_path: Path
) -> None:
    captured: dict[str, object] = {}
    launched = {"value": False}
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def local_bootstrap(self, name: str, api_url: str | None = None) -> None:
            captured["local_bootstrap"] = {
                "name": name,
                "api_url": api_url,
            }

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: None)
    monkeypatch.setattr(
        "cli.commands.setup.ensure_local_control_plane",
        lambda **kwargs: SimpleNamespace(
            bootstrapped_now=False,
            source_kind="managed_checkout",
        ),
    )
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr(
        "cli.commands.setup.mark_auth_completed",
        lambda **kwargs: captured.__setitem__("auth_kwargs", kwargs),
    )
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: captured.__setitem__("wizard_kwargs", kwargs) or wizard_result_payload(),
    )
    monkeypatch.setattr(
        "cli.commands.setup.launch_tui",
        lambda: launched.__setitem__("value", True),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "local",
            "--name",
            "Studio Operator",
            "--assistant-name",
            "Personal Assistant",
            "--open-tui",
            "--no-input",
        ],
    )

    assert result.exit_code == 0
    assert config.api_url == "http://localhost:8000"
    assert captured["local_bootstrap"] == {
        "name": "Studio Operator",
        "api_url": None,
    }
    assert captured["auth_kwargs"]["mode"] == "local"
    assert captured["wizard_kwargs"]["mode"] == "local"
    assert captured["wizard_kwargs"]["assistant_name"] == "Personal Assistant"
    assert "Assistant deployed: agent-pa-01" in result.output
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
                assistant_id="personal-assistant",
                workspace="/tmp/openclaw/workspace-personal-assistant",
                session_count=2,
                gateway=SimpleNamespace(status="healthy"),
            )

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.doctor.AuthService", DummyAuth)
    monkeypatch.setattr("cli.commands.doctor.AssistantService", DummyAssistant)
    monkeypatch.setattr(
        "cli.commands.doctor.prepare_runtime_state_sync",
        lambda *args, **kwargs: {
            "status": "healthy",
            "last_seen_at": "2026-03-21T10:00:00+00:00",
            "last_synced_at": "2026-03-21T10:00:30+00:00",
        },
    )
    monkeypatch.setattr(
        "cli.commands.doctor.get_gateway_health",
        lambda: SimpleNamespace(
            to_payload=lambda: {
                "status": "healthy",
                "cli_available": True,
                "installed": True,
                "onboarded": True,
                "gateway_configured": True,
                "gateway_reachable": True,
                "gateway_port": 18789,
                "gateway_url": "http://127.0.0.1:18789",
                "credential_detected": True,
                "config_path": "/tmp/openclaw.json",
                "state_dir": "/tmp/.openclaw",
                "doctor_summary": "Gateway is reachable and ready for assistant operations.",
            }
        ),
    )
    monkeypatch.setattr(
        "cli.commands.doctor.collect_openclaw_runtime_snapshot",
        lambda: SimpleNamespace(
            to_payload=lambda: {
                "provider": "openclaw",
                "binding_count": 1,
                "home_path": "/tmp/.openclaw",
                "last_seen_at": "2026-03-21T10:00:00+00:00",
            }
        ),
    )
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
        "openclaw": {
            "status": "healthy",
            "cli_available": True,
            "installed": True,
            "onboarded": True,
            "gateway_configured": True,
            "gateway_reachable": True,
            "gateway_port": 18789,
            "gateway_url": "http://127.0.0.1:18789",
            "credential_detected": True,
            "config_path": "/tmp/openclaw.json",
            "state_dir": "/tmp/.openclaw",
            "doctor_summary": "Gateway is reachable and ready for assistant operations.",
        },
        "runtime_snapshot": {
            "provider": "openclaw",
            "binding_count": 1,
            "home_path": "/tmp/.openclaw",
            "last_seen_at": "2026-03-21T10:00:00+00:00",
        },
        "user": {
            "email": "operator@example.com",
            "name": "Operator",
            "plan": "pro",
        },
        "assistant": {
            "name": "Personal Assistant",
            "status": "running",
            "onboarding_status": "completed",
            "assistant_id": "personal-assistant",
            "workspace": "/tmp/openclaw/workspace-personal-assistant",
            "session_count": 2,
            "gateway_status": "healthy",
        },
    }


def test_setup_hosted_no_input_requires_explicit_openclaw_install(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def login(self, email: str, password: str, api_url: str | None = None) -> None:
            return None

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: None)
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr(
        "cli.commands.setup.mark_auth_completed",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: (_ for _ in ()).throw(
            ValidationError("OpenClaw is required for the Personal Assistant.")
        ),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "hosted",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
            "--no-input",
        ],
    )

    assert result.exit_code != 0
    assert "OpenClaw is required for the Personal Assistant." in result.output


def test_setup_hosted_uses_import_action_when_openclaw_exists(monkeypatch, tmp_path: Path) -> None:
    captured: dict[str, object] = {}
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def login(self, email: str, password: str, api_url: str | None = None) -> None:
            return None

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: "/opt/homebrew/bin/openclaw")
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr("cli.commands.setup.mark_auth_completed", lambda **kwargs: None)
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: captured.__setitem__("wizard_kwargs", kwargs) or wizard_result_payload(),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "hosted",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
            "--no-input",
        ],
    )

    assert result.exit_code == 0
    assert captured["wizard_kwargs"]["requested_action"] == "import"
    assert "Adoption: existing OpenClaw runtime added to MUTX tracking" in result.output


def test_setup_hosted_interactive_can_choose_openclaw_tui(monkeypatch, tmp_path: Path) -> None:
    captured: dict[str, object] = {}
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def login(self, email: str, password: str, api_url: str | None = None) -> None:
            return None

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: "/opt/homebrew/bin/openclaw")
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr("cli.commands.setup.mark_auth_completed", lambda **kwargs: None)
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: captured.__setitem__("wizard_kwargs", kwargs) or wizard_result_payload(),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "hosted",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
        ],
        input="3\n",
    )

    assert result.exit_code == 0
    assert "Import Existing OpenClaw 🦞" in result.output
    assert "Open OpenClaw TUI 🦞" in result.output
    assert captured["wizard_kwargs"]["requested_action"] == "tui"


def test_setup_hosted_interactive_can_choose_repair(monkeypatch, tmp_path: Path) -> None:
    captured: dict[str, object] = {}
    config = CLIConfig(config_path=tmp_path / "config.json")

    class DummyAuth:
        def login(self, email: str, password: str, api_url: str | None = None) -> None:
            return None

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.commands.setup.find_openclaw_bin", lambda: "/opt/homebrew/bin/openclaw")
    monkeypatch.setattr("cli.commands.setup._auth_service", lambda: DummyAuth())
    monkeypatch.setattr("cli.commands.setup.mark_auth_completed", lambda **kwargs: None)
    monkeypatch.setattr(
        "cli.commands.setup.run_openclaw_setup_wizard",
        lambda **kwargs: captured.__setitem__("wizard_kwargs", kwargs) or wizard_result_payload(),
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "setup",
            "hosted",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
        ],
        input="2\n",
    )

    assert result.exit_code == 0
    assert captured["wizard_kwargs"]["requested_action"] == "install"
    assert captured["wizard_kwargs"]["install_openclaw"] is True


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
