import httpx
from typing import Optional, Any
from pydantic import BaseModel
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class OpenClawConfig(BaseModel):
    base_url: str = "http://localhost:8080"
    api_key: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3


class AgentConfig(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    environment: Optional[dict[str, str]] = None
    resources: Optional[dict[str, Any]] = None


class AgentStatus(BaseModel):
    id: str
    name: str
    status: str
    created_at: str
    updated_at: str
    container_id: Optional[str] = None
    ip_address: Optional[str] = None


class OpenClawClient:
    def __init__(self, config: Optional[OpenClawConfig] = None):
        self.config = config or OpenClawConfig()
        self._client = httpx.Client(
            base_url=self.config.base_url,
            timeout=self.config.timeout,
            headers=self._build_headers(),
        )

    def _build_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        return headers

    def _build_url(self, endpoint: str) -> str:
        return f"{self.config.base_url}{endpoint}"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict[str, Any]:
        url = self._build_url(endpoint)
        try:
            response = self._client.request(
                method=method,
                url=url,
                json=data,
                params=params,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error: {str(e)}")
            raise

    def health_check(self) -> dict[str, Any]:
        return self._request("GET", "/health")

    def list_agents(self, status: Optional[str] = None) -> list[dict[str, Any]]:
        params = {"status": status} if status else None
        return self._request("GET", "/api/v1/agents", params=params)

    def get_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("GET", f"/api/v1/agents/{agent_id}")
        return AgentStatus(**data)

    def create_agent(self, config: AgentConfig) -> AgentStatus:
        data = self._request("POST", "/api/v1/agents", data=config.model_dump(exclude_none=True))
        return AgentStatus(**data)

    def update_agent(self, agent_id: str, config: AgentConfig) -> AgentStatus:
        data = self._request(
            "PUT",
            f"/api/v1/agents/{agent_id}",
            data=config.model_dump(exclude_none=True),
        )
        return AgentStatus(**data)

    def delete_agent(self, agent_id: str) -> dict[str, str]:
        return self._request("DELETE", f"/api/v1/agents/{agent_id}")

    def start_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("POST", f"/api/v1/agents/{agent_id}/start")
        return AgentStatus(**data)

    def stop_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("POST", f"/api/v1/agents/{agent_id}/stop")
        return AgentStatus(**data)

    def restart_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("POST", f"/api/v1/agents/{agent_id}/restart")
        return AgentStatus(**data)

    def get_agent_logs(
        self,
        agent_id: str,
        tail: Optional[int] = 100,
        since: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        params = {"tail": tail}
        if since:
            params["since"] = since
        return self._request("GET", f"/api/v1/agents/{agent_id}/logs", params=params)

    def get_agent_stats(self, agent_id: str) -> dict[str, Any]:
        return self._request("GET", f"/api/v1/agents/{agent_id}/stats")

    def exec_command(
        self,
        agent_id: str,
        command: str,
        timeout: Optional[int] = 30,
    ) -> dict[str, Any]:
        data = self._request(
            "POST",
            f"/api/v1/agents/{agent_id}/exec",
            data={"command": command, "timeout": timeout},
        )
        return data

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def get_client(config: Optional[OpenClawConfig] = None) -> OpenClawClient:
    return OpenClawClient(config)
