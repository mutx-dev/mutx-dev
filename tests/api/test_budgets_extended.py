"""
Tests for /budgets endpoints — auth enforcement, period filtering, edge cases.
"""

import pytest
from httpx import AsyncClient


class TestBudgetsAuthEnforcement:
    """Verify auth is enforced on budget endpoints."""

    @pytest.mark.asyncio
    async def test_get_budget_requires_auth(self, client_no_auth: AsyncClient):
        """GET /budgets should reject unauthenticated requests."""
        response = await client_no_auth.get("/v1/budgets")
        assert response.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_get_usage_requires_auth(self, client_no_auth: AsyncClient):
        """GET /budgets/usage should reject unauthenticated requests."""
        response = await client_no_auth.get("/v1/budgets/usage")
        assert response.status_code in (401, 403)


class TestBudgetsPeriodFiltering:
    """Verify period query parameter handling on /budgets/usage."""

    @pytest.mark.asyncio
    async def test_usage_with_7d_period(self, client: AsyncClient):
        """GET /budgets/usage?period_start=7d returns valid structure."""
        response = await client.get("/v1/budgets/usage?period_start=7d")
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
    async def test_usage_with_30d_period(self, client: AsyncClient):
        """GET /budgets/usage?period_start=30d returns valid structure."""
        response = await client.get("/v1/budgets/usage?period_start=30d")
        assert response.status_code == 200
        data = response.json()
        assert "total_credits_used" in data

    @pytest.mark.asyncio
    async def test_usage_with_iso_period(self, client: AsyncClient):
        """GET /budgets/usage with ISO date period returns valid structure."""
        response = await client.get(
            "/v1/budgets/usage?period_start=2025-01-01T00:00:00Z&period_end=2025-12-31T23:59:59Z"
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_credits_used" in data

    @pytest.mark.asyncio
    async def test_usage_without_period_defaults(self, client: AsyncClient):
        """GET /budgets/usage without period uses a sensible default."""
        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        assert "period_start" in data
        assert "period_end" in data


class TestBudgetsResponseShape:
    """Verify response shapes match documented contracts."""

    @pytest.mark.asyncio
    async def test_budget_response_has_all_fields(self, client: AsyncClient):
        """GET /budgets response includes all expected fields."""
        response = await client.get("/v1/budgets")
        assert response.status_code == 200
        data = response.json()
        expected_keys = {
            "user_id",
            "plan",
            "credits_total",
            "credits_used",
            "credits_remaining",
            "reset_date",
            "usage_percentage",
        }
        assert expected_keys.issubset(data.keys()), f"Missing keys: {expected_keys - data.keys()}"

    @pytest.mark.asyncio
    async def test_usage_types_are_numeric(self, client: AsyncClient):
        """Credits fields in usage breakdown are numeric."""
        response = await client.get("/v1/budgets/usage")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["total_credits_used"], (int, float))
        assert isinstance(data["credits_remaining"], (int, float))
        assert isinstance(data["credits_total"], (int, float))
