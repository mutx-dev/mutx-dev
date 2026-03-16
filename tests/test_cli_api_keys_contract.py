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


def test_api_keys_list_hits_canonical_route_and_renders_keys(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    key_id = str(uuid.uuid4())

    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(
            200,
            [
                {
                    "id": key_id,
                    "name": "test-key-1",
                    "is_active": True,
                    "expires_at": "2026-04-14T10:00:00",
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "test-key-2",
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
    assert key_id in result.output
    assert "test-key-1" in result.output
    assert "active" in result.output
    assert "test-key-2" in result.output
    assert "revoked" in result.output


def test_api_keys_list_empty(monkeypatch) -> None:
    def fake_get(path: str, params: dict[str, Any] | None = None) -> DummyResponse:
        return DummyResponse(200, [])

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(get=fake_get)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "list"])

    assert result.exit_code == 0
    assert "No API keys found" in result.output


def test_api_keys_create_hits_canonical_route_and_renders_key(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    key_id = str(uuid.uuid4())
    secret = "mutx_sk_test_" + str(uuid.uuid4()).replace("-", "")[:32]

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": key_id,
                "name": "my-new-key",
                "is_active": True,
                "key": secret,
                "created_at": "2026-03-14T10:00:00",
                "expires_at": None,
            },
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "create", "-n", "my-new-key"])

    assert result.exit_code == 0
    assert captured["path"] == "/v1/api-keys"
    assert captured["json"] == {"name": "my-new-key"}
    assert "Created API key: my-new-key" in result.output
    assert f"Key ID:  {key_id}" in result.output
    assert f"Secret:  {secret}" in result.output


def test_api_keys_create_with_expiry(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        captured["json"] = json
        return DummyResponse(
            201,
            {
                "id": str(uuid.uuid4()),
                "name": "temp-key",
                "is_active": True,
                "key": "test-secret",
                "created_at": "2026-03-14T10:00:00",
                "expires_at": "2026-04-14T10:00:00",
            },
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "create", "-n", "temp-key", "-e", "30"])

    assert result.exit_code == 0
    assert captured["json"] == {"name": "temp-key", "expires_in_days": 30}


def test_api_keys_revoke_hits_canonical_route(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    key_id = str(uuid.uuid4())

    def fake_delete(path: str) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(204, None)

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(delete=fake_delete)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "revoke", key_id, "--force"])

    assert result.exit_code == 0
    assert captured["path"] == f"/v1/api-keys/{key_id}"
    assert f"Revoked API key: {key_id}" in result.output


def test_api_keys_revoke_requires_confirmation_without_force(monkeypatch) -> None:
    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "revoke", "key-id"], input="n\n")

    assert result.exit_code == 0
    assert "Are you sure you want to revoke API key" in result.output


def test_api_keys_rotate_hits_canonical_route_and_renders_new_key(monkeypatch) -> None:
    captured: dict[str, Any] = {}
    old_key_id = str(uuid.uuid4())
    new_key_id = str(uuid.uuid4())
    new_secret = "mutx_sk_test_" + str(uuid.uuid4()).replace("-", "")[:32]

    def fake_post(path: str, json: dict[str, Any] | None = None) -> DummyResponse:
        captured["path"] = path
        return DummyResponse(
            200,
            {
                "id": new_key_id,
                "name": "rotated-key",
                "is_active": True,
                "key": new_secret,
                "created_at": "2026-03-14T10:00:00",
                "expires_at": None,
            },
        )

    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)
    monkeypatch.setattr(
        "cli.commands.api_keys.get_client", lambda config: SimpleNamespace(post=fake_post)
    )

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "rotate", old_key_id, "--force"])

    assert result.exit_code == 0
    assert captured["path"] == f"/v1/api-keys/{old_key_id}/rotate"
    assert "Rotated API key: rotated-key" in result.output
    assert f"New Key ID:  {new_key_id}" in result.output
    assert f"New Secret:  {new_secret}" in result.output


def test_api_keys_rotate_requires_confirmation_without_force(monkeypatch) -> None:
    monkeypatch.setattr("cli.commands.api_keys.CLIConfig", DummyConfig)

    runner = CliRunner()
    result = runner.invoke(cli, ["api-keys", "rotate", "key-id"], input="n\n")

    assert result.exit_code == 0
    assert "Rotating will revoke the old key immediately" in result.output
