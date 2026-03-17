"""Base service class with shared API client and auth handling."""

import os
import json
from pathlib import Path
from typing import Optional, Any, TYPE_CHECKING
import httpx

if TYPE_CHECKING:
    from mutx.services.agents import AgentsService
    from mutx.services.deployments import DeploymentsService


class MutxClient:
    """Reusable HTTP client for MUTX API.
    
    Used by both CLI commands and TUI. Shares auth/config from ~/.mutx/config.json
    """
    
    def __init__(self, config: Optional["CLIConfig"] = None):
        if config is None:
            config = CLIConfig()
        self._config = config
        self._client: Optional[httpx.Client] = None
    
    @property
    def client(self) -> httpx.Client:
        """Lazy initialization of HTTP client."""
        if self._client is None:
            headers = {}
            if self._config.api_key:
                headers["Authorization"] = f"Bearer {self._config.api_key}"
            
            self._client = httpx.Client(
                base_url=self._config.api_url,
                headers=headers,
                timeout=30.0,
            )
        return self._client
    
    def close(self):
        """Close the HTTP client."""
        if self._client:
            self._client.close()
            self._client = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()


class BaseService:
    """Base class for MUTX services.
    
    Provides common authentication and API client handling
    for both CLI and TUI to share.
    """
    
    def __init__(
        self,
        config: Optional["CLIConfig"] = None,
        client: Optional[httpx.Client] = None,
    ):
        self._config = config
        self._provided_client = client
        self._client: Optional[MutxClient] = None
    
    @property
    def config(self) -> "CLIConfig":
        if self._config is None:
            from mutx.services.base import CLIConfig
            self._config = CLIConfig()
        return self._config
    
    @property
    def is_authenticated(self) -> bool:
        """Check if the service has valid credentials."""
        return self.config.is_authenticated()
    
    def _get_client(self) -> httpx.Client:
        """Get the HTTP client, using provided client or creating one."""
        if self._provided_client is not None:
            return self._provided_client
        if self._client is None:
            self._client = MutxClient(self.config)
        return self._client.client
    
    def _check_auth(self):
        """Raise an error if not authenticated."""
        if not self.is_authenticated:
            raise ValueError("Not authenticated. Run 'mutx login' first.")
    
    def _check_response(self, response: httpx.Response) -> dict:
        """Validate response and handle common errors.
        
        Returns JSON response on success.
        Raises ValueError on auth failure or other errors.
        """
        if response.status_code == 401:
            raise ValueError("Authentication expired. Run 'mutx login' again.")
        if response.status_code == 404:
            raise ValueError("Resource not found")
        if response.status_code not in (200, 201, 204):
            raise ValueError(f"API error: {response.text}")
        if response.status_code == 204:
            return {}
        return response.json()
    
    def close(self):
        """Close the underlying HTTP client."""
        if self._client:
            self._client.close()


class CLIConfig:
    """Configuration manager for MUTX CLI.
    
    Reads from ~/.mutx/config.json. Used by both CLI and TUI
    to share authentication state.
    """
    
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
        if value.endswith("/v1"):
            value = value[:-3]
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
    """Get a configured httpx.Client for MUTX API.
    
    Backwards compatibility function for existing CLI code.
    """
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
