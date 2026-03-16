"""
Tests for /ingest endpoints.
"""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Agent, AgentStatus, User


class TestIngestEndpoints:
    """Tests for ingestion endpoints."""

    @pytest.mark.asyncio
    async def test_agent_status_requires_auth(self, client_no_auth: AsyncClient):
        """Test /ingest/agent-status requires authentication."""
        response = await client_no_auth.post(
            "/v1/ingest/agent-status",
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
            "/v1/ingest/agent-status",
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
            "/v1/ingest/agent-status",
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
            "/v1/ingest/agent-status",
            json={
                "agent_id": str(agent_id),
                "status": "running",
                "node_id": "test-node",
            },
        )
        assert response.status_code == 403


class TestIngestMetricsEndpoint:
    """Tests for /ingest/metrics endpoint."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import User


class TestIngestAPIKeyAuth:
    """Tests for API key authentication on ingestion endpoints."""

    @pytest.mark.asyncio
    async def test_agent_status_update_with_api_key(
        self, client: AsyncClient, client_no_auth: AsyncClient, db_session: AsyncSession, test_user: User
    ):
        """Test that an API key can be used to authenticate to /ingest/agent-status."""
        # First create an API key (requires auth)
        create_response = await client.post(
            "/v1/api-keys",
            json={"name": "ingest-key"},
        )
        assert create_response.status_code == 201
        api_key = create_response.json()["key"]

        # Create an agent for the test user
        agent_id = uuid.uuid4()
        agent = Agent(
            id=agent_id,
            user_id=test_user.id,
            name="Test Agent",
            status=AgentStatus.CREATING.value,
        )
        db_session.add(agent)
        await db_session.commit()

        # Use the API key to authenticate (without JWT)
        response = await client_no_auth.post(
            "/v1/ingest/agent-status",
            json={
                "agent_id": str(agent_id),
                "status": "running",
                "node_id": "test-node",
            },
            headers={"X-API-Key": api_key},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "updated"

    @pytest.mark.asyncio
    async def test_agent_status_update_with_invalid_api_key(
        self, client_no_auth: AsyncClient, db_session: AsyncSession, test_user: User
    ):
        """Test that an invalid API key is rejected."""
        # Create an agent for the test user
        agent_id = uuid.uuid4()
        agent = Agent(
            id=agent_id,
            user_id=test_user.id,
            name="Test Agent",
            status=AgentStatus.CREATING.value,
        )
        db_session.add(agent)
        await db_session.commit()

        # Use an invalid API key
        response = await client_no_auth.post(
            "/v1/ingest/agent-status",
            json={
                "agent_id": str(agent_id),
                "status": "running",
                "node_id": "test-node",
            },
            headers={"X-API-Key": "mutx_live_invalid_key"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_agent_status_update_with_revoked_api_key(
        self, client: AsyncClient, client_no_auth: AsyncClient, db_session: AsyncSession, test_user: User
    ):
        """Test that a revoked API key is rejected."""
        # Create and then revoke an API key (requires auth)
        create_response = await client.post(
            "/v1/api-keys",
            json={"name": "revoked-key"},
        )
        assert create_response.status_code == 201
        api_key = create_response.json()["key"]
        key_id = create_response.json()["id"]

        # Revoke the key
        revoke_response = await client.delete(f"/v1/api-keys/{key_id}")
        assert revoke_response.status_code == 204

        # Create an agent for the test user
        agent_id = uuid.uuid4()
        agent = Agent(
            id=agent_id,
            user_id=test_user.id,
            name="Test Agent",
            status=AgentStatus.CREATING.value,
        )
        db_session.add(agent)
        await db_session.commit()

        # Use the revoked API key
        response = await client_no_auth.post(
            "/v1/ingest/agent-status",
            json={
                "agent_id": str(agent_id),
                "status": "running",
                "node_id": "test-node",
            },
            headers={"X-API-Key": api_key},
        )
        assert response.status_code == 401
