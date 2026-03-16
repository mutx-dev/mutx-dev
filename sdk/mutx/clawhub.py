from __future__ import annotations

from typing import Any
from uuid import UUID

import httpx


class Skill:
    def __init__(self, data: dict[str, Any]):
        self.id = data["id"]
        self.name = data["name"]
        self.description = data["description"]
        self.author = data["author"]
        self.stars = data["stars"]
        self.category = data["category"]
        self.is_official = data.get("is_official", False)
        self._data = data

    def __repr__(self) -> str:
        return f"Skill(id={self.id}, name={self.name}, author={self.author})"


class ClawHub:
    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    def list_skills(self) -> list[Skill]:
        """Returns the current trending skills from ClawHub."""
        if isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError("Use alist_skills() for async clients")
        response = self._client.get(/clawhub/skills")
        response.raise_for_status()
        return [Skill(data) for data in response.json()]

    async def alist_skills(self) -> list[Skill]:
        """Returns the current trending skills from ClawHub (Async)."""
        if not isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError("Use list_skills() for sync clients")
        response = await self._client.get(/clawhub/skills")
        response.raise_for_status()
        return [Skill(data) for data in response.json()]

    def install_skill(self, agent_id: UUID | str, skill_id: str) -> dict[str, Any]:
        """Installs a skill to an agent's configuration."""
        if isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError("Use ainstall_skill() for async clients")
        response = self._client.post(
            /clawhub/install",
            json={"agent_id": str(agent_id), "skill_id": skill_id},
        )
        response.raise_for_status()
        return response.json()

    async def ainstall_skill(self, agent_id: UUID | str, skill_id: str) -> dict[str, Any]:
        """Installs a skill to an agent's configuration (Async)."""
        if not isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError("Use install_skill() for sync clients")
        response = await self._client.post(
            /clawhub/install",
            json={"agent_id": str(agent_id), "skill_id": skill_id},
        )
        response.raise_for_status()
        return response.json()

    def uninstall_skill(self, agent_id: UUID | str, skill_id: str) -> dict[str, Any]:
        """Removes a skill from an agent's configuration."""
        if isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError("Use auninstall_skill() for async clients")
        response = self._client.post(
            /clawhub/uninstall",
            json={"agent_id": str(agent_id), "skill_id": skill_id},
        )
        response.raise_for_status()
        return response.json()

    async def auninstall_skill(self, agent_id: UUID | str, skill_id: str) -> dict[str, Any]:
        """Removes a skill from an agent's configuration (Async)."""
        if not isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError("Use uninstall_skill() for sync clients")
        response = await self._client.post(
            /clawhub/uninstall",
            json={"agent_id": str(agent_id), "skill_id": skill_id},
        )
        response.raise_for_status()
        return response.json()
