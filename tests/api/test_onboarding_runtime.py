import pytest
from httpx import AsyncClient


class TestOnboardingState:
    @pytest.mark.asyncio
    async def test_get_onboarding_requires_authentication(self, client_no_auth: AsyncClient):
        response = await client_no_auth.get("/v1/onboarding")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_onboarding_returns_default_wizard_state(self, client: AsyncClient):
        response = await client.get("/v1/onboarding")

        assert response.status_code == 200
        payload = response.json()
        assert payload["provider"] == "openclaw"
        assert payload["current_step"] == "auth"
        assert payload["steps"][0]["id"] == "auth"
        assert payload["providers"][0]["id"] == "openclaw"

    @pytest.mark.asyncio
    async def test_post_onboarding_requires_authentication(self, client_no_auth: AsyncClient):
        response = await client_no_auth.post(
            "/v1/onboarding",
            json={
                "action": "complete_step",
                "provider": "openclaw",
                "step": "auth",
                "payload": {"status": "in_progress"},
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_post_onboarding_complete_step_persists_state(self, client: AsyncClient):
        response = await client.post(
            "/v1/onboarding",
            json={
                "action": "complete_step",
                "provider": "openclaw",
                "step": "auth",
                "payload": {
                    "status": "in_progress",
                    "assistant_name": "Personal Assistant",
                },
            },
        )

        assert response.status_code == 200
        payload = response.json()
        assert "auth" in payload["completed_steps"]
        assert payload["assistant_name"] == "Personal Assistant"


class TestRuntimeSnapshots:
    @pytest.mark.asyncio
    async def test_runtime_snapshot_defaults_to_last_seen_placeholder(self, client: AsyncClient):
        response = await client.get("/v1/runtime/providers/openclaw")

        assert response.status_code == 200
        payload = response.json()
        assert payload["provider"] == "openclaw"
        assert payload["status"] == "client_required"
        assert payload["stale"] is True

    @pytest.mark.asyncio
    async def test_runtime_snapshot_round_trip(self, client: AsyncClient):
        response = await client.put(
            "/v1/runtime/providers/openclaw",
            json={
                "provider": "openclaw",
                "runtime_key": "openclaw",
                "label": "OpenClaw",
                "status": "healthy",
                "install_method": "npm",
                "gateway": {"status": "healthy"},
                "gateway_url": "http://127.0.0.1:18789",
                "binding_count": 1,
                "bindings": [
                    {
                        "assistant_id": "personal-assistant",
                        "workspace": "/tmp/openclaw/workspace-personal-assistant",
                    }
                ],
                "last_seen_at": "2026-03-21T10:00:00+00:00",
            },
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "healthy"
        assert payload["binding_count"] == 1
        assert payload["last_synced_at"] is not None
