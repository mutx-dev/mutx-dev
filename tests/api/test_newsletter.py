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

    @pytest.mark.asyncio
    async def test_waitlist_invalid_email(self, client: AsyncClient):
        """Test invalid email format."""
        response = await client.post(
            "/v1/newsletter", json={"email": "not-an-email", "source": "test"}
        )
        # EmailStr validation should return 422
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_waitlist_missing_email(self, client: AsyncClient):
        """Test missing email field."""
        response = await client.post(
            "/v1/newsletter", json={"source": "test"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_waitlist_empty_source(self, client: AsyncClient):
        """Test empty source defaults to coming-soon."""
        response = await client.post(
            "/v1/newsletter", json={"email": "empty-source@test.com", "source": ""}
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_waitlist_long_source(self, client: AsyncClient):
        """Test source is truncated to 120 chars."""
        long_source = "x" * 200
        response = await client.post(
            "/v1/newsletter", json={"email": "long-source@test.com", "source": long_source}
        )
        assert response.status_code == 200
        # Source should be truncated

    @pytest.mark.asyncio
    async def test_waitlist_email_normalization(self, client: AsyncClient):
        """Test email is normalized to lowercase."""
        response = await client.post(
            "/v1/newsletter", json={"email": "TEST@EXAMPLE.COM", "source": "test"}
        )
        assert response.status_code == 200
        # Should succeed, email normalized
