from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

from click.testing import CliRunner

from cli.config import CLIConfig
from cli.main import cli
from cli.runtime_registry import save_manifest


def test_runtime_list_and_inspect(monkeypatch, tmp_path: Path) -> None:
    mutx_home = tmp_path / ".mutx"
    config = CLIConfig(config_path=tmp_path / "config.json")
    monkeypatch.setenv("MUTX_HOME", str(mutx_home))
    save_manifest(
        "openclaw",
        {
            "provider": "openclaw",
            "label": "OpenClaw",
            "status": "healthy",
            "binding_count": 1,
            "last_seen_at": "2026-03-21T10:00:00+00:00",
        },
    )

    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr(
        "cli.commands.runtime.load_manifest",
        lambda provider: {
            "provider": provider,
            "label": "OpenClaw",
            "status": "healthy",
            "binding_count": 1,
            "last_seen_at": "2026-03-21T10:00:00+00:00",
            "config_path": "/tmp/.openclaw/openclaw.json",
            "adopted_existing_runtime": True,
        },
    )
    monkeypatch.setattr(
        "cli.commands.runtime._service",
        lambda: SimpleNamespace(
            get_provider=lambda provider: SimpleNamespace(
                payload={
                    "provider": provider,
                    "label": "OpenClaw",
                    "status": "healthy",
                    "binding_count": 1,
                    "last_seen_at": "2026-03-21T10:01:00+00:00",
                }
            )
        ),
    )

    runner = CliRunner()
    list_result = runner.invoke(cli, ["runtime", "list"])
    inspect_result = runner.invoke(cli, ["runtime", "inspect", "openclaw", "--output", "json"])

    assert list_result.exit_code == 0
    assert "openclaw | healthy | bindings=1" in list_result.output
    assert inspect_result.exit_code == 0
    payload = json.loads(inspect_result.output)
    assert payload["local"]["provider"] == "openclaw"
    assert payload["remote"]["last_seen_at"] == "2026-03-21T10:01:00+00:00"


def test_runtime_resync(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr(
        "cli.commands.runtime.load_manifest",
        lambda provider: {"install_method": "npm"},
    )
    monkeypatch.setattr(
        "cli.commands.runtime._service",
        lambda: SimpleNamespace(),
    )
    monkeypatch.setattr(
        "cli.commands.runtime.prepare_runtime_state_sync",
        lambda *_args, **_kwargs: {
            "status": "healthy",
            "last_seen_at": "2026-03-21T10:00:00+00:00",
            "last_synced_at": "2026-03-21T10:00:30+00:00",
        },
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["runtime", "resync", "openclaw"])

    assert result.exit_code == 0
    assert "Synced openclaw: healthy" in result.output


def test_runtime_open_tui(monkeypatch, tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    captured: dict[str, object] = {}
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr(
        "cli.commands.runtime.load_manifest",
        lambda provider: {
            "provider": provider,
            "gateway_url": "http://127.0.0.1:18789",
            "install_method": "npm",
        },
    )
    monkeypatch.setattr(
        "cli.commands.runtime.open_openclaw_surface",
        lambda **kwargs: captured.__setitem__("open_kwargs", kwargs),
    )
    monkeypatch.setattr(
        "cli.commands.runtime._service",
        lambda: SimpleNamespace(),
    )
    monkeypatch.setattr(
        "cli.commands.runtime.prepare_runtime_state_sync",
        lambda *_args, **kwargs: captured.__setitem__("sync_kwargs", kwargs) or {
            "status": "healthy",
            "last_seen_at": "2026-03-21T10:00:00+00:00",
        },
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["runtime", "open", "openclaw", "--surface", "tui"])

    assert result.exit_code == 0
    assert captured["open_kwargs"]["surface"] == "tui"
    assert captured["open_kwargs"]["gateway_url"] == "http://127.0.0.1:18789"
    assert captured["sync_kwargs"]["action_type"] == "tui"
    assert "Returned from OpenClaw TUI" in result.output
