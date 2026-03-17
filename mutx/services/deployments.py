"""Deployments service - API client for deployment management.

Reusable by both CLI and TUI.
"""

from typing import Optional, List, Dict, Any
import httpx

from mutx.services.base import BaseService, CLIConfig


class DeploymentsService(BaseService):
    """Service for managing MUTX deployments.
    
    Provides a clean API for deployment operations that can be used
    by both the click CLI and future TUI.
    """
    
    def __init__(
        self,
        config: Optional[CLIConfig] = None,
        client: Optional[httpx.Client] = None,
    ):
        super().__init__(config, client)
        self.base_path = "/v1/deployments"
    
    def list(
        self,
        limit: int = 50,
        skip: int = 0,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List all deployments, optionally filtered."""
        self._check_auth()
        params = {"limit": limit, "skip": skip}
        if agent_id:
            params["agent_id"] = agent_id
        if status:
            params["status"] = status
        response = self._get_client().get(self.base_path, params=params)
        return self._check_response(response)
    
    def get(self, deployment_id: str) -> Dict[str, Any]:
        """Get a single deployment by ID."""
        self._check_auth()
        response = self._get_client().get(f"{self.base_path}/{deployment_id}")
        return self._check_response(response)
    
    def create(
        self,
        agent_id: str,
        replicas: int = 1,
    ) -> Dict[str, Any]:
        """Create a new deployment."""
        self._check_auth()
        response = self._get_client().post(
            self.base_path,
            json={"agent_id": agent_id, "replicas": replicas},
        )
        return self._check_response(response)
    
    def delete(self, deployment_id: str) -> bool:
        """Delete a deployment. Returns True on success."""
        self._check_auth()
        response = self._get_client().delete(f"{self.base_path}/{deployment_id}")
        self._check_response(response)
        return response.status_code == 204
    
    def scale(self, deployment_id: str, replicas: int) -> Dict[str, Any]:
        """Scale a deployment to the specified number of replicas."""
        self._check_auth()
        response = self._get_client().post(
            f"{self.base_path}/{deployment_id}/scale",
            json={"replicas": replicas},
        )
        return self._check_response(response)
    
    def restart(self, deployment_id: str) -> Dict[str, Any]:
        """Restart a deployment."""
        self._check_auth()
        response = self._get_client().post(f"{self.base_path}/{deployment_id}/restart")
        return self._check_response(response)
    
    def get_logs(
        self,
        deployment_id: str,
        limit: int = 100,
        skip: int = 0,
        level: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get logs for a deployment."""
        self._check_auth()
        params = {"limit": limit, "skip": skip}
        if level:
            params["level"] = level
        response = self._get_client().get(
            f"{self.base_path}/{deployment_id}/logs",
            params=params,
        )
        return self._check_response(response)
    
    def get_events(
        self,
        deployment_id: str,
        limit: int = 100,
        skip: int = 0,
        event_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get event history for a deployment."""
        self._check_auth()
        params = {"limit": limit, "skip": skip}
        if event_type:
            params["event_type"] = event_type
        if status:
            params["status"] = status
        response = self._get_client().get(
            f"{self.base_path}/{deployment_id}/events",
            params=params,
        )
        return self._check_response(response)
    
    def get_metrics(
        self,
        deployment_id: str,
        limit: int = 100,
        skip: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get metrics for a deployment."""
        self._check_auth()
        response = self._get_client().get(
            f"{self.base_path}/{deployment_id}/metrics",
            params={"limit": limit, "skip": skip},
        )
        return self._check_response(response)
