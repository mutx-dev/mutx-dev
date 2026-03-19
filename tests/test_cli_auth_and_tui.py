from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest
from click.testing import CliRunner

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.main import cli


class DummyResponse:
    def __init__(self, status_code: int, payload: Any):
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self) -> Any:
        return self._payload


class LoginConfig:
    def __init__(self) -> None:
        self.api_url = "http://localhost:8000"
        self.api_key = None
        self.refresh_token = None
        self.config_path = Path("/tmp/mutx-config.json")

    def is_authenticated(self) -> bool:
        return bool(self.api_key and self.refresh_token)

    def clear_auth(self) -> None:
        self.api_key = None
        self.refresh_token = None


def test_login_hits_v1_auth_route_and_saves_tokens(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            200,
            {
                "access_token": "access-token",
                "refresh_token": "refresh-token",
            },
        )

    config = LoginConfig()
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr("cli.main.get_client", lambda _: SimpleNamespace(post=fake_post))

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "login",
            "--email",
            "operator@example.com",
            "--password",
            "StrongPass1!",
        ],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/auth/login",
        "json": {
            "email": "operator@example.com",
            "password": "StrongPass1!",
        },
    }
    assert config.api_key == "access-token"
    assert config.refresh_token == "refresh-token"
    assert "Logged in successfully!" in result.output


def test_tui_command_dispatches_to_launcher(monkeypatch) -> None:
    launched = {"value": False}

    def fake_launch() -> None:
        launched["value"] = True

    monkeypatch.setattr("cli.commands.tui.launch_tui", fake_launch)

    runner = CliRunner()
    result = runner.invoke(cli, ["tui"])

    assert result.exit_code == 0
    assert launched["value"] is True


def test_tui_renders_logged_out_state() -> None:
    textual = pytest.importorskip("textual")
    assert textual is not None

    from cli.tui.app import MutxTUI

    async def run() -> tuple[str, str]:
        app = MutxTUI()
        async with app.run_test() as pilot:
            await pilot.pause()
            banner = app.query_one("#status-banner").renderable
            detail = app.query_one("#agent-detail-body").renderable
            return str(banner), str(detail)

    import asyncio

    banner, detail = asyncio.run(run())
    assert "Auth: local only" in banner
    assert "No stored CLI auth." in detail
