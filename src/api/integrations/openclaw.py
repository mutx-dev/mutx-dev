import httpx
from typing import Optional, Any
from pydantic import BaseModel
import logging
from datetime import datetime, timezone
from tenacity import retry, stop_after_attempt, wait_exponential
import uuid

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

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
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
        return self._request("GET", "/api/agents", params=params)

    def get_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("GET", f"/api/agents/{agent_id}")
        return AgentStatus(**data)

    def create_agent(self, config: AgentConfig) -> AgentStatus:
        data = self._request("POST", "/api/agents", data=config.model_dump(exclude_none=True))
        return AgentStatus(**data)

    def update_agent(self, agent_id: str, config: AgentConfig) -> AgentStatus:
        data = self._request(
            "PUT",
            f"/api/agents/{agent_id}",
            data=config.model_dump(exclude_none=True),
        )
        return AgentStatus(**data)

    def delete_agent(self, agent_id: str) -> dict[str, str]:
        return self._request("DELETE", f"/api/agents/{agent_id}")

    def start_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("POST", f"/api/agents/{agent_id}/start")
        return AgentStatus(**data)

    def stop_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("POST", f"/api/agents/{agent_id}/stop")
        return AgentStatus(**data)

    def restart_agent(self, agent_id: str) -> AgentStatus:
        data = self._request("POST", f"/api/agents/{agent_id}/restart")
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
        return self._request("GET", f"/api/agents/{agent_id}/logs", params=params)

    def get_agent_stats(self, agent_id: str) -> dict[str, Any]:
        return self._request("GET", f"/api/agents/{agent_id}/stats")

    def exec_command(
        self,
        agent_id: str,
        command: str,
        timeout: Optional[int] = 30,
    ) -> dict[str, Any]:
        data = self._request(
            "POST",
            f"/api/agents/{agent_id}/exec",
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


class OpenClawObservability:
    """Reports OpenClaw agent executions to MUTX Observability API."""

    def __init__(self, mutx_api_url: str, api_key: Optional[str] = None):
        self.mutx_api_url = mutx_api_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.Client(timeout=30.0)

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def report_run_start(
        self,
        agent_id: str,
        agent_name: str,
        model: str = "unknown",
        tools: Optional[list[str]] = None,
        trigger: str = "agent",
    ) -> str:
        """Report the start of an agent run. Returns run_id."""
        run_id = str(uuid.uuid4())
        run_data = {
            "id": run_id,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "model": model,
            "provider": "openclaw",
            "runtime": "mutx@1.0.0",
            "trigger": trigger,
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "tools_available": tools or [],
            "steps": [],
            "cost": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "cost_usd": 0.0,
                "model": model,
            },
            "provenance": {
                "run_hash": str(uuid.uuid4())[:16],
                "lineage": [],
                "runtime": "mutx@1.0.0",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "run_metadata": {"source": "openclaw"},
        }

        try:
            response = self._client.post(
                f"{self.mutx_api_url}/v1/observability/runs",
                json=run_data,
                headers=self._headers(),
            )
            response.raise_for_status()
        except Exception as e:
            logger.warning(f"Failed to report run start to MUTX: {e}")

        return run_id

    def report_step(
        self,
        run_id: str,
        step_type: str,
        tool_name: Optional[str] = None,
        input_preview: str = "",
        output_preview: str = "",
        success: bool = True,
        duration_ms: int = 0,
    ) -> None:
        """Report a step in an agent run."""
        step_data = {
            "id": str(uuid.uuid4()),
            "type": step_type,
            "tool_name": tool_name,
            "input_preview": input_preview[:500] if input_preview else "",
            "output_preview": output_preview[:500] if output_preview else "",
            "success": success,
            "duration_ms": duration_ms,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "step_metadata": {},
        }

        try:
            response = self._client.post(
                f"{self.mutx_api_url}/v1/observability/runs/{run_id}/steps",
                json=step_data,
                headers=self._headers(),
            )
            response.raise_for_status()
        except Exception as e:
            logger.warning(f"Failed to report step to MUTX: {e}")

    def report_run_end(
        self,
        run_id: str,
        status: str,
        outcome: Optional[str] = None,
        error: Optional[str] = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost_usd: float = 0.0,
    ) -> None:
        """Report the end of an agent run."""
        status_data = {
            "status": status,
            "outcome": outcome,
            "error": error,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
        }

        try:
            response = self._client.patch(
                f"{self.mutx_api_url}/v1/observability/runs/{run_id}/status",
                json=status_data,
                headers=self._headers(),
            )
            response.raise_for_status()
        except Exception as e:
            logger.warning(f"Failed to report run end to MUTX: {e}")

    def close(self) -> None:
        self._client.close()


def get_observability_client(
    mutx_api_url: str, api_key: Optional[str] = None
) -> OpenClawObservability:
    """Get an observability client for reporting OpenClaw agent runs to MUTX."""
    return OpenClawObservability(mutx_api_url, api_key)
