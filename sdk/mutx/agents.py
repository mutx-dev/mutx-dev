from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Callable, Generator, Optional
from uuid import UUID

import httpx


class Agent:
    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.name = data["name"]
        self.description = data.get("description")
        self.status = data["status"]
        self.config_json = data.get("config")
        self.config = self._parse_config(self.config_json)
        self.created_at = datetime.fromisoformat(data["created_at"])
        self.updated_at = datetime.fromisoformat(data["updated_at"])
        self.user_id = data.get("user_id")
        self._data = data

    @staticmethod
    def _parse_config(raw_config: Any) -> Any:
        if not isinstance(raw_config, str):
            return raw_config

        try:
            return json.loads(raw_config)
        except json.JSONDecodeError:
            return raw_config

    def __repr__(self) -> str:
        return f"Agent(id={self.id}, name={self.name}, status={self.status})"


class AgentDetail(Agent):
    def __init__(self, data: dict[str, Any]):
        super().__init__(data)
        self.deployments = [Deployment(d) for d in data.get("deployments", [])]


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


class AgentLog:
    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.agent_id = UUID(data["agent_id"])
        self.level = data["level"]
        self.message = data["message"]
        self.timestamp = datetime.fromisoformat(data["timestamp"])
        self.metadata = data.get("metadata")
        self._data = data


class AgentMetric:
    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.agent_id = UUID(data["agent_id"])
        self.cpu_usage = data.get("cpu_usage")
        self.memory_usage = data.get("memory_usage")
        self.timestamp = datetime.fromisoformat(data["timestamp"])
        self._data = data


class Agents:
    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    def create(
        self,
        name: str,
        description: Optional[str] = None,
        type: str = "openai",
        config: Optional[dict[str, Any] | str] = None,
    ) -> Agent:
        response = self._client.post(
            "/agents",
            json={
                "name": name,
                "description": description,
                "type": type,
                "config": config,
            },
        )
        response.raise_for_status()
        return Agent(response.json())

    def list(
        self,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[str] = None,
    ) -> list[Agent]:
        response = self._client.get(
            "/agents",
            params={"skip": skip, "limit": limit, "user_id": user_id},
        )
        response.raise_for_status()
        return [Agent(data) for data in response.json()]

    def get(self, agent_id: UUID | str) -> AgentDetail:
        response = self._client.get(f"/agents/{agent_id}")
        response.raise_for_status()
        return AgentDetail(response.json())

    def delete(self, agent_id: UUID | str) -> None:
        response = self._client.delete(f"/agents/{agent_id}")
        response.raise_for_status()

    def deploy(self, agent_id: UUID | str) -> dict[str, Any]:
        response = self._client.post(f"/agents/{agent_id}/deploy")
        response.raise_for_status()
        return response.json()

    def stop(self, agent_id: UUID | str) -> dict[str, Any]:
        response = self._client.post(f"/agents/{agent_id}/stop")
        response.raise_for_status()
        return response.json()

    def logs(
        self,
        agent_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
        level: Optional[str] = None,
    ) -> list[AgentLog]:
        response = self._client.get(
            f"/agents/{agent_id}/logs",
            params={"skip": skip, "limit": limit, "level": level},
        )
        response.raise_for_status()
        return [AgentLog(data) for data in response.json()]

    def metrics(
        self,
        agent_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AgentMetric]:
        response = self._client.get(
            f"/agents/{agent_id}/metrics",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return [AgentMetric(data) for data in response.json()]

    def stream_logs(
        self,
        agent_id: UUID | str,
        callback: Callable[[AgentLog], None],
        level: Optional[str] = None,
    ) -> Generator[AgentLog, None, None]:
        logs = self.logs(agent_id=agent_id, limit=500, level=level)
        for log in logs:
            callback(log)
            yield log
