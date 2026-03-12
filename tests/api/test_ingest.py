import pytest
from httpx import AsyncClient
from src.api.models.models import AgentStatus

@pytest.mark.asyncio
async def test_ingest_agent_status(client: AsyncClient, test_user, test_agent):
    response = await client.post(
        "/ingest/agent-status",
        json={
            "agent_id": str(test_agent.id),
            "status": "running",
            "node_id": "test-node"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "updated"

@pytest.mark.asyncio
async def test_ingest_metrics(client: AsyncClient, test_user, test_agent):
    response = await client.post(
        "/ingest/metrics",
        json={
            "agent_id": str(test_agent.id),
            "cpu_usage": 50.0,
            "memory_usage": 1024.0
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"

@pytest.mark.asyncio
async def test_ingest_deployment(client: AsyncClient, test_user, test_deployment):
    response = await client.post(
        "/ingest/deployment",
        json={
            "deployment_id": str(test_deployment.id),
            "event": "healthy",
            "status": "running",
            "node_id": "test-node"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "processed"

@pytest.mark.asyncio
async def test_ingest_unauthorized_agent(client: AsyncClient, test_user):
    # Mocking another user's agent
    other_agent_id = "00000000-0000-0000-0000-000000000000"
    
    response = await client.post(
        "/ingest/agent-status",
        json={
            "agent_id": other_agent_id,
            "status": "running"
        }
    )
    # Since agent_id doesn't exist in DB, it should be 404
    assert response.status_code == 404
