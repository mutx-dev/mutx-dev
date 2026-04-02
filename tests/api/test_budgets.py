"""
Tests for /budgets endpoints.
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Agent, UsageEvent, User
from src.api.models.plan_tiers import PlanTier


# ---------------------------------------------------------------------------
# TestGetBudget
# ---------------------------------------------------------------------------


class TestGetBudget:
    """Tests for GET /budgets endpoint."""

    @pytest.mark.asyncio
    async def test_get_budget_authenticated(self, client: AsyncClient):
        """Test getting budget as authenticated user returns all required fields."""
        response = await client.get("/v1/budgets")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "plan" in data
        assert "credits_total" in data
        assert "credits_used" in data
        assert "credits_remaining" in data
        assert "reset_date" in data
        assert "usage_percentage" in data

    @pytest.mark.asyncio
    async def test_get_budget_no_usage(self, client: AsyncClient):
        """Test budget for user with zero usage events."""
        response = await client.get("/v1/budgets")
        assert response.status_code == 200
        data = response.json()
        assert data["credits_used"] == 0.0
        assert data["credits_total"] == 100  # FREE plan default
        assert data["credits_remaining"] == 100
        assert data["usage_percentage"] == 0.0

    @pytest.mark.asyncio
    async def test_get_budget_with_usage(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test budget correctly sums usage events."""
        # Create usage events
        now = datetime.now(timezone.utc)
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=25.0,
                created_at=now,
            )
        )
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="api.call",
                resource_id=str(uuid.uuid4()),
                credits_used=15.0,
                created_at=now,
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets")
        assert response.status_code == 200
        data = response.json()
        assert data["credits_used"] == 40.0
        assert data["credits_total"] == 100
        assert data["credits_remaining"] == 60.0
        assert data["usage_percentage"] == 40.0

    @pytest.mark.asyncio
    async def test_get_budget_reset_date_is_first_of_next_month(
        self, client: AsyncClient
    ):
        """Test that reset_date is the first day of the next month."""
        response = await client.get("/v1/budgets")
        assert response.status_code == 200
        data = response.json()
        reset_date = datetime.fromisoformat(data["reset_date"].replace("Z", "+00:00"))
        # Reset date should be midnight UTC on the 1st of next month
        assert reset_date.day == 1
        assert reset_date.hour == 0
        assert reset_date.minute == 0
        assert reset_date.second == 0
        assert reset_date.tzinfo == timezone.utc

        now = datetime.now(timezone.utc)
        expected_month = now.month + 1 if now.month < 12 else 1
        expected_year = now.year if now.month < 12 else now.year + 1
        assert reset_date.month == expected_month
        assert reset_date.year == expected_year

    @pytest.mark.asyncio
    async def test_get_budget_plan_tier(self, client: AsyncClient, test_user: User):
        """Test that plan tier is reflected in credits_total."""
        test_user.plan = PlanTier.PRO
        response = await client.get("/v1/budgets")
        assert response.status_code == 200
        data = response.json()
        assert data["credits_total"] == 10000


# ---------------------------------------------------------------------------
# TestGetUsageBreakdown
# ---------------------------------------------------------------------------


