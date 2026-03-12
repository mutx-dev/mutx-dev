import pytest
from httpx import AsyncClient
from sqlalchemy import select

from src.api.models.models import AgentStatus, Deployment, DeploymentEvent


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
async def test_ingest_deployment(
    client: AsyncClient,
    test_user,
    test_deployment,
    db_session,
):
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

    await db_session.refresh(test_deployment)
    assert test_deployment.status == "running"
    assert test_deployment.node_id == "test-node"

    event = (
        await db_session.execute(
            select(DeploymentEvent).where(DeploymentEvent.deployment_id == test_deployment.id)
        )
    ).scalar_one()
    assert event.event_type == "healthy"
    assert event.status == "running"


@pytest.mark.asyncio
async def test_ingest_deployment_failure_marks_agent_and_deployment_failed(
    client: AsyncClient,
    test_deployment,
    test_agent,
    db_session,
):
    response = await client.post(
        "/ingest/deployment",
        json={
            "deployment_id": str(test_deployment.id),
            "event": "deploy.failed",
            "status": "active",
            "error_message": "container crashed"
        }
    )
    assert response.status_code == 200

    await db_session.refresh(test_deployment)
    await db_session.refresh(test_agent)

    assert test_deployment.status == "failed"
    assert test_deployment.error_message == "container crashed"
    assert test_deployment.ended_at is not None
    assert test_agent.status == AgentStatus.FAILED.value

    event = (
        await db_session.execute(
            select(DeploymentEvent)
            .where(DeploymentEvent.deployment_id == test_deployment.id)
            .order_by(DeploymentEvent.created_at.desc())
        )
    ).scalars().first()
    assert event is not None
    assert event.event_type == "deploy.failed"
    assert event.status == "failed"


@pytest.mark.asyncio
async def test_ingest_deployment_recovery_clears_terminal_state(
    client: AsyncClient,
    test_deployment,
    test_agent,
    db_session,
):
    test_deployment.status = "failed"
    test_deployment.error_message = "old failure"
    test_deployment.ended_at = test_deployment.created_at
    test_agent.status = AgentStatus.FAILED.value
    await db_session.commit()

    response = await client.post(
        "/ingest/deployment",
        json={
            "deployment_id": str(test_deployment.id),
            "event": "deploy.active",
            "status": "active",
            "node_id": "node-recovered"
        }
    )
    assert response.status_code == 200

    await db_session.refresh(test_deployment)
    await db_session.refresh(test_agent)

    assert test_deployment.status == "running"
    assert test_deployment.error_message is None
    assert test_deployment.ended_at is None
    assert test_deployment.node_id == "node-recovered"
    assert test_agent.status == AgentStatus.RUNNING.value

    event = (
        await db_session.execute(
            select(DeploymentEvent)
            .where(DeploymentEvent.deployment_id == test_deployment.id)
            .order_by(DeploymentEvent.created_at.desc())
        )
    ).scalars().first()
    assert event is not None
    assert event.event_type == "deploy.active"
    assert event.status == "active"


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
