import json
import os
from pathlib import Path
from typing import Optional
from urllib.parse import urlsplit, urlunsplit

import httpx


_LEGACY_API_SUFFIXES = ("/api/v1", "/v1", "/api")


def _strip_legacy_suffix(path: str) -> str:
    normalized_path = path.rstrip("/")

    for suffix in _LEGACY_API_SUFFIXES:
        if normalized_path == suffix:
            return ""
        if normalized_path.endswith(suffix):
            return normalized_path[: -len(suffix)] or ""

    return normalized_path


def normalize_api_url(value: str) -> str:
    normalized_value = value.strip().rstrip("/")
    if not normalized_value:
        return normalized_value

    # urlsplit mis-parses values like localhost:8000 without a scheme.
    if "://" not in normalized_value:
        return _strip_legacy_suffix(normalized_value)

    parsed = urlsplit(normalized_value)
    normalized_path = _strip_legacy_suffix(parsed.path)
    return urlunsplit(parsed._replace(path=normalized_path))


class CLIConfig:
    def __init__(self, config_path: Optional[Path] = None):
        if config_path is None:
            config_path = Path.home() / ".mutx" / "config.json"
        self.config_path = config_path
        self._config = self._load()

    def _load(self) -> dict:
        if self.config_path.exists():
            try:
                with open(self.config_path) as f:
                    loaded = json.load(f)
                    api_url = loaded.get("api_url")
                    if isinstance(api_url, str):
                        loaded["api_url"] = normalize_api_url(api_url)
                    return loaded
            except (json.JSONDecodeError, IOError):
                pass
        return self._default_config()

    def _default_config(self) -> dict:
        return {
            "api_url": normalize_api_url(os.getenv("MUTX_API_URL", "http://localhost:8000")),
            "api_key": None,
            "refresh_token": None,
        }

    def save(self):
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w") as f:
            json.dump(self._config, f, indent=2)

    @property
    def api_url(self) -> str:
        stored_api_url = self._config.get("api_url", "http://localhost:8000")
        if isinstance(stored_api_url, str):
            return normalize_api_url(stored_api_url)
        return "http://localhost:8000"

    @api_url.setter
    def api_url(self, value: str):
        self._config["api_url"] = normalize_api_url(value)
        self.save()

    @property
    def api_key(self) -> Optional[str]:
        return self._config.get("api_key")

    @api_key.setter
    def api_key(self, value: Optional[str]):
        self._config["api_key"] = value
        self.save()

    @property
    def refresh_token(self) -> Optional[str]:
        return self._config.get("refresh_token")

    @refresh_token.setter
    def refresh_token(self, value: Optional[str]):
        self._config["refresh_token"] = value
        self.save()

    def clear_auth(self):
        self._config["api_key"] = None
        self._config["refresh_token"] = None
        self.save()

    def is_authenticated(self) -> bool:
        return bool(self.api_key and self.refresh_token)


def get_client(config: Optional[CLIConfig] = None) -> httpx.Client:
    if config is None:
        config = CLIConfig()

    headers = {}
    if config.api_key:
        headers["Authorization"] = f"Bearer {config.api_key}"

    return httpx.Client(
        base_url=config.api_url,
        headers=headers,
        timeout=30.0,
    )
