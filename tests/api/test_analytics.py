"""
Tests for /analytics endpoints.
"""

import json
from datetime import datetime, timedelta, timezone
import uuid

import pytest
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

    @pytest.mark.asyncio
    async def test_analytics_summary_filters_runs_to_requested_period(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_agent,
    ):
        """Run counts should respect the requested reporting window."""
        from src.api.models.models import AgentRun

        now = datetime.now(timezone.utc)
        db_session.add_all(
            [
                AgentRun(
                    agent_id=test_agent.id,
                    user_id=test_user.id,
                    status="completed",
                    started_at=now - timedelta(days=2),
                ),
                AgentRun(
                    agent_id=test_agent.id,
                    user_id=test_user.id,
                    status="failed",
                    started_at=now - timedelta(days=45),
                ),
            ]
        )
        await db_session.commit()

        response = await client.get("/v1/analytics/summary", params={"period_start": "30d"})
        assert response.status_code == 200
        data = response.json()
        assert data["total_runs"] == 1
        assert data["successful_runs"] == 1
        assert data["failed_runs"] == 0


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

    @pytest.mark.asyncio
    async def test_cost_summary_aggregates_credits_by_event_and_agent(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_agent,
    ):
        """Cost summary should aggregate real credit usage, not raw event counts."""
        from src.api.models.models import UsageEvent

        now = datetime.now(timezone.utc)
        db_session.add_all(
            [
                UsageEvent(
                    user_id=test_user.id,
                    event_type="api_call",
                    credits_used=2.5,
                    resource_type="agent",
                    resource_id=str(test_agent.id),
                    created_at=now - timedelta(days=1),
                ),
                UsageEvent(
                    user_id=test_user.id,
                    event_type="agent_run_created",
                    credits_used=7.5,
                    resource_id="77777777-7777-4777-a777-777777777777",
                    event_metadata=json.dumps({"agent_id": str(test_agent.id)}),
                    created_at=now - timedelta(days=1),
                ),
            ]
        )
        await db_session.commit()

        response = await client.get("/v1/analytics/costs", params={"period_start": "30d"})
        assert response.status_code == 200
        data = response.json()
        assert data["total_credits_used"] == 10.0
        assert data["usage_by_event_type"]["api_call"] == 2.5
        assert data["usage_by_event_type"]["agent_run_created"] == 7.5
        assert data["usage_by_agent"][str(test_agent.id)] == 10.0


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

    @pytest.mark.asyncio
    async def test_budget_uses_current_billing_cycle_only(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user,
    ):
        """Analytics budget should match the monthly billing window, not lifetime usage."""
        from src.api.models.models import UsageEvent

        now = datetime.now(timezone.utc)
        current_month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

        db_session.add_all(
            [
                UsageEvent(
                    user_id=test_user.id,
                    event_type="api_call",
                    credits_used=60.0,
                    created_at=current_month_start - timedelta(days=1),
                ),
                UsageEvent(
                    user_id=test_user.id,
                    event_type="api_call",
                    credits_used=15.0,
                    created_at=current_month_start + timedelta(days=1),
                ),
            ]
        )
        await db_session.commit()

        response = await client.get("/v1/analytics/budget")
        assert response.status_code == 200
        data = response.json()
        assert data["credits_used"] == 15.0
        assert data["credits_remaining"] == 85.0