class TestGetUsageBreakdown:
    """Tests for GET /budgets/usage endpoint."""

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_authenticated(self, client: AsyncClient):
        """Test getting usage breakdown as authenticated user."""
        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        assert "total_credits_used" in data
        assert "credits_remaining" in data
        assert "credits_total" in data
        assert "period_start" in data
        assert "period_end" in data
        assert "usage_by_agent" in data
        assert "usage_by_type" in data

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_empty(self, client: AsyncClient):
        """Test breakdown returns zeros when no usage events exist."""
        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        assert data["total_credits_used"] == 0.0
        assert data["credits_remaining"] == 100
        assert data["credits_total"] == 100
        assert data["usage_by_agent"] == []
        assert data["usage_by_type"] == []

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_with_events(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test breakdown correctly aggregates by agent and type."""
        now = datetime.now(timezone.utc)
        events = [
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=10.0,
                created_at=now - timedelta(hours=1),
            ),
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=20.0,
                created_at=now - timedelta(hours=2),
            ),
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="api.call",
                resource_id=None,
                credits_used=5.0,
                created_at=now - timedelta(hours=1),
            ),
        ]
        db_session.add_all(events)
        await db_session.commit()

        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()

        # Only events with resource_id are counted in agent_usage total.
        # The api.call event has resource_id=None, so it is not counted in
        # total_credits_used (which is derived from agent_usage).
        assert data["total_credits_used"] == 30.0
        # credits_remaining for FREE plan: 100 - 30 = 70
        assert data["credits_remaining"] == 70.0

        # Check agent aggregation — only test_agent (has resource_id)
        agent_credits = {a["agent_name"]: a["credits_used"] for a in data["usage_by_agent"]}
        assert agent_credits[test_agent.name] == 30.0
        assert data["usage_by_agent"][0]["event_count"] == 2  # Two events for test_agent

        # Check type aggregation — both types are counted by type even without resource_id
        type_credits = {t["event_type"]: t["credits_used"] for t in data["usage_by_type"]}
        assert type_credits["agent.run"] == 30.0
        assert type_credits["api.call"] == 5.0

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_period_24h(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test 24h period only includes events from the last 24 hours."""
        now = datetime.now(timezone.utc)

        # Event within 24h
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=50.0,
                created_at=now - timedelta(hours=12),
            )
        )
        # Event outside 24h
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=999.0,
                created_at=now - timedelta(days=10),
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets/usage?period_start=24h")
        assert response.status_code == 200
        data = response.json()
        # Only the recent 50.0 event should be counted
        assert data["total_credits_used"] == 50.0

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_period_7d(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test 7d period parameter."""
        now = datetime.now(timezone.utc)

        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=7.0,
                created_at=now - timedelta(days=3),
            )
        )
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=999.0,
                created_at=now - timedelta(days=20),
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets/usage?period_start=7d")
        assert response.status_code == 200
        data = response.json()
        assert data["total_credits_used"] == 7.0

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_period_30d(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test 30d period parameter."""
        now = datetime.now(timezone.utc)

        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=30.0,
                created_at=now - timedelta(days=15),
            )
        )
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=999.0,
                created_at=now - timedelta(days=60),
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets/usage?period_start=30d")
        assert response.status_code == 200
        data = response.json()
        assert data["total_credits_used"] == 30.0

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_custom_datetime_range(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test breakdown with explicit ISO datetime range."""
        now = datetime.now(timezone.utc)
        custom_start = (now - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
        custom_end = (now - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=42.0,
                created_at=now - timedelta(days=3),
            )
        )
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=999.0,
                created_at=now - timedelta(days=10),
            )
        )
        await db_session.commit()

        response = await client.get(
            f"/v1/budgets/usage?period_start={custom_start}&period_end={custom_end}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_credits_used"] == 42.0

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_unknown_agent_name(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Test breakdown shows 'Unknown' for agent IDs not found in DB."""
        now = datetime.now(timezone.utc)
        unknown_agent_id = str(uuid.uuid4())
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=unknown_agent_id,
                credits_used=7.0,
                created_at=now - timedelta(hours=1),
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        agent_names = [a["agent_name"] for a in data["usage_by_agent"]]
        assert any(f"Unknown ({unknown_agent_id[:8]})" in name for name in agent_names)

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_sorted_by_credits_desc(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test usage_by_agent and usage_by_type are sorted by credits descending."""
        now = datetime.now(timezone.utc)

        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="small_call",
                resource_id=str(test_agent.id),
                credits_used=1.0,
                created_at=now,
            )
        )
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="big_call",
                resource_id=str(uuid.uuid4()),
                credits_used=100.0,
                created_at=now,
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()

        # Check descending order for agents
        agent_credits = [a["credits_used"] for a in data["usage_by_agent"]]
        assert agent_credits == sorted(agent_credits, reverse=True)

        # Check descending order for types
        type_credits = [t["credits_used"] for t in data["usage_by_type"]]
        assert type_credits == sorted(type_credits, reverse=True)

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_does_not_include_other_users_events(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        other_user: User,
        test_agent: Agent,
    ):
        """Test that events from other users are not included in breakdown."""
        now = datetime.now(timezone.utc)

        # Own event
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=test_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=1.0,
                created_at=now,
            )
        )
        # Other user's event
        db_session.add(
            UsageEvent(
                id=uuid.uuid4(),
                user_id=other_user.id,
                event_type="agent.run",
                resource_id=str(test_agent.id),
                credits_used=9999.0,
                created_at=now,
            )
        )
        await db_session.commit()

        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        assert data["total_credits_used"] == 1.0

    @pytest.mark.asyncio
    async def test_get_usage_breakdown_credits_total_uses_plan_tier(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        test_agent: Agent,
    ):
        """Test that credits_total reflects the user's plan tier."""
        test_user.plan = PlanTier.ENTERPRISE
        await db_session.commit()

        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        assert data["credits_total"] == 100000


# ---------------------------------------------------------------------------
# Test _parse_datetime helper
# ---------------------------------------------------------------------------


class TestParseDatetime:
    """Tests for the _parse_datetime helper used in budget routes."""

    @pytest.mark.asyncio
    async def test_parse_datetime_none(self):
        """Test that None input returns None."""
        from src.api.routes.budgets import _parse_datetime

        assert _parse_datetime(None) is None

    @pytest.mark.asyncio
    async def test_parse_datetime_empty_string(self):
        """Test that empty string returns None."""
        from src.api.routes.budgets import _parse_datetime

        assert _parse_datetime("") is None

    @pytest.mark.asyncio
    async def test_parse_datetime_with_z_suffix(self):
        """Test parsing datetime string with Z suffix."""
        from src.api.routes.budgets import _parse_datetime

        result = _parse_datetime("2024-06-15T10:30:00Z")
        assert result.year == 2024
        assert result.month == 6
        assert result.day == 15
        assert result.hour == 10
        assert result.minute == 30
        assert result.second == 0
        assert result.tzinfo == timezone.utc

    @pytest.mark.asyncio
    async def test_parse_datetime_with_offset(self):
        """Test parsing datetime string with +00:00 offset."""
        from src.api.routes.budgets import _parse_datetime

        result = _parse_datetime("2024-06-15T10:30:00+00:00")
        assert result.year == 2024
        assert result.month == 6
        assert result.day == 15

    @pytest.mark.asyncio
    async def test_parse_datetime_invalid_returns_none(self):
        """Test that invalid datetime strings return None without raising."""
        from src.api.routes.budgets import _parse_datetime

        assert _parse_datetime("not-a-date") is None
        assert _parse_datetime("2024-13-99") is None  # impossible date
