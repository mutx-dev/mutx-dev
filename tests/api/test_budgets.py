"""
Tests for /budgets endpoints.
"""

import pytest
from httpx import AsyncClient


class TestGetBudget:
    """Tests for GET /budgets endpoint."""

    @pytest.mark.asyncio
    async def test_get_budget_authenticated(self, client: AsyncClient):
        """Test getting budget as authenticated user."""
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
    async def test_get_usage_breakdown_with_period(self, client: AsyncClient):
        """Test getting usage breakdown with period parameter."""
        response = await client.get("/v1/budgets/usage?period_start=7d")
        assert response.status_code == 200
        data = response.json()
        assert "period_start" in data
        assert "period_end" in data
