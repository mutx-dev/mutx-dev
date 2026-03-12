from datetime import datetime

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_registered_agent_api_key_authenticates_runtime_status_and_heartbeat(
    client: AsyncClient, db_session, test_user
):
    register_response = await client.post(
        "/agents/register",
        json={
            "name": "runtime-auth-contract",
            "description": "runtime auth contract coverage",
            "metadata": {"demo": True},
            "capabilities": ["heartbeat"],
        },
    )

    assert register_response.status_code == 200
    payload = register_response.json()
    agent_id = payload["agent_id"]
    api_key = payload["api_key"]
    assert api_key.startswith("mutx_agent_")

    runtime_headers = {"Authorization": f"Bearer {api_key}"}

    status_response = await client.get(f"/agents/{agent_id}/status", headers=runtime_headers)
    assert status_response.status_code == 200
    assert status_response.json()["agent_id"] == agent_id
    assert status_response.json()["status"] == "running"

    heartbeat_response = await client.post(
        "/agents/heartbeat",
        headers=runtime_headers,
        json={
            "agent_id": agent_id,
            "status": "running",
            "message": "contract ok",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    assert heartbeat_response.status_code == 200
    assert heartbeat_response.json()["agent_id"] == agent_id


@pytest.mark.asyncio
async def test_agent_status_requires_runtime_auth_not_just_agent_id(client_no_auth: AsyncClient, test_agent):
    unauthenticated_response = await client_no_auth.get(f"/agents/{test_agent.id}/status")

    assert unauthenticated_response.status_code == 401
    assert unauthenticated_response.json()["detail"] == "Missing authorization header"
