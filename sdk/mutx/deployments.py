from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import httpx


class Deployment:
    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.agent_id = UUID(data["agent_id"])
        self.status = data["status"]
        self.replicas = data["replicas"]
        self.node_id = data.get("node_id")
        self.started_at = datetime.fromisoformat(data["started_at"])
        self.ended_at = datetime.fromisoformat(data["ended_at"]) if data.get("ended_at") else None
        self.error_message = data.get("error_message")
        self._data = data

    def __repr__(self) -> str:
        return f"Deployment(id={self.id}, agent_id={self.agent_id}, status={self.status})"


class Deployments:
    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    def create(self, agent_id: UUID | str, replicas: int = 1) -> Deployment:
        response = self._client.post(
            "/deployments",
            json={"agent_id": str(agent_id), "replicas": replicas},
        )
        response.raise_for_status()
        return Deployment(response.json())

    def list(
        self,
        skip: int = 0,
        limit: int = 50,
        agent_id: Optional[UUID | str] = None,
        status: Optional[str] = None,
    ) -> list[Deployment]:
        params: dict[str, Any] = {"skip": skip, "limit": limit}
        if agent_id:
            params["agent_id"] = str(agent_id)
        if status:
            params["status"] = status

        response = self._client.get("/deployments", params=params)
        response.raise_for_status()
        return [Deployment(data) for data in response.json()]

    def get(self, deployment_id: UUID | str) -> Deployment:
        response = self._client.get(f"/deployments/{deployment_id}")
        response.raise_for_status()
        return Deployment(response.json())

    def scale(self, deployment_id: UUID | str, replicas: int) -> Deployment:
        response = self._client.post(
            f"/deployments/{deployment_id}/scale",
            json={"replicas": replicas},
        )
        response.raise_for_status()
        return Deployment(response.json())

    def restart(self, deployment_id: UUID | str) -> Deployment:
        response = self._client.post(f"/deployments/{deployment_id}/restart")
        response.raise_for_status()
        return Deployment(response.json())

    def delete(self, deployment_id: UUID | str) -> None:
        response = self._client.delete(f"/deployments/{deployment_id}")
        response.raise_for_status()

    def logs(
        self,
        deployment_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = self._client.get(
            f"/deployments/{deployment_id}/logs",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return response.json()

    def metrics(
        self,
        deployment_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = self._client.get(
            f"/deployments/{deployment_id}/metrics",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return response.json()
