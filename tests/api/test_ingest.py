"""
Tests for /ingest endpoints.
"""
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Agent, AgentStatus, User


class TestIngestEndpoints:
    """Tests for ingestion endpoints."""

    @pytest.mark.asyncio
    async def test_agent_status_requires_auth(self, client_no_auth: AsyncClient):
        """Test /ingest/agent-status requires authentication."""
        response = await client_no_auth.post(
            "/ingest/agent-status",
            json={
                "agent_id": str(uuid.uuid4()),
                "status": "running",
                "node_id": "test-node",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_agent_status_update_success(
        self, client: AsyncClient, db_session: AsyncSession, test_user: User
    ):
        """Test successful agent status update."""
        agent_id = uuid.uuid4()
        agent = Agent(
            id=agent_id,
            user_id=test_user.id,
            name="Test Agent",
            status=AgentStatus.CREATING.value,
        )
        db_session.add(agent)
        await db_session.commit()

        response = await client.post(
            "/ingest/agent-status",
            json={
                "agent_id": str(agent_id),
                "status": "running",
                "node_id": "test-node",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "updated"

    @pytest.mark.asyncio
    async def test_agent_status_update_not_found(
        self, client: AsyncClient, test_user: User
    ):
        """Test agent status update returns 404 for unknown agent."""
        response = await client.post(
            "/ingest/agent-status",
            json={
                "agent_id": str(uuid.uuid4()),
                "status": "running",
                "node_id": "test-node",
            },
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_agent_status_update_forbidden(
        self, client: AsyncClient, db_session: AsyncSession, test_user: User
    ):
        """Test agent status update returns 403 for unauthorized user."""
        other_user = User(
            id=uuid.uuid4(),
            email="other@example.com",
            password_hash="hash",
            name="Other User",
        )
        db_session.add(other_user)
        await db_session.commit()

        agent_id = uuid.uuid4()
        agent = Agent(
            id=agent_id,
            user_id=other_user.id,
            name="Other Agent",
            status=AgentStatus.CREATING.value,
        )
        db_session.add(agent)
        await db_session.commit()

        response = await client.post(
            "/ingest/agent-status",
            json={
                "agent_id": str(agent_id),
                "status": "running",
                "node_id": "test-node",
            },
        )
        assert response.status_code == 403


class TestIngestMetricsEndpoint:
    """Tests for /ingest/metrics endpoint."""

    @pytest.mark.asyncio
    async def test_metrics_requires_auth(self, client_no_auth: AsyncClient):
        """Test /ingest/metrics requires authentication."""
        response = await client_no_auth.post(
            "/ingest/metrics",
            json={
                "agent_id": str(uuid.uuid4()),
                "cpu_usage": 50.0,
                "memory_usage": 1024,
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_metrics_not_found(self, client: AsyncClient, test_user: User):
        """Test metrics returns 404 for unknown agent."""
        response = await client.post(
            "/ingest/metrics",
            json={
                "agent_id": str(uuid.uuid4()),
                "cpu_usage": 50.0,
                "memory_usage": 1024,
            },
        )
        assert response.status_code == 404
