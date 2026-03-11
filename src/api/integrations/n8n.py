import httpx
from typing import Optional, Any, List
from pydantic import BaseModel
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class N8nConfig(BaseModel):
    base_url: str = "http://localhost:5678"
    api_key: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3


class WorkflowBase(BaseModel):
    name: str
    nodes: List[dict[str, Any]]
    connections: dict[str, Any]
    settings: Optional[dict[str, Any]] = None
    active: bool = False


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    nodes: Optional[List[dict[str, Any]]] = None
    connections: Optional[dict[str, Any]] = None
    settings: Optional[dict[str, Any]] = None
    active: Optional[bool] = None


class Workflow(BaseModel):
    id: str
    name: str
    active: bool
    nodes: List[dict[str, Any]]
    connections: dict[str, Any]
    settings: dict[str, Any]
    createdAt: str
    updatedAt: str


class Execution(BaseModel):
    id: str
    workflowId: str
    mode: str
    status: str
    startedAt: str
    finishedAt: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class WebhookResponse(BaseModel):
    workflow_id: str
    webhook_url: str
    execution_id: Optional[str] = None
    response: Optional[dict[str, Any]] = None


class N8nClient:
    def __init__(self, config: Optional[N8nConfig] = None):
        self.config = config or N8nConfig()
        self._client = httpx.Client(
            base_url=self.config.base_url,
            timeout=self.config.timeout,
            headers=self._build_headers(),
        )

    def _build_headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["X-N8N-API-KEY"] = self.config.api_key
        return headers

    def _build_url(self, endpoint: str) -> str:
        return f"{self.config.base_url}{endpoint}"

    def _authenticate(self) -> None:
        if self.config.username and self.config.password:
            response = self._client.post(
                "/rest/login",
                json={
                    "email": self.config.username,
                    "password": self.config.password,
                },
            )
            if response.status_code == 200:
                data = response.json()
                self._client.headers["Authorization"] = f"Bearer {data.get('token')}"

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
            if response.content:
                return response.json()
            return {}
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error: {str(e)}")
            raise

    def health_check(self) -> dict[str, Any]:
        return self._request("GET", "/rest/health")

    def get_version(self) -> dict[str, Any]:
        return self._request("GET", "/rest/version")

    def list_workflows(
        self,
        active: Optional[bool] = None,
    ) -> List[Workflow]:
        params = {}
        if active is not None:
            params["active"] = "true" if active else "false"
        data = self._request("GET", "/rest/workflows", params=params)
        return [Workflow(**w) for w in data.get("data", [])]

    def get_workflow(self, workflow_id: str) -> Workflow:
        data = self._request("GET", f"/rest/workflows/{workflow_id}")
        return Workflow(**data)

    def create_workflow(self, workflow: WorkflowCreate) -> Workflow:
        data = self._request(
            "POST",
            "/rest/workflows",
            data=workflow.model_dump(exclude_none=True),
        )
        return Workflow(**data)

    def update_workflow(
        self,
        workflow_id: str,
        workflow: WorkflowUpdate,
    ) -> Workflow:
        data = self._request(
            "PUT",
            f"/rest/workflows/{workflow_id}",
            data=workflow.model_dump(exclude_none=True, exclude_unset=True),
        )
        return Workflow(**data)

    def delete_workflow(self, workflow_id: str) -> dict[str, str]:
        return self._request("DELETE", f"/rest/workflows/{workflow_id}")

    def activate_workflow(self, workflow_id: str) -> Workflow:
        data = self._request(
            "POST",
            f"/rest/workflows/{workflow_id}/activate",
        )
        return Workflow(**data)

    def deactivate_workflow(self, workflow_id: str) -> Workflow:
        data = self._request(
            "POST",
            f"/rest/workflows/{workflow_id}/deactivate",
        )
        return Workflow(**data)

    def export_workflow(self, workflow_id: str) -> dict[str, Any]:
        return self._request("GET", f"/rest/workflows/{workflow_id}/export")

    def import_workflow(self, workflow: dict[str, Any]) -> Workflow:
        data = self._request("POST", "/rest/workflows/import", data=workflow)
        return Workflow(**data)

    def import_workflows_bulk(self, workflows: List[dict[str, Any]]) -> List[Workflow]:
        data = self._request("POST", "/rest/workflows/import/bulk", data={"workflows": workflows})
        return [Workflow(**w) for w in data.get("workflows", [])]

    def trigger_workflow(
        self,
        workflow_id: str,
        data: Optional[dict[str, Any]] = None,
        wait_for_response: bool = True,
        timeout: int = 30,
    ) -> WebhookResponse:
        webhook = self._request("GET", f"/rest/webhook/{workflow_id}")
        webhook_url = webhook.get("webhookUrl")

        response_data = None
        execution_id = None

        if data:
            trigger_response = self._client.post(
                webhook_url,
                json=data,
                timeout=timeout,
            )
            trigger_response.raise_for_status()

            if wait_for_response:
                execution = self._request(
                    "GET",
                    f"/rest/webhook-test/{workflow_id}",
                )
                response_data = execution.get("data")
                execution_id = execution.get("executionId")

        return WebhookResponse(
            workflow_id=workflow_id,
            webhook_url=webhook_url,
            execution_id=execution_id,
            response=response_data,
        )

    def trigger_webhook(
        self,
        webhook_path: str,
        data: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        url = f"{self.config.base_url}/webhook/{webhook_path.lstrip('/')}"
        response = self._client.post(url, json=data)
        response.raise_for_status()
        if response.content:
            return response.json()
        return {}

    def trigger_webhook_test(
        self,
        webhook_path: str,
        data: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        url = f"{self.config.base_url}/webhook-test/{webhook_path.lstrip('/')}"
        response = self._client.post(url, json=data)
        response.raise_for_status()
        if response.content:
            return response.json()
        return {}

    def list_executions(
        self,
        workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20,
    ) -> List[Execution]:
        params = {"limit": limit}
        if workflow_id:
            params["workflowId"] = workflow_id
        if status:
            params["status"] = status

        data = self._request("GET", "/rest/executions", params=params)
        return [Execution(**e) for e in data.get("data", [])]

    def get_execution(self, execution_id: str) -> Execution:
        data = self._request("GET", f"/rest/executions/{execution_id}")
        return Execution(**data)

    def delete_execution(self, execution_id: str) -> dict[str, str]:
        return self._request("DELETE", f"/rest/executions/{execution_id}")

    def retry_execution(self, execution_id: str) -> Execution:
        data = self._request("POST", f"/rest/executions/{execution_id}/retry")
        return Execution(**data)

    def stop_execution(self, execution_id: str) -> Execution:
        data = self._request("POST", f"/rest/executions/{execution_id}/stop")
        return Execution(**data)

    def get_executions_stats(self, workflow_id: Optional[str] = None) -> dict[str, Any]:
        params = {}
        if workflow_id:
            params["workflowId"] = workflow_id
        return self._request("GET", "/rest/executions/stats", params=params)

    def list_credentials(self) -> List[dict[str, Any]]:
        data = self._request("GET", "/rest/credentials")
        return data.get("data", [])

    def get_credential(self, credential_id: str) -> dict[str, Any]:
        return self._request("GET", f"/rest/credentials/{credential_id}")

    def create_credential(
        self,
        name: str,
        type: str,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        return self._request(
            "POST",
            "/rest/credentials",
            data={"name": name, "type": type, "data": data},
        )

    def update_credential(
        self,
        credential_id: str,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        return self._request(
            "PUT",
            f"/rest/credentials/{credential_id}",
            data={"data": data},
        )

    def delete_credential(self, credential_id: str) -> dict[str, str]:
        return self._request("DELETE", f"/rest/credentials/{credential_id}")

    def test_credentials(self, credential_id: str) -> dict[str, Any]:
        return self._request("POST", f"/rest/credentials/{credential_id}/test")

    def list_tags(self) -> List[dict[str, Any]]:
        data = self._request("GET", "/rest/tags")
        return data.get("data", [])

    def create_tag(self, name: str) -> dict[str, Any]:
        return self._request("POST", "/rest/tags", data={"name": name})

    def delete_tag(self, tag_id: str) -> dict[str, str]:
        return self._request("DELETE", f"/rest/tags/{tag_id}")

    def get_tags_for_workflow(self, workflow_id: str) -> List[dict[str, Any]]:
        return self._request("GET", f"/rest/workflows/{workflow_id}/tags")

    def update_workflow_tags(
        self,
        workflow_id: str,
        tag_ids: List[str],
    ) -> dict[str, Any]:
        return self._request(
            "PUT",
            f"/rest/workflows/{workflow_id}/tags",
            data={"tags": [{"id": tag_id} for tag_id in tag_ids]},
        )

    def get_license_info(self) -> dict[str, Any]:
        return self._request("GET", "/rest/license")

    def get_settings(self) -> dict[str, Any]:
        return self._request("GET", "/rest/settings")

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def get_client(config: Optional[N8nConfig] = None) -> N8nClient:
    return N8nClient(config)
