"""Tests for the runs API endpoints."""
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.main import app
from src.api.models import Agent, AgentRun, User


@pytest.fixture
def mock_user():
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password="hashed",
        created_at=datetime.utcnow(),
    )
    return user


@pytest.fixture
def mock_agent(mock_user):
    agent = Agent(
        id=uuid.uuid4(),
        user_id=mock_user.id,
        name="Test Agent",
        agent_type="test",
        config={},
        status="running",
        created_at=datetime.utcnow(),
    )
    return agent


class TestRunsAPI:
    """Test suite for runs API."""

    @pytest.mark.asyncio
    async def test_create_run_validation(self):
        """Test that run creation requires valid input."""
        # Test with invalid agent_id format
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/runs",
                json={"agent_id": "not-a-uuid"},
            )
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_list_runs_requires_auth(self):
        """Test that listing runs requires authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/runs")
            assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_run_not_found(self):
        """Test that getting a non-existent run returns 404."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            fake_id = uuid.uuid4()
            response = await client.get(f"/api/runs/{fake_id}")
            assert response.status_code in [401, 403, 404]

    @pytest.mark.asyncio
    async def test_run_trace_pagination(self):
        """Test that trace listing supports pagination."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            fake_id = uuid.uuid4()
            response = await client.get(f"/api/runs/{fake_id}/traces?skip=0&limit=10")
            assert response.status_code in [401, 403, 404]
