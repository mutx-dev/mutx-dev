"""
Tests for /newsletter endpoints.
"""

import pytest
from httpx import AsyncClient


class TestNewsletter:
    """Tests for waitlist/newsletter."""

    @pytest.mark.asyncio
    async def test_waitlist_count(self, client: AsyncClient):
        """Test getting waitlist count."""
        response = await client.get("/v1/newsletter")
        assert response.status_code == 200
        assert "count" in response.json()

    @pytest.mark.asyncio
    async def test_waitlist_signup(self, client: AsyncClient):
        """Test signing up for waitlist."""
        response = await client.post(
            "/v1/newsletter", json={"email": "test-news@example.com", "source": "test"}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "You're on the list!"
        assert response.json()["duplicate"] is False

    @pytest.mark.asyncio
    async def test_waitlist_duplicate_signup(self, client: AsyncClient):
        """Test duplicate signup."""
        # First signup
        await client.post("/v1/newsletter", json={"email": "dup@example.com"})
        # Second signup
        response = await client.post("/v1/newsletter", json={"email": "dup@example.com"})
        assert response.status_code == 200
        assert response.json()["duplicate"] is True
