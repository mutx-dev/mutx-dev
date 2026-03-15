from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.config import CLIConfig, get_client, normalize_api_url


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("https://app.mutx.dev/v1", "https://app.mutx.dev"),
        ("https://app.mutx.dev/api", "https://app.mutx.dev"),
        ("https://app.mutx.dev/api/v1", "https://app.mutx.dev"),
        ("https://gateway.test/control/api/v1", "https://gateway.test/control"),
        ("http://localhost:8000/v1/", "http://localhost:8000"),
        ("localhost:8000/api/v1", "localhost:8000"),
    ],
)
def test_normalize_api_url_strips_legacy_suffixes(raw: str, expected: str) -> None:
    assert normalize_api_url(raw) == expected


def test_cli_config_load_normalizes_stale_saved_api_url(tmp_path: Path) -> None:
    config_path = tmp_path / "config.json"
    config_path.write_text(
        json.dumps(
            {
                "api_url": "https://app.mutx.dev/api/v1",
                "api_key": None,
                "refresh_token": None,
            }
        )
    )

    config = CLIConfig(config_path=config_path)

    assert config.api_url == "https://app.mutx.dev"


def test_cli_config_setter_persists_normalized_api_url(tmp_path: Path) -> None:
    config_path = tmp_path / "config.json"
    config = CLIConfig(config_path=config_path)

    config.api_url = "https://app.mutx.dev/api/v1/"

    persisted = json.loads(config_path.read_text())
    assert persisted["api_url"] == "https://app.mutx.dev"


def test_cli_default_config_normalizes_mutx_api_url_env(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MUTX_API_URL", "https://app.mutx.dev/api/v1")

    config = CLIConfig(config_path=tmp_path / "config.json")

    assert config.api_url == "https://app.mutx.dev"


def test_get_client_uses_normalized_base_url(tmp_path: Path) -> None:
    config = CLIConfig(config_path=tmp_path / "config.json")
    config.api_url = "https://app.mutx.dev/api/v1"

    client = get_client(config)
    try:
        assert str(client.base_url).rstrip("/") == "https://app.mutx.dev"
    finally:
        client.close()
