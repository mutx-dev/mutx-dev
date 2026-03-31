"""Scheduler API SDK - /scheduler endpoints.

Note: Scheduler feature is planned for v1.3 and returns 503.
"""

from __future__ import annotations

from typing import Any

import httpx


class SchedulerTask:
    """Represents a scheduled task."""

    def __init__(self, data: dict[str, Any]):
        self.id: str = data["id"]
        self.name: str = data["name"]
        self.enabled: bool = data["enabled"]
        self.schedule: str = data.get("schedule")
        self.last_run: int = data.get("last_run")
        self.next_run: int = data.get("next_run")
        self._data = data

    def __repr__(self) -> str:
        return f"SchedulerTask(id={self.id}, name={self.name}, enabled={self.enabled})"


class Scheduler:
    """SDK resource for /scheduler endpoints.

    Note: Scheduler is planned for v1.3. These methods currently return 503 errors.
    """

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

    def get_status(self) -> dict[str, Any]:
        """Get scheduler status. Admin role required.

        Raises:
            httpx.HTTPStatusError: 503 if not yet implemented (v1.3)
        """
        self._require_sync_client()
        response = self._client.get("/scheduler")
        response.raise_for_status()
        return response.json()

    async def aget_status(self) -> dict[str, Any]:
        """Get scheduler status (async)."""
        self._require_async_client()
        response = await self._client.get("/scheduler")
        response.raise_for_status()
        return response.json()

    def trigger_task(
        self,
        task_id: str,
    ) -> dict[str, Any]:
        """Manually trigger a scheduled task. Admin role required.

        Args:
            task_id: The ID of the task to trigger

        Raises:
            httpx.HTTPStatusError: 503 if not yet implemented (v1.3)
        """
        self._require_sync_client()
        response = self._client.post("/scheduler", json={"task_id": task_id})
        response.raise_for_status()
        return response.json()

    async def atrigger_task(
        self,
        task_id: str,
    ) -> dict[str, Any]:
        """Manually trigger a scheduled task (async)."""
        self._require_async_client()
        response = await self._client.post("/scheduler", json={"task_id": task_id})
        response.raise_for_status()
        return response.json()
