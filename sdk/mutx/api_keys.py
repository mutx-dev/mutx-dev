from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import httpx


class APIKey:
    """Represents an API key (without the raw secret)."""

    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.name = data["name"]
        self.is_active = data.get("is_active", True)
        self.last_used = (
            datetime.fromisoformat(data["last_used"]) if data.get("last_used") else None
        )
        self.created_at = datetime.fromisoformat(data["created_at"])
        self.expires_at = (
            datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None
        )
        self._data = data

    def __repr__(self) -> str:
        return f"APIKey(id={self.id}, name={self.name}, active={self.is_active})"


class APIKeyWithSecret(APIKey):
    """Returned on create/rotate — includes the plain key (shown once)."""

    def __init__(self, data: dict[str, Any]):
        super().__init__(data)
        self.key: str = data["key"]

    def __repr__(self) -> str:
        prefix = self.key[:16] + "…" if len(self.key) > 16 else self.key
        return f"APIKeyWithSecret(id={self.id}, name={self.name}, key={prefix})"


class APIKeys:
    """SDK resource for /api-keys endpoints."""

    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    def list(self) -> list[APIKey]:
        """List all API keys for the authenticated user."""
        response = self._client.get("/api-keys")
        response.raise_for_status()
        return [APIKey(data) for data in response.json()]

    def create(
        self,
        name: str,
        expires_in_days: Optional[int] = None,
    ) -> APIKeyWithSecret:
        """Create a new API key.  The plain key is only returned once."""
        payload: dict[str, Any] = {"name": name}
        if expires_in_days is not None:
            payload["expires_in_days"] = expires_in_days

        response = self._client.post("/api-keys", json=payload)
        response.raise_for_status()
        return APIKeyWithSecret(response.json())

    def revoke(self, key_id: UUID | str) -> None:
        """Revoke (delete) an API key."""
        response = self._client.delete(f"/api-keys/{key_id}")
        response.raise_for_status()

    def rotate(self, key_id: UUID | str) -> APIKeyWithSecret:
        """Rotate an API key — revokes the old one and returns a new one."""
        response = self._client.post(f"/api-keys/{key_id}/rotate")
        response.raise_for_status()
        return APIKeyWithSecret(response.json())
