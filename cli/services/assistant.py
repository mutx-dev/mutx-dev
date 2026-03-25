from __future__ import annotations

from typing import Any

from cli.personal_assistant import DEFAULT_TEMPLATE_ID, build_personal_assistant_config
from cli.openclaw_runtime import get_gateway_health, list_local_sessions
from cli.services.base import APIService
from cli.services.models import (
    AssistantChannelRecord,
    AssistantHealthRecord,
    AssistantOverviewRecord,
    AssistantSkillRecord,
    TemplateRecord,
)
from cli.services.runtime import RuntimeStateService
from cli.setup_wizard import prepare_runtime_state_sync


class TemplatesService(APIService):
    def _fallback_personal_assistant_deploy(
        self,
        *,
        template_id: str,
        name: str,
        description: str | None,
        replicas: int,
        model: str | None,
        assistant_id: str | None,
        workspace: str | None,
        skills: list[str] | None,
        runtime_metadata: dict[str, Any] | None,
    ) -> dict[str, Any]:
        config = build_personal_assistant_config(
            name=name,
            description=description,
            model=model,
            workspace=workspace,
            assistant_id=assistant_id,
            skills=skills,
            runtime_metadata=runtime_metadata,
        )
        agent_response = self._request(
            "post",
            "/v1/agents",
            json={
                "name": name,
                "description": description or "",
                "type": "openclaw",
                "config": config,
            },
        )
        self._expect_status(agent_response, {201}, invalid_message="Unable to create starter agent")
        agent_payload = agent_response.json()
        deployment_response = self._request(
            "post",
            "/v1/deployments",
            json={
                "agent_id": agent_payload["id"],
                "replicas": replicas,
            },
        )
        self._expect_status(
            deployment_response,
            {200, 201},
            invalid_message="Unable to deploy starter template",
        )
        return {
            "template_id": template_id,
            "agent": agent_payload,
            "deployment": deployment_response.json(),
            "delivery": "client_fallback",
        }

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
        assistant_id: str | None = None,
        workspace: str | None = None,
        skills: list[str] | None = None,
        runtime_metadata: dict[str, Any] | None = None,
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
        if assistant_id:
            payload["assistant_id"] = assistant_id
        if workspace:
            payload["workspace"] = workspace
        if runtime_metadata:
            payload["runtime_metadata"] = runtime_metadata

        response = self._request("post", f"/v1/templates/{template_id}/deploy", json=payload)
        if response.status_code in {404, 500, 502, 503, 504} and template_id == DEFAULT_TEMPLATE_ID:
            return self._fallback_personal_assistant_deploy(
                template_id=template_id,
                name=name,
                description=description,
                replicas=replicas,
                model=model,
                assistant_id=assistant_id,
                workspace=workspace,
                skills=skills,
                runtime_metadata=runtime_metadata,
            )
        self._expect_status(response, {201}, invalid_message="Unable to deploy starter template")
        return response.json()


class AssistantService(APIService):
    def _sync_local_runtime_snapshot(self, assistant_payload: dict[str, Any] | None = None) -> None:
        install_method = None
        assistant_name = None
        if isinstance(assistant_payload, dict):
            assistant_name = str(assistant_payload.get("name") or "") or None
            config = assistant_payload.get("config")
            if isinstance(config, dict):
                runtime_metadata = (config.get("metadata") or {}).get("runtime") or {}
                if isinstance(runtime_metadata, dict):
                    raw_method = runtime_metadata.get("install_method")
                    if isinstance(raw_method, str) and raw_method.strip():
                        install_method = raw_method.strip()
        service = RuntimeStateService(config=self.config, client_factory=self._client_factory)
        prepare_runtime_state_sync(
            service,
            assistant_name=assistant_name,
            install_method=install_method or "npm",
        )

    @staticmethod
    def _overlay_local_runtime(payload: dict[str, Any]) -> dict[str, Any]:
        assistant = payload.get("assistant")
        if not isinstance(assistant, dict):
            return payload

        config = assistant.get("config")
        config_dict = config if isinstance(config, dict) else {}
        assistant_id = str(assistant.get("assistant_id") or config_dict.get("assistant_id") or "")
        local_health = get_gateway_health().to_payload()
        assistant["gateway"] = local_health

        if assistant_id:
            sessions = list_local_sessions(assistant_id=assistant_id)
            assistant["session_count"] = len(sessions)

        return payload

    def overview(self, *, agent_id: str | None = None) -> AssistantOverviewRecord | None:
        params = {"agent_id": agent_id} if agent_id else None
        response = self._request("get", "/v1/assistant/overview", params=params)
        self._expect_status(response, {200})
        payload = self._overlay_local_runtime(response.json())
        assistant = payload.get("assistant")
        if not assistant:
            self._sync_local_runtime_snapshot()
            return None
        self._sync_local_runtime_snapshot(assistant)
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
        overview = self.overview(agent_id=agent_id)
        if overview is None:
            response = self._request("get", f"/v1/assistant/{agent_id}/health")
            self._expect_status(response, {200}, not_found_message="Assistant not found")
            return AssistantHealthRecord.from_payload(response.json())
        return overview.gateway

    def list_sessions(self, *, agent_id: str | None = None) -> list[dict[str, Any]]:
        overview = self.overview(agent_id=agent_id)
        if overview is not None:
            return list_local_sessions(assistant_id=overview.assistant_id)

        params = {"agent_id": agent_id} if agent_id else None
        response = self._request("get", "/v1/sessions", params=params)
        self._expect_status(response, {200})
        payload = response.json()
        return payload.get("sessions", [])
