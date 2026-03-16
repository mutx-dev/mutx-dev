"""
Tests for /analytics endpoints.
"""

import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestAnalyticsSummary:
    """Tests for GET /analytics/summary endpoint."""

    @pytest.mark.asyncio
    async def test_analytics_summary_authenticated(
        self, client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test getting analytics summary as authenticated user."""
        from src.api.models.models import Agent, AgentStatus

        # Create a test agent
        agent = Agent(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            user_id=test_user.id,
            name="test-agent",
            description="Test agent",
            type="openai",
            status=AgentStatus.RUNNING,
            config='{"name": "test-agent", "model": "gpt-4o"}',
        )
        db_session.add(agent)
        await db_session.commit()

        response = await client.get("/v1/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_agents" in data
        assert "active_agents" in data
        assert "period_start" in data
        assert "period_end" in data


class TestAgentMetricsSummary:
    """Tests for GET /analytics/agents/{agent_id}/summary endpoint."""

    @pytest.mark.asyncio
    async def test_agent_metrics_summary_not_found(self, client: AsyncClient):
        """Test 404 for non-existent agent."""
        response = await client.get(
            "/v1/analytics/agents/99999999-9999-9999-9999-999999999999/summary"
        )
        assert response.status_code == 404


class TestCostSummary:
    """Tests for GET /analytics/costs endpoint."""

    @pytest.mark.asyncio
    async def test_cost_summary_authenticated(self, client: AsyncClient):
        """Test getting cost summary as authenticated user."""
        response = await client.get("/v1/analytics/costs")
        assert response.status_code == 200
        data = response.json()
        assert "total_credits_used" in data
        assert "credits_remaining" in data
        assert "credits_total" in data


class TestBudgetEndpoint:
    """Tests for GET /analytics/budget endpoint."""

    @pytest.mark.asyncio
    async def test_budget_authenticated(self, client: AsyncClient):
        """Test getting budget as authenticated user."""
        response = await client.get("/v1/analytics/budget")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "plan" in data
        assert "credits_total" in data
        assert "credits_used" in data
