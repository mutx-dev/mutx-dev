"""Agents service - API client for agent management.

Reusable by both CLI and TUI.
"""

from typing import Optional, List, Dict, Any
import httpx

from mutx.services.base import BaseService, CLIConfig


class AgentsService(BaseService):
    """Service for managing MUTX agents.

    Provides a clean API for agent CRUD operations that can be used
    by both the click CLI and future TUI.
    """

    def __init__(
        self,
        config: Optional[CLIConfig] = None,
        client: Optional[httpx.Client] = None,
    ):
        super().__init__(config, client)
        self.base_path = "/v1/agents"

    def list(
        self,
        limit: int = 50,
        skip: int = 0,
    ) -> List[Dict[str, Any]]:
        """List all agents."""
        self._check_auth()
        response = self._get_client().get(
            self.base_path,
            params={"limit": limit, "skip": skip},
        )
        return self._check_response(response)

    def get(self, agent_id: str) -> Dict[str, Any]:
        """Get a single agent by ID."""
        self._check_auth()
        response = self._get_client().get(f"{self.base_path}/{agent_id}")
        return self._check_response(response)

    def create(
        self,
        name: str,
        description: str = "",
        agent_type: str = "openai",
        config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new agent."""
        self._check_auth()
        response = self._get_client().post(
            self.base_path,
            json={
                "name": name,
                "description": description,
                "type": agent_type,
                "config": config or {},
            },
        )
        return self._check_response(response)

    def delete(self, agent_id: str) -> bool:
        """Delete an agent. Returns True on success."""
        self._check_auth()
        response = self._get_client().delete(f"{self.base_path}/{agent_id}")
        self._check_response(response)
        return response.status_code == 204

    def deploy(self, agent_id: str) -> Dict[str, Any]:
        """Deploy an agent."""
        self._check_auth()
        response = self._get_client().post(f"{self.base_path}/{agent_id}/deploy")
        return self._check_response(response)

    def stop(self, agent_id: str) -> Dict[str, Any]:
        """Stop a running agent."""
        self._check_auth()
        response = self._get_client().post(f"{self.base_path}/{agent_id}/stop")
        return self._check_response(response)

    def get_logs(
        self,
        agent_id: str,
        limit: int = 100,
        level: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get logs for an agent."""
        self._check_auth()
        params = {"limit": limit}
        if level:
            params["level"] = level
        response = self._get_client().get(
            f"{self.base_path}/{agent_id}/logs",
            params=params,
        )
        return self._check_response(response)
