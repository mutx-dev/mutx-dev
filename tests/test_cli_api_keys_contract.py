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


def test_api_keys_list_hits_canonical_route_and_renders_keys(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(
            200,
            [
                {
                    "id": "key-123",
                    "name": "my-key",
                    "is_active": True,
                    "expires_at": "2027-01-01T00:00:00",
                },
                {
                    "id": "key-456",
                    "name": "old-key",
                    "is_active": False,
                    "expires_at": None,
                },
            ],
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "list"])

    assert result.exit_code == 0
    assert captured["path"] == "/v1/api-keys"
    assert "key-123 | my-key | active | expires: 2027-01-01T00:00:00" in result.output
    assert "key-456 | old-key | revoked | expires: never" in result.output


def test_api_keys_list_shows_empty_message_when_no_keys(monkeypatch) -> None:
    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        return DummyResponse(200, [])

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "list"])

    assert result.exit_code == 0
    assert "No API keys found." in result.output


def test_api_keys_create_hits_canonical_route_and_renders_secret(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": "key-new-1",
                "name": "ci-key",
                "key": "sk_live_abc123xyz",
            },
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "create", "--name", "ci-key"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/api-keys", "json": {"name": "ci-key"}}
    assert "Created API key: ci-key" in result.output
    assert "Key ID:  key-new-1" in result.output
    assert "Secret:  sk_live_abc123xyz" in result.output
    assert "Save this secret now" in result.output


def test_api_keys_create_with_expiry_forwards_expires_in_days(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": "key-exp-1",
                "name": "temp-key",
                "key": "sk_live_temp",
            },
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(
        cli, ["api-keys", "create", "--name", "temp-key", "--expires-in-days", "30"]
    )

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/api-keys",
        "json": {"name": "temp-key", "expires_in_days": 30},
    }
    assert "Created API key: temp-key" in result.output


def test_api_keys_revoke_hits_canonical_route(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_delete(path: str) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(204, None)

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(delete=fake_delete)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "revoke", "key-123", "--force"])

    assert result.exit_code == 0
    assert captured == {"path": "/v1/api-keys/key-123"}
    assert "Revoked API key: key-123" in result.output


def test_api_keys_revoke_requires_confirmation_without_force(monkeypatch) -> None:
    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "revoke", "key-123"], input="n\n")

    assert result.exit_code == 0
    assert "Are you sure you want to revoke API key key-123?" in result.output


def test_api_keys_rotate_hits_canonical_route_and_renders_new_secret(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            200,
            {
                "id": "key-rot-2",
                "name": "ci-key",
                "key": "sk_live_rotated_xyz",
            },
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "rotate", "key-old-1", "--force"])

    assert result.exit_code == 0
    assert captured == {
        "path": "/v1/api-keys/key-old-1/rotate",
        "json": None,
    }
    assert "Rotated API key: ci-key" in result.output
    assert "New Key ID:  key-rot-2" in result.output
    assert "New Secret:  sk_live_rotated_xyz" in result.output
    assert "Save this secret now" in result.output


def test_api_keys_rotate_requires_confirmation_without_force(monkeypatch) -> None:
    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "rotate", "key-old-2"], input="n\n")

    assert result.exit_code == 0
    assert "Rotating will revoke the old key immediately" in result.output
