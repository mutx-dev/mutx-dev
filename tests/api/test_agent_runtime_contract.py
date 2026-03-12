from datetime import datetime
from pathlib import Path

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


@pytest.mark.asyncio
async def test_connected_agent_runtime_sdk_uses_status_auth_contract(client: AsyncClient):
    import importlib.util

    module_path = Path(__file__).resolve().parents[2] / "sdk" / "mutx" / "agent_runtime.py"
    spec = importlib.util.spec_from_file_location("mutx_agent_runtime_module", module_path)
    agent_runtime_module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(agent_runtime_module)
    MutxAgentClient = agent_runtime_module.MutxAgentClient

    register_response = await client.post(
        "/agents/register",
        json={
            "name": "sdk-connect-contract",
            "description": "sdk connect contract coverage",
            "metadata": {"demo": True},
            "capabilities": ["heartbeat"],
        },
    )

    assert register_response.status_code == 200
    payload = register_response.json()

    sdk_client = MutxAgentClient(mutx_url="http://testserver")

    transport = client._transport
    sdk_client._client = __import__('httpx').AsyncClient(
        transport=transport,
        base_url="http://testserver",
        timeout=sdk_client.timeout,
        headers={"Content-Type": "application/json"},
    )

    connected = await sdk_client.connect(payload["agent_id"], payload["api_key"])

    assert connected is True
    assert sdk_client.is_registered is True

    heartbeat_response = await sdk_client.heartbeat(status="running", message="sdk connect ok")
    assert heartbeat_response["agent_id"] == payload["agent_id"]

    await sdk_client.close()
