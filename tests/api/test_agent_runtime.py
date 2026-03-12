import pytest
from httpx import AsyncClient


class TestRegisterAgent:
    @pytest.mark.asyncio
    async def test_register_agent_persists_metadata_as_json_config(self, client: AsyncClient):
        register_response = await client.post(
            "/agents/register",
            json={
                "name": "runtime-agent",
                "description": "registered from runtime",
                "metadata": {
                    "model": "gpt-4o-mini",
                    "temperature": 0.25,
                    "labels": ["runtime", "test"],
                },
            },
        )

        assert register_response.status_code == 200
        payload = register_response.json()
        assert payload["status"] == "registered"

        agent_id = payload["agent_id"]

        agent_response = await client.get(f"/agents/{agent_id}")
        assert agent_response.status_code == 200

        agent = agent_response.json()
        assert agent["name"] == "runtime-agent"
        assert agent["config"] == {
            "model": "gpt-4o-mini",
            "temperature": 0.25,
            "labels": ["runtime", "test"],
        }
        assert "raw_config" not in agent["config"]
