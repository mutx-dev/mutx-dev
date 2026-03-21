from __future__ import annotations

import json
from pathlib import Path

from cli.openclaw_runtime import (
    OpenClawAgentBinding,
    OpenClawGatewayHealth,
    build_openclaw_surface_command,
    ensure_personal_assistant_binding,
    get_gateway_health,
    inspect_importable_openclaw_runtime,
    list_local_sessions,
    merge_runtime_binding,
    persist_openclaw_runtime_snapshot,
    resolve_gateway_auth_argument,
)
from cli.errors import ValidationError
from cli.runtime_registry import (
    load_binding,
    load_manifest,
    load_wizard_state,
    provider_pointers_dir,
    reset_wizard_state,
    write_pointer,
)


def test_get_gateway_health_reports_needs_onboard_when_cli_exists_without_config(
    monkeypatch,
) -> None:
    monkeypatch.setattr("cli.openclaw_runtime.find_openclaw_bin", lambda: "/opt/homebrew/bin/openclaw")
    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_config_path", lambda: None)
    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_state_dir", lambda: None)
    monkeypatch.setattr("cli.openclaw_runtime.detect_gateway_port", lambda: None)

    health = get_gateway_health()

    assert health.status == "needs_onboard"
    assert health.installed is True
    assert health.onboarded is False


def test_ensure_personal_assistant_binding_reuses_existing_agent(monkeypatch) -> None:
    monkeypatch.setattr(
        "cli.openclaw_runtime.list_openclaw_agents",
        lambda: [
            {
                "id": "personal-assistant",
                "workspace": "/tmp/openclaw/workspace-personal-assistant",
                "agentDir": "/tmp/openclaw/agents/personal-assistant/agent",
                "model": "openai-codex/gpt-5.4",
            }
        ],
    )
    monkeypatch.setattr("cli.openclaw_runtime.detect_gateway_port", lambda: 18789)

    binding = ensure_personal_assistant_binding(
        assistant_name="Personal Assistant",
        install_method="npm",
    )

    assert binding.created is False
    assert binding.agent_id == "personal-assistant"
    assert binding.workspace == "/tmp/openclaw/workspace-personal-assistant"


def test_merge_runtime_binding_updates_assistant_identity() -> None:
    binding = OpenClawAgentBinding(
        agent_id="personal-assistant",
        workspace="/tmp/openclaw/workspace-personal-assistant",
        agent_dir="/tmp/openclaw/agents/personal-assistant/agent",
        model="openai-codex/gpt-5.4",
        install_method="npm",
        gateway_port=18789,
        created=True,
    )
    health = OpenClawGatewayHealth(
        status="healthy",
        cli_available=True,
        installed=True,
        onboarded=True,
        gateway_configured=True,
        gateway_reachable=True,
        gateway_port=18789,
        gateway_url="http://127.0.0.1:18789",
        credential_detected=True,
        config_path="/tmp/openclaw.json",
        state_dir="/tmp/.openclaw",
        doctor_summary="Gateway is reachable and ready for assistant operations.",
    )

    payload = merge_runtime_binding({"metadata": {"starter": True}}, binding=binding, health=health)

    assert payload["assistant_id"] == "personal-assistant"
    assert payload["workspace"] == "/tmp/openclaw/workspace-personal-assistant"
    assert payload["metadata"]["runtime"]["managed_by_mutx"] is True
    assert payload["metadata"]["runtime"]["gateway_status"] == "healthy"


