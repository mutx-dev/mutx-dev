from __future__ import annotations

import json
from datetime import datetime
from typing import Any, AsyncGenerator, Callable, Generator, Optional
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


class DeploymentEvent:
    def __init__(self, data: dict[str, Any]) -> None:
        self.id = UUID(data["id"])
        self.deployment_id = UUID(data["deployment_id"])
        self.event_type = data["event_type"]
        self.status = data["status"]
        self.node_id = data.get("node_id")
        self.error_message = data.get("error_message")
        self.created_at = datetime.fromisoformat(data["created_at"])
        self._data = data


class Deployment:
    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.agent_id = UUID(data["agent_id"])
        self.status = data["status"]
        self.replicas = data["replicas"]
        self.node_id = data.get("node_id")
        self.started_at = (
            datetime.fromisoformat(data["started_at"]) if data.get("started_at") else None
        )
        self.ended_at = datetime.fromisoformat(data["ended_at"]) if data.get("ended_at") else None
        self.error_message = data.get("error_message")
        self.events = [DeploymentEvent(item) for item in data.get("events", [])]
        self._data = data


class AgentDetail(Agent):
    def __init__(self, data: dict[str, Any]):
        super().__init__(data)
        self.deployments = [Deployment(d) for d in data.get("deployments", [])]


class AgentLog:
    def __init__(self, data: dict[str, Any]):
        self.id = UUID(data["id"])
        self.agent_id = UUID(data["agent_id"])
        self.level = data["level"]
        self.message = data["message"]
        self.timestamp = datetime.fromisoformat(data["timestamp"])
        self.extra_data = data.get("extra_data")
        self.metadata = data.get("metadata", self.extra_data)
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

    @staticmethod
    def _required_sync_client() -> None:
        raise RuntimeError(
            "This resource requires a sync httpx.Client. For async clients, use the `a*` methods"
        )

    @staticmethod
    def _required_async_client() -> None:
        raise RuntimeError(
            "This async resource helper requires an async httpx.AsyncClient and an `a*` method call"
        )

    def _require_sync_client(self) -> None:
        if isinstance(self._client, httpx.AsyncClient):
            self._required_sync_client()

    def _require_async_client(self) -> None:
        if not isinstance(self._client, httpx.AsyncClient):
            self._required_async_client()

    def create(
        self,
        name: str,
        description: Optional[str] = None,
        type: str = "openai",
        config: Optional[dict[str, Any] | str] = None,
    ) -> Agent:
        self._require_sync_client()
        response = self._client.post(
            /agents",
            json={
                "name": name,
                "description": description,
                "type": type,
                "config": config,
            },
        )
        response.raise_for_status()
        return Agent(response.json())

    async def acreate(
        self,
        name: str,
        description: Optional[str] = None,
        type: str = "openai",
        config: Optional[dict[str, Any] | str] = None,
    ) -> Agent:
        self._require_async_client()
        response = await self._client.post(
            /agents",
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
    ) -> list[Agent]:
        self._require_sync_client()
        response = self._client.get(
            /agents",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return [Agent(data) for data in response.json()]

    async def alist(
        self,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Agent]:
        self._require_async_client()
        response = await self._client.get(
            /agents",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return [Agent(data) for data in response.json()]

    def get(self, agent_id: UUID | str) -> AgentDetail:
        self._require_sync_client()
        response = self._client.get(f/agents/{agent_id}")
        response.raise_for_status()
        return AgentDetail(response.json())

    async def aget(self, agent_id: UUID | str) -> AgentDetail:
        self._require_async_client()
        response = await self._client.get(f/agents/{agent_id}")
        response.raise_for_status()
        return AgentDetail(response.json())

    def delete(self, agent_id: UUID | str) -> None:
        self._require_sync_client()
        response = self._client.delete(f/agents/{agent_id}")
        response.raise_for_status()

    async def adelete(self, agent_id: UUID | str) -> None:
        self._require_async_client()
        response = await self._client.delete(f/agents/{agent_id}")
        response.raise_for_status()

    def deploy(self, agent_id: UUID | str) -> dict[str, Any]:
        self._require_sync_client()
        response = self._client.post(f/agents/{agent_id}/deploy")
        response.raise_for_status()
        return response.json()

    async def adeploy(self, agent_id: UUID | str) -> dict[str, Any]:
        self._require_async_client()
        response = await self._client.post(f/agents/{agent_id}/deploy")
        response.raise_for_status()
        return response.json()

    def stop(self, agent_id: UUID | str) -> dict[str, Any]:
        self._require_sync_client()
        response = self._client.post(f/agents/{agent_id}/stop")
        response.raise_for_status()
        return response.json()

    async def astop(self, agent_id: UUID | str) -> dict[str, Any]:
        self._require_async_client()
        response = await self._client.post(f/agents/{agent_id}/stop")
        response.raise_for_status()
        return response.json()

    def logs(
        self,
        agent_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
        level: Optional[str] = None,
    ) -> list[AgentLog]:
        self._require_sync_client()
        response = self._client.get(
            f/agents/{agent_id}/logs",
            params={"skip": skip, "limit": limit, "level": level},
        )
        response.raise_for_status()
        return [AgentLog(data) for data in response.json()]

    async def alogs(
        self,
        agent_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
        level: Optional[str] = None,
    ) -> list[AgentLog]:
        self._require_async_client()
        response = await self._client.get(
            f/agents/{agent_id}/logs",
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
        self._require_sync_client()
        response = self._client.get(
            f/agents/{agent_id}/metrics",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return [AgentMetric(data) for data in response.json()]

    async def ametrics(
        self,
        agent_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AgentMetric]:
        self._require_async_client()
        response = await self._client.get(
            f/agents/{agent_id}/metrics",
            params={"skip": skip, "limit": limit},
        )
        response.raise_for_status()
        return [AgentMetric(data) for data in response.json()]

    def update_config(
        self,
        agent_id: UUID | str,
        config: dict[str, Any] | str,
    ) -> AgentDetail:
        """Update agent configuration.

        Args:
            agent_id: The agent UUID
            config: New configuration as dict or JSON string
        """
        self._require_sync_client()
        payload = {"config": config if isinstance(config, str) else json.dumps(config)}
        response = self._client.patch(
            f/agents/{agent_id}/config",
            json=payload,
        )
        response.raise_for_status()
        return AgentDetail(response.json())

    async def aupdate_config(
        self,
        agent_id: UUID | str,
        config: dict[str, Any] | str,
    ) -> AgentDetail:
        """Update agent configuration (async).

        Args:
            agent_id: The agent UUID
            config: New configuration as dict or JSON string
        """
        self._require_async_client()
        payload = {"config": config if isinstance(config, str) else json.dumps(config)}
        response = await self._client.patch(
            f/agents/{agent_id}/config",
            json=payload,
        )
        response.raise_for_status()
        return AgentDetail(response.json())

    def stream_logs(
        self,
        agent_id: UUID | str,
        callback: Callable[[AgentLog], None],
        level: Optional[str] = None,
    ) -> Generator[AgentLog, None, None]:
        self._require_sync_client()
        logs = self.logs(agent_id=agent_id, limit=500, level=level)
        for log in logs:
            callback(log)
            yield log

    async def astream_logs(
        self,
        agent_id: UUID | str,
        callback: Callable[[AgentLog], None],
        level: Optional[str] = None,
    ) -> AsyncGenerator[AgentLog, None]:
        self._require_async_client()
        logs = await self.alogs(agent_id=agent_id, limit=500, level=level)
        for log in logs:
            callback(log)
            yield log
