"""
Tests for /usage endpoints.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from src.api.models.models import UsageEvent


class TestCreateUsageEvent:
    """Tests for POST /usage/events."""

    @pytest.mark.asyncio
    async def test_create_usage_event_success(self, client: AsyncClient):
        """Test creating a usage event."""
        response = await client.post(
            "/v1/usage/events",
            json={
                "event_type": "agent_create",
                "resource_type": "agent",
                "resource_id": str(uuid.uuid4()),
                "credits_used": 1.0,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "agent_create"
        assert data["resource_type"] == "agent"
        assert data["credits_used"] == 1.0
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_usage_event_with_metadata(self, client: AsyncClient):
        """Test creating a usage event with metadata."""
        response = await client.post(
            "/v1/usage/events",
            json={
                "event_type": "deployment_create",
                "resource_type": "deployment",
                "resource_id": str(uuid.uuid4()),
                "event_metadata": {"replicas": 2, "region": "us-east-1"},
                "credits_used": 5.0,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "deployment_create"
        assert data["credits_used"] == 5.0

    @pytest.mark.asyncio
    async def test_create_usage_event_requires_auth(self, client_no_auth: AsyncClient):
        """Test that creating a usage event requires authentication."""
        response = await client_no_auth.post(
            "/v1/usage/events",
            json={
                "event_type": "agent_create",
                "resource_type": "agent",
                "credits_used": 1.0,
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_usage_event_minimal_data(self, client: AsyncClient):
        """Test creating a usage event with minimal required fields."""
        response = await client.post(
            "/v1/usage/events",
            json={
                "event_type": "api_call",
                "credits_used": 0.1,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "api_call"
        assert data["resource_type"] is None


class TestListUsageEvents:
    """Tests for GET /usage/events."""

    @pytest.mark.asyncio
    async def test_list_usage_events_empty(self, client: AsyncClient):
        """Test listing usage events when none exist."""
        response = await client.get("/v1/usage/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_list_usage_events_with_data(self, client: AsyncClient, test_user, db_session: AsyncSession):
        """Test listing usage events for the authenticated user."""
        # Create some usage events for the test user
        event1 = UsageEvent(
            id=uuid.uuid4(),
            user_id=test_user.id,
            event_type="agent_create",
            resource_type="agent",
            credits_used=1.0,
        )
        event2 = UsageEvent(
            id=uuid.uuid4(),
            user_id=test_user.id,
            event_type="deployment_create",
            resource_type="deployment",
            credits_used=5.0,
        )
        db_session.add(event1)
        db_session.add(event2)
        await db_session.commit()

        response = await client.get("/v1/usage/events")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_list_usage_events_filter_by_event_type(
        self, client: AsyncClient, test_user, db_session: AsyncSession
    ):
        """Test filtering usage events by event_type."""
        # Create events with different types
        event1 = UsageEvent(
            id=uuid.uuid4(),
            user_id=test_user.id,
            event_type="agent_create",
            resource_type="agent",
            credits_used=1.0,
        )
        event2 = UsageEvent(
            id=uuid.uuid4(),
            user_id=test_user.id,
            event_type="deployment_create",
            resource_type="deployment",
            credits_used=5.0,
        )
        db_session.add(event1)
        db_session.add(event2)
        await db_session.commit()

        response = await client.get("/v1/usage/events?event_type=agent_create")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["event_type"] == "agent_create"

    @pytest.mark.asyncio
    async def test_list_usage_events_pagination(
        self, client: AsyncClient, test_user, db_session: AsyncSession
    ):
        """Test pagination of usage events."""
        # Create multiple events
        for i in range(15):
            event = UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type=f"api_call_{i}",
                credits_used=0.1,
            )
            db_session.add(event)
        await db_session.commit()

        # Test limit
        response = await client.get("/v1/usage/events?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

        # Test offset
        response = await client.get("/v1/usage/events?skip=10&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

    @pytest.mark.asyncio
    async def test_list_usage_events_requires_auth(self, client_no_auth: AsyncClient):
        """Test that listing usage events requires authentication."""
        response = await client_no_auth.get("/v1/usage/events")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_usage_events_only_shows_own_events(
        self, client: AsyncClient, test_user, db_session: AsyncSession
    ):
        """Test that users only see their own usage events."""
        # Create event for another user
        other_user_id = uuid.uuid4()
        other_event = UsageEvent(
            id=uuid.uuid4(),
            user_id=other_user_id,
            event_type="agent_create",
            resource_type="agent",
            credits_used=1.0,
        )
        db_session.add(other_event)
        await db_session.commit()

        # Create event for test user
        own_event = UsageEvent(
            id=uuid.uuid4(),
            user_id=test_user.id,
            event_type="deployment_create",
            resource_type="deployment",
            credits_used=5.0,
        )
        db_session.add(own_event)
        await db_session.commit()

        response = await client.get("/v1/usage/events")
        assert response.status_code == 200
        data = response.json()
        # Should only see own event
        assert len(data) == 1
        assert data[0]["event_type"] == "deployment_create"
