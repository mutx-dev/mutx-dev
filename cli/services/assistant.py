from __future__ import annotations

from typing import Any

from cli.services.base import APIService
from cli.services.models import (
    AssistantChannelRecord,
    AssistantHealthRecord,
    AssistantOverviewRecord,
    AssistantSkillRecord,
    TemplateRecord,
)


class TemplatesService(APIService):
    def list_templates(self) -> list[TemplateRecord]:
        response = self._request("get", "/v1/templates")
        self._expect_status(response, {200})
        return [TemplateRecord.from_payload(item) for item in response.json()]

    def deploy_template(
        self,
        template_id: str,
        *,
        name: str,
        description: str | None = None,
        replicas: int = 1,
        model: str | None = None,
        workspace: str | None = None,
        skills: list[str] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "name": name,
            "replicas": replicas,
            "skills": skills or [],
        }
        if description:
            payload["description"] = description
        if model:
            payload["model"] = model
        if workspace:
            payload["workspace"] = workspace

        response = self._request("post", f"/v1/templates/{template_id}/deploy", json=payload)
        self._expect_status(response, {201}, invalid_message="Unable to deploy starter template")
        return response.json()


class AssistantService(APIService):
    def overview(self, *, agent_id: str | None = None) -> AssistantOverviewRecord | None:
        params = {"agent_id": agent_id} if agent_id else None
        response = self._request("get", "/v1/assistant/overview", params=params)
        self._expect_status(response, {200})
        payload = response.json()
        assistant = payload.get("assistant")
        if not assistant:
            return None
        return AssistantOverviewRecord.from_payload(assistant)

    def list_skills(self, agent_id: str) -> list[AssistantSkillRecord]:
        response = self._request("get", f"/v1/assistant/{agent_id}/skills")
        self._expect_status(response, {200}, not_found_message="Assistant not found")
        return [AssistantSkillRecord.from_payload(item) for item in response.json()]

    def install_skill(self, agent_id: str, skill_id: str) -> list[AssistantSkillRecord]:
        response = self._request("post", f"/v1/assistant/{agent_id}/skills/{skill_id}")
        self._expect_status(response, {200}, not_found_message="Assistant not found")
        return [AssistantSkillRecord.from_payload(item) for item in response.json()]

    def uninstall_skill(self, agent_id: str, skill_id: str) -> list[AssistantSkillRecord]:
        response = self._request("delete", f"/v1/assistant/{agent_id}/skills/{skill_id}")
        self._expect_status(response, {200}, not_found_message="Assistant not found")
        return [AssistantSkillRecord.from_payload(item) for item in response.json()]

    def list_channels(self, agent_id: str) -> list[AssistantChannelRecord]:
        response = self._request("get", f"/v1/assistant/{agent_id}/channels")
        self._expect_status(response, {200}, not_found_message="Assistant not found")
        return [AssistantChannelRecord.from_payload(item) for item in response.json()]

    def health(self, agent_id: str) -> AssistantHealthRecord:
        response = self._request("get", f"/v1/assistant/{agent_id}/health")
        self._expect_status(response, {200}, not_found_message="Assistant not found")
        return AssistantHealthRecord.from_payload(response.json())

    def list_sessions(self, *, agent_id: str | None = None) -> list[dict[str, Any]]:
        params = {"agent_id": agent_id} if agent_id else None
        response = self._request("get", "/v1/sessions", params=params)
        self._expect_status(response, {200})
        payload = response.json()
        return payload.get("sessions", [])
