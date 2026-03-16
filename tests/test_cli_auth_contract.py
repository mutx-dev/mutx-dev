from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from click.testing import CliRunner

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.main import cli


class DummyConfig:
    api_url: str = "http://localhost:8000"
    api_key: str | None = None
    refresh_token: str | None = None

    def is_authenticated(self) -> bool:
        return True

    def clear_auth(self) -> None:
        self.api_key = None
        self.refresh_token = None


class DummyResponse:
    def __init__(self, status_code: int, payload: Any):
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self) -> Any:
        return self._payload


def test_login_hits_canonical_route_and_stores_tokens(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    stored: dict[str, Any] = {}

    config_instance = DummyConfig()

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            200,
            {
                "access_token": "tok_access_abc",
                "refresh_token": "tok_refresh_xyz",
            },
        )

    class PatchedConfig(DummyConfig):
        def __init__(self) -> None:
            pass

        @property
        def api_key(self):
            return stored.get("api_key")

        @api_key.setter
        def api_key(self, value):
            stored["api_key"] = value

        @property
        def refresh_token(self):
            return stored.get("refresh_token")

        @refresh_token.setter
        def refresh_token(self, value):
            stored["refresh_token"] = value

    monkeypatch.setattr("cli.main.CLIConfig", PatchedConfig)
    monkeypatch.setattr(
        "cli.main.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["login", "--email", "user@example.com", "--password", "s3cret"],
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/auth/login",
        "json": {"email": "user@example.com", "password": "s3cret"},
    }
    assert stored["api_key"] == "tok_access_abc"
    assert stored["refresh_token"] == "tok_refresh_xyz"
    assert "Logged in successfully!" in result.output


def test_login_reports_error_on_invalid_credentials(monkeypatch) -> None:
    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        return DummyResponse(401, {"detail": "Invalid credentials"})

    class PatchedConfig(DummyConfig):
        def __init__(self) -> None:
            pass

    monkeypatch.setattr("cli.main.CLIConfig", PatchedConfig)
    monkeypatch.setattr(
        "cli.main.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        ["login", "--email", "bad@example.com", "--password", "wrong"],
    )

    assert "Error: Invalid email or password" in result.output


def test_logout_clears_local_tokens(monkeypatch) -> None:
    cleared = {"called": False}

    class AuthedConfig(DummyConfig):
        def __init__(self) -> None:
            pass

        def clear_auth(self) -> None:
            cleared["called"] = True

    monkeypatch.setattr("cli.main.CLIConfig", AuthedConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["logout"])

    assert result.exit_code == 0
    assert cleared["called"] is True
    assert "Logged out successfully." in result.output
    assert "Local access and refresh tokens cleared." in result.output


def test_logout_when_not_authenticated_shows_informational_message(monkeypatch) -> None:
    class UnauthConfig(DummyConfig):
        def __init__(self) -> None:
            pass

        def is_authenticated(self) -> bool:
            return False

    monkeypatch.setattr("cli.main.CLIConfig", UnauthConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["logout"])

    assert result.exit_code == 0
    assert "No local access token is stored." in result.output


def test_whoami_hits_canonical_route_and_renders_user_fields(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(
            200,
            {
                "email": "user@example.com",
                "name": "Alice Smith",
                "plan": "pro",
            },
        )

    monkeypatch.setattr("cli.main.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.main.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["whoami"])

    assert result.exit_code == 0
    assert captured["path"] == "/v1/auth/me"
    assert "Email: user@example.com" in result.output
    assert "Name: Alice Smith" in result.output
    assert "Plan: pro" in result.output


def test_status_shows_api_url_and_logged_in_state(monkeypatch) -> None:
    class ConfigWithUrl(DummyConfig):
        api_url = "https://api.mutx.dev"

        def __init__(self) -> None:
            pass

    monkeypatch.setattr("cli.main.CLIConfig", ConfigWithUrl)

    runner = CliRunner()
    result = runner.invoke(cli, ["status"])

    assert result.exit_code == 0
    assert "API URL: https://api.mutx.dev" in result.output
    assert "Status: Logged in" in result.output


def test_status_shows_not_logged_in_when_unauthenticated(monkeypatch) -> None:
    class UnauthConfigWithUrl(DummyConfig):
        api_url = "http://localhost:8000"

        def __init__(self) -> None:
            pass

        def is_authenticated(self) -> bool:
            return False

    monkeypatch.setattr("cli.main.CLIConfig", UnauthConfigWithUrl)

    runner = CliRunner()
    result = runner.invoke(cli, ["status"])

    assert result.exit_code == 0
    assert "Status: Not logged in" in result.output
