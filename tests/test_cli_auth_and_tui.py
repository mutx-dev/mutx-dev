from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from typing import Any

import httpx
import click
import pytest
from click.testing import CliRunner

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
    assert config.api_url == "https://api.mutx.dev"
    assert config.api_key == "access-token"
    assert config.refresh_token == "refresh-token"
    assert "Logged in successfully!" in result.output


def test_login_reports_unreachable_api_without_traceback(monkeypatch) -> None:
    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        raise httpx.ConnectError("Connection refused")

    config = LoginConfig()
    monkeypatch.setattr("cli.main.CLIConfig", lambda: config)
    monkeypatch.setattr(
        "cli.main.get_client",
        lambda _: SimpleNamespace(post=fake_post, close=lambda: None),
    )

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
    assert "https://api.mutx.dev" in result.output
    assert "Traceback" not in result.output


def test_tui_command_dispatches_to_launcher(monkeypatch) -> None:
    launched = {"value": False}

    def fake_launch() -> None:
        launched["value"] = True

    monkeypatch.setattr("cli.commands.tui.launch_tui", fake_launch)

    runner = CliRunner()
    result = runner.invoke(cli, ["tui"])

    assert result.exit_code == 0
    assert launched["value"] is True


def test_tui_renders_logged_out_state(monkeypatch) -> None:
    textual = pytest.importorskip("textual")
    assert textual is not None

    import cli.tui.app as tui_app

    class DummyAuthService:
        def status(self):
            return SimpleNamespace(
                authenticated=False,
                api_url="http://localhost:8000",
                config_path=Path("/tmp/mutx-config.json"),
            )

    monkeypatch.setattr(tui_app, "AuthService", DummyAuthService)

    from cli.tui.app import MUTX_ASCII_LOGO, MutxTUI

    async def run() -> tuple[str, str, str, str]:
        app = MutxTUI()
        async with app.run_test() as pilot:
            await pilot.pause()
            banner_widget = app.query_one("#status-banner")
            detail_widget = app.query_one("#agent-detail-body")
            logo_widget = app.query_one("#brand-art")
            signal_widget = app.query_one("#brand-signal")
            banner = getattr(banner_widget, "renderable", banner_widget.render())
            detail = getattr(detail_widget, "renderable", detail_widget.render())
            logo = getattr(logo_widget, "renderable", logo_widget.render())
            signal = getattr(signal_widget, "renderable", signal_widget.render())
            return str(banner), str(detail), str(logo), str(signal)

    import asyncio

    banner, detail, logo, signal = asyncio.run(run())
    assert "Auth: local only" in banner
    assert "login required" in detail
    assert "mutx setup hosted" in detail
    assert logo == MUTX_ASCII_LOGO
    assert "__  __" in logo
    assert "/_/\\_\\" in logo
    assert len(logo.splitlines()) == 5
    assert "/v1" in signal
    assert "login required" in signal


def test_onboard_hosted_can_register(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    class DummyAuth:
        def __init__(self, *args, **kwargs) -> None:
            return None

        def status(self):
            return SimpleNamespace(authenticated=False)

    @click.command()
    @click.option("--register/--login-existing", default=False)
    def fake_setup_hosted(register: bool) -> None:
        captured["register"] = register

    monkeypatch.setattr("cli.commands.onboard.current_config", lambda: SimpleNamespace())
    monkeypatch.setattr("cli.commands.onboard.AuthService", DummyAuth)
    monkeypatch.setattr("cli.commands.onboard.get_client", lambda *_: None)
    monkeypatch.setattr("cli.commands.onboard._get_setup_hosted_command", lambda: fake_setup_hosted)

    runner = CliRunner()
    result = runner.invoke(cli, ["onboard"], input="1\n1\n")

    assert result.exit_code == 0
    assert captured["register"] is True
    assert "Create a new MUTX account" in result.output


def test_onboard_hosted_can_login_existing(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    class DummyAuth:
        def __init__(self, *args, **kwargs) -> None:
            return None

        def status(self):
            return SimpleNamespace(authenticated=False)

    @click.command()
    @click.option("--register/--login-existing", default=False)
    def fake_setup_hosted(register: bool) -> None:
        captured["register"] = register

    monkeypatch.setattr("cli.commands.onboard.current_config", lambda: SimpleNamespace())
    monkeypatch.setattr("cli.commands.onboard.AuthService", DummyAuth)
    monkeypatch.setattr("cli.commands.onboard.get_client", lambda *_: None)
    monkeypatch.setattr("cli.commands.onboard._get_setup_hosted_command", lambda: fake_setup_hosted)

    runner = CliRunner()
    result = runner.invoke(cli, ["onboard"], input="1\n2\n")

    assert result.exit_code == 0
    assert captured["register"] is False
    assert "sign in to an existing account" in result.output.lower()
