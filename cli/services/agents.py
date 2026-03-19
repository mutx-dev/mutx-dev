from __future__ import annotations

import json
from typing import Any

from cli.services.base import APIService, ValidationError
from cli.services.models import AgentDeploymentResult, AgentRecord, LogEntry


class AgentsService(APIService):
    def list_agents(self, *, limit: int = 50, skip: int = 0) -> list[AgentRecord]:
        response = self._request("get", "/v1/agents", params={"limit": limit, "skip": skip})
        self._expect_status(response, {200})
        return [AgentRecord.from_payload(item) for item in response.json()]

    def get_agent(self, agent_id: str) -> AgentRecord:
        response = self._request("get", f"/v1/agents/{agent_id}")
        self._expect_status(response, {200}, not_found_message="Agent not found")
        return AgentRecord.from_payload(response.json())

    def create_agent(
        self,
        *,
        name: str,
        description: str = "",
        agent_type: str = "openai",
        config: dict[str, Any] | str | None = None,
    ) -> AgentRecord:
        config_payload = config or {}
        if isinstance(config_payload, str):
            try:
                config_payload = json.loads(config_payload)
            except json.JSONDecodeError as exc:
                raise ValidationError("Invalid JSON in config") from exc

        if not isinstance(config_payload, dict):
            raise ValidationError("Invalid JSON in config")

        response = self._request(
            "post",
            "/v1/agents",
            json={
                "name": name,
                "description": description,
                "type": agent_type,
                "config": config_payload,
            },
        )
        self._expect_status(response, {201}, invalid_message="Invalid agent configuration")
        return AgentRecord.from_payload(response.json())

    def deploy_agent(self, agent_id: str) -> AgentDeploymentResult:
        response = self._request("post", f"/v1/agents/{agent_id}/deploy")
        self._expect_status(response, {200}, not_found_message="Agent not found")
        return AgentDeploymentResult.from_payload(response.json())

    def get_logs(
        self,
        agent_id: str,
        *,
        limit: int = 100,
        level: str | None = None,
    ) -> list[LogEntry]:
        params: dict[str, Any] = {"limit": limit}
        if level:
            params["level"] = level

        response = self._request("get", f"/v1/agents/{agent_id}/logs", params=params)
        self._expect_status(response, {200}, not_found_message="Agent not found")
        return [LogEntry.from_payload(item) for item in response.json()]

    def stop_agent(self, agent_id: str) -> str | None:
        response = self._request("post", f"/v1/agents/{agent_id}/stop")
        self._expect_status(response, {200}, not_found_message="Agent not found")
        payload = response.json()
        return payload.get("status")

    def delete_agent(self, agent_id: str) -> None:
        response = self._request("delete", f"/v1/agents/{agent_id}")
        self._expect_status(response, {204}, not_found_message="Agent not found")
