import os
import json
from pathlib import Path
from typing import Optional
import httpx


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
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return self._default_config()

    def _default_config(self) -> dict:
        return {
            "api_url": os.getenv("MUTX_API_URL", "http://localhost:8000"),
            "api_key": None,
            "refresh_token": None,
        }

    def save(self):
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w") as f:
            json.dump(self._config, f, indent=2)

    @property
    def api_url(self) -> str:
        return self._config.get("api_url", "http://localhost:8000")

    @api_url.setter
    def api_url(self, value: str):
        self._config["api_url"] = value
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
