import pytest
from httpx import AsyncClient


class TestAssistantTemplates:
    @pytest.mark.asyncio
    async def test_list_templates_returns_personal_assistant(self, client: AsyncClient):
        response = await client.get("/v1/templates")

        assert response.status_code == 200
        payload = response.json()
        assert payload[0]["id"] == "personal_assistant"
        assert payload[0]["agent_type"] == "openclaw"

    @pytest.mark.asyncio
    async def test_template_deploy_creates_agent_and_deployment(self, client: AsyncClient):
        response = await client.post(
            "/v1/templates/personal_assistant/deploy",
            json={
                "name": "Personal Assistant",
                "assistant_id": "personal-assistant",
                "workspace": "/tmp/openclaw/workspace-personal-assistant",
                "runtime_metadata": {
                    "managed_by_mutx": True,
                    "install_method": "npm",
                },
                "skills": ["web_search", "workspace_memory"],
                "channels": {
                    "webchat": {
                        "label": "WebChat",
                        "enabled": True,
                        "mode": "pairing",
                        "allow_from": [],
                    }
                },
            },
        )

        assert response.status_code == 201
        payload = response.json()
        assert payload["template_id"] == "personal_assistant"
        assert payload["agent"]["type"] == "openclaw"
        assert payload["agent"]["config"]["assistant_id"] == "personal-assistant"
        assert (
            payload["agent"]["config"]["workspace"] == "/tmp/openclaw/workspace-personal-assistant"
        )
        assert payload["agent"]["config"]["metadata"]["runtime"]["managed_by_mutx"] is True
        assert payload["deployment"]["status"] == "pending"


class TestAssistantOverview:
    @pytest.mark.asyncio
    async def test_overview_returns_empty_state_without_assistant(self, client: AsyncClient):
        response = await client.get("/v1/assistant/overview")

        assert response.status_code == 200
        payload = response.json()
        assert payload["has_assistant"] is False
        assert payload["assistant"] is None

    @pytest.mark.asyncio
    async def test_overview_returns_created_assistant(self, client: AsyncClient):
        create_response = await client.post(
            "/v1/templates/personal_assistant/deploy",
            json={"name": "Ops Assistant"},
        )
        agent_id = create_response.json()["agent"]["id"]

        response = await client.get(f"/v1/assistant/overview?agent_id={agent_id}")

        assert response.status_code == 200
        payload = response.json()
        assert payload["has_assistant"] is True
        assert payload["assistant"]["name"] == "Ops Assistant"
        assert payload["assistant"]["template_id"] == "personal_assistant"
        assert payload["assistant"]["gateway"]["status"] == "client_required"
        assert "operator host" in payload["assistant"]["gateway"]["doctor_summary"]

    @pytest.mark.asyncio
    async def test_assistant_skill_install_round_trip(self, client: AsyncClient):
        create_response = await client.post(
            "/v1/templates/personal_assistant/deploy",
            json={"name": "Ops Assistant"},
        )
        agent_id = create_response.json()["agent"]["id"]

        install_response = await client.post(f"/v1/assistant/{agent_id}/skills/browser_control")
        assert install_response.status_code == 200
        assert any(
            item["id"] == "browser_control" and item["installed"]
            for item in install_response.json()
        )

        uninstall_response = await client.delete(f"/v1/assistant/{agent_id}/skills/browser_control")
        assert uninstall_response.status_code == 200
        assert any(
            item["id"] == "browser_control" and not item["installed"]
            for item in uninstall_response.json()
        )
