import pytest
from pydantic import ValidationError

from src.api.config import Settings


def test_cors_origins_accepts_comma_separated_env(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://app.example.com, https://admin.example.com",
    )

    settings = Settings(_env_file=None)

    assert settings.cors_origins == [
        "https://app.example.com",
        "https://admin.example.com",
    ]


def test_cors_origins_accepts_json_array_env(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS",
        '["https://app.example.com", "https://admin.example.com"]',
    )

    settings = Settings(_env_file=None)

    assert settings.cors_origins == [
        "https://app.example.com",
        "https://admin.example.com",
    ]


def test_cors_origins_rejects_invalid_json_array_env(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", '["https://app.example.com"')

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