def test_list_local_sessions_reads_openclaw_store(monkeypatch, tmp_path: Path) -> None:
    state_dir = tmp_path / ".openclaw"
    sessions_dir = state_dir / "agents" / "personal-assistant" / "sessions"
    sessions_dir.mkdir(parents=True)
    (sessions_dir / "sessions.json").write_text(
        json.dumps(
            {
                "abc": {
                    "sessionId": "session-01",
                    "updatedAt": 1_700_000_000_000,
                    "totalTokens": 2500,
                    "contextTokens": 8000,
                    "chatType": "dm",
                    "model": "openai-codex/gpt-5.4",
                    "deliveryContext": {"channel": "discord"},
                }
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("OPENCLAW_HOME", str(state_dir))

    sessions = list_local_sessions(assistant_id="personal-assistant")

    assert len(sessions) == 1
    assert sessions[0]["id"] == "session-01"
    assert sessions[0]["agent"] == "personal-assistant"
    assert sessions[0]["channel"] == "discord"


def test_persist_openclaw_runtime_snapshot_tracks_manifest_bindings_and_pointers(
    monkeypatch, tmp_path: Path
) -> None:
    mutx_home = tmp_path / ".mutx"
    openclaw_home = tmp_path / ".openclaw"
    openclaw_home.mkdir()
    config_path = openclaw_home / "openclaw.json"
    config_path.write_text(json.dumps({"gateway": {"port": 18789}}), encoding="utf-8")
    workspace = openclaw_home / "workspace-personal-assistant"
    binding = OpenClawAgentBinding(
        agent_id="personal-assistant",
        workspace=str(workspace),
        agent_dir=str(openclaw_home / "agents" / "personal-assistant" / "agent"),
        model="openai/gpt-5",
        install_method="npm",
        gateway_port=18789,
        created=False,
    )

    monkeypatch.setenv("MUTX_HOME", str(mutx_home))
    monkeypatch.setenv("OPENCLAW_HOME", str(openclaw_home))
    monkeypatch.setattr("cli.openclaw_runtime.find_openclaw_bin", lambda: "/usr/local/bin/openclaw")
    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_config_path", lambda: config_path)
    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_state_dir", lambda: openclaw_home)
    monkeypatch.setattr("cli.openclaw_runtime.detect_gateway_port", lambda: 18789)
    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_version", lambda: "openclaw 1.2.3")
    monkeypatch.setattr(
        "cli.openclaw_runtime.get_gateway_health",
        lambda: OpenClawGatewayHealth(
            status="healthy",
            cli_available=True,
            installed=True,
            onboarded=True,
            gateway_configured=True,
            gateway_reachable=True,
            gateway_port=18789,
            gateway_url="http://127.0.0.1:18789",
            credential_detected=True,
            config_path=str(config_path),
            state_dir=str(openclaw_home),
            doctor_summary="Gateway is reachable and ready for assistant operations.",
        ),
    )

    snapshot = persist_openclaw_runtime_snapshot(
        binding=binding,
        assistant_name="Personal Assistant",
        install_method="npm",
    ).to_payload()

    manifest = load_manifest("openclaw")
    tracked_binding = load_binding("openclaw", "personal-assistant")

    assert snapshot["binding_count"] == 1
    assert manifest["provider"] == "openclaw"
    assert manifest["gateway_url"] == "http://127.0.0.1:18789"
    assert manifest["binary_path"] == "/usr/local/bin/openclaw"
    assert manifest["tracking_mode"] == "import_existing_runtime"
    assert manifest["adopted_existing_runtime"] is True
    assert manifest["last_action_type"] == "import"
    assert manifest["import_source"]["binary_path"] == "/usr/local/bin/openclaw"
    assert manifest["keys_remain_local"] is True
    assert "does not upload local gateway keys" in manifest["privacy_summary"]
    assert tracked_binding["assistant_id"] == "personal-assistant"
    assert tracked_binding["workspace"] == str(workspace)
    assert (mutx_home / "providers" / "openclaw" / "pointers" / "home").exists()


def test_wizard_state_defaults_and_reset(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setenv("MUTX_HOME", str(tmp_path / ".mutx"))

    state = reset_wizard_state("openclaw", mode="hosted")

    assert state["provider"] == "openclaw"
    assert state["mode"] == "hosted"
    assert state["current_step"] == "auth"
    assert state["completed_steps"] == []
    assert load_wizard_state("openclaw")["providers"][0]["id"] == "openclaw"


def test_inspect_importable_openclaw_runtime_succeeds_for_valid_existing_install(monkeypatch) -> None:
    health = OpenClawGatewayHealth(
        status="healthy",
        cli_available=True,
        installed=True,
        onboarded=True,
        gateway_configured=True,
        gateway_reachable=True,
        gateway_port=18789,
        gateway_url="http://127.0.0.1:18789",
        credential_detected=True,
        config_path="/tmp/.openclaw/openclaw.json",
        state_dir="/tmp/.openclaw",
        doctor_summary="Gateway is reachable and ready for assistant operations.",
    )
    monkeypatch.setattr(
        "cli.openclaw_runtime.ensure_openclaw_installed",
        lambda **_: __import__("cli.openclaw_runtime", fromlist=["OpenClawInstallResolution"]).OpenClawInstallResolution(
            binary_path="/opt/homebrew/bin/openclaw",
            install_method="npm",
            disposition="detected_existing",
        ),
    )
    monkeypatch.setattr("cli.openclaw_runtime.resolve_openclaw_config_file", lambda: "/tmp/.openclaw/openclaw.json")
    monkeypatch.setattr("cli.openclaw_runtime.validate_openclaw_config", lambda: "Config valid")
    monkeypatch.setattr("cli.openclaw_runtime.get_gateway_health", lambda: health)

    resolution, imported_health = inspect_importable_openclaw_runtime(install_method="npm")

    assert resolution.binary_path == "/opt/homebrew/bin/openclaw"
    assert resolution.imported_existing is True
    assert imported_health.gateway_url == "http://127.0.0.1:18789"


def test_inspect_importable_openclaw_runtime_requires_reachable_gateway(monkeypatch) -> None:
    health = OpenClawGatewayHealth(
        status="degraded",
        cli_available=True,
        installed=True,
        onboarded=True,
        gateway_configured=True,
        gateway_reachable=False,
        gateway_port=18789,
        gateway_url="http://127.0.0.1:18789",
        credential_detected=True,
        config_path="/tmp/.openclaw/openclaw.json",
        state_dir="/tmp/.openclaw",
        doctor_summary="Gateway not reachable.",
    )
    monkeypatch.setattr(
        "cli.openclaw_runtime.ensure_openclaw_installed",
        lambda **_: __import__("cli.openclaw_runtime", fromlist=["OpenClawInstallResolution"]).OpenClawInstallResolution(
            binary_path="/opt/homebrew/bin/openclaw",
            install_method="npm",
            disposition="detected_existing",
        ),
    )
    monkeypatch.setattr("cli.openclaw_runtime.resolve_openclaw_config_file", lambda: "/tmp/.openclaw/openclaw.json")
    monkeypatch.setattr("cli.openclaw_runtime.validate_openclaw_config", lambda: "Config valid")
    monkeypatch.setattr("cli.openclaw_runtime.get_gateway_health", lambda: health)

    try:
        inspect_importable_openclaw_runtime(install_method="npm")
    except ValidationError as exc:
        assert "gateway is not reachable" in str(exc)
    else:
        raise AssertionError("Expected import inspection to reject an unreachable gateway.")


def test_resolve_gateway_auth_argument_reads_token_from_config(monkeypatch, tmp_path: Path) -> None:
    config_path = tmp_path / "openclaw.json"
    config_path.write_text(
        json.dumps({"gateway": {"auth": {"mode": "token", "token": "gateway-token"}}}),
        encoding="utf-8",
    )

    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_config_path", lambda: config_path)
    monkeypatch.delenv("OPENCLAW_GATEWAY_TOKEN", raising=False)
    monkeypatch.delenv("GATEWAY_TOKEN", raising=False)
    monkeypatch.delenv("OPENCLAW_GATEWAY_PASSWORD", raising=False)
    monkeypatch.delenv("GATEWAY_PASSWORD", raising=False)

    assert resolve_gateway_auth_argument() == ("--token", "gateway-token")


def test_resolve_gateway_auth_argument_reads_password_from_config(monkeypatch, tmp_path: Path) -> None:
    config_path = tmp_path / "openclaw.json"
    config_path.write_text(
        json.dumps({"gateway": {"auth": {"mode": "password", "password": "gateway-password"}}}),
        encoding="utf-8",
    )

    monkeypatch.setattr("cli.openclaw_runtime.detect_openclaw_config_path", lambda: config_path)
    monkeypatch.delenv("OPENCLAW_GATEWAY_TOKEN", raising=False)
    monkeypatch.delenv("GATEWAY_TOKEN", raising=False)
    monkeypatch.delenv("OPENCLAW_GATEWAY_PASSWORD", raising=False)
    monkeypatch.delenv("GATEWAY_PASSWORD", raising=False)

    assert resolve_gateway_auth_argument() == ("--password", "gateway-password")


def test_build_openclaw_surface_command_includes_gateway_url_and_auth_for_override(monkeypatch) -> None:
    monkeypatch.setattr("cli.openclaw_runtime.find_openclaw_bin", lambda: "/opt/homebrew/bin/openclaw")
    monkeypatch.setattr("cli.openclaw_runtime.detect_gateway_port", lambda: 18789)
    monkeypatch.setattr(
        "cli.openclaw_runtime.resolve_gateway_auth_argument",
        lambda: ("--token", "gateway-token"),
    )

    command = build_openclaw_surface_command(
        surface="tui",
        gateway_url="ws://remote.example.test:18789",
    )

    assert command == [
        "/opt/homebrew/bin/openclaw",
        "tui",
        "--url",
        "ws://remote.example.test:18789",
        "--token",
        "gateway-token",
    ]


def test_build_openclaw_surface_command_omits_local_url_override(monkeypatch) -> None:
    monkeypatch.setattr("cli.openclaw_runtime.find_openclaw_bin", lambda: "/opt/homebrew/bin/openclaw")
    monkeypatch.setattr("cli.openclaw_runtime.detect_gateway_port", lambda: 18789)
    monkeypatch.setattr(
        "cli.openclaw_runtime.resolve_gateway_auth_argument",
        lambda: ("--token", "gateway-token"),
    )

    command = build_openclaw_surface_command(
        surface="tui",
        gateway_url="http://127.0.0.1:18789",
    )

    assert command == [
        "/opt/homebrew/bin/openclaw",
        "tui",
    ]


def test_write_pointer_replaces_stale_directory(monkeypatch, tmp_path: Path) -> None:
    mutx_home = tmp_path / ".mutx"
    target = tmp_path / ".openclaw"
    target.mkdir()
    monkeypatch.setenv("MUTX_HOME", str(mutx_home))

    stale_pointer = provider_pointers_dir("openclaw") / "home"
    stale_pointer.mkdir(parents=True)
    (stale_pointer / "old.txt").write_text("stale", encoding="utf-8")

    write_pointer("openclaw", "home", target)

    assert stale_pointer.exists()
    assert stale_pointer.is_symlink() or stale_pointer.read_text(encoding="utf-8") == str(target)
