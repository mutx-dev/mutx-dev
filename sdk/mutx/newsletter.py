"""Newsletter API SDK - /newsletter endpoints."""

from __future__ import annotations

from typing import Any

import httpx


class Newsletter:
    """SDK resource for /newsletter endpoints."""

    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    def _require_sync_client(self) -> None:
        if isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError(
                "This resource requires a sync httpx.Client. For async clients, use the `a*` methods."
            )

    def _require_async_client(self) -> None:
        if not isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError(
                "This async resource helper requires an async httpx.AsyncClient and an `a*` method call."
            )

    def get_count(self) -> int:
        """Get the total waitlist signup count."""
        self._require_sync_client()
        response = self._client.get("/newsletter")
        response.raise_for_status()
        return response.json()["count"]

    async def acount(self) -> int:
        """Get the total waitlist signup count (async)."""
        self._require_async_client()
        response = await self._client.get("/newsletter")
        response.raise_for_status()
        return response.json()["count"]

    def signup(
        self,
        email: str,
        source: str = "coming-soon",
    ) -> dict[str, Any]:
        """Submit a waitlist signup.

        Args:
            email: Email address to subscribe
            source: Signup source (e.g. "coming-soon", "website")

        Returns:
            Dict with 'message' and 'duplicate' fields
        """
        self._require_sync_client()
        response = self._client.post(
            "/newsletter",
            json={"email": email, "source": source},
        )
        response.raise_for_status()
        return response.json()

    async def asignup(
        self,
        email: str,
        source: str = "coming-soon",
    ) -> dict[str, Any]:
        """Submit a waitlist signup (async)."""
        self._require_async_client()
        response = await self._client.post(
            "/newsletter",
            json={"email": email, "source": source},
        )
        response.raise_for_status()
        return response.json()
