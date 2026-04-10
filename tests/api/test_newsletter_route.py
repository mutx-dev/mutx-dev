"""Tests for /v1/newsletter route — unmounted, returns 404."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_newsletter_not_mounted(client: AsyncClient):
    """Newsletter is unmounted — returns 404."""
    response = await client.get("/v1/newsletter")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_newsletter_post_not_mounted(client: AsyncClient):
    response = await client.post(
        "/v1/newsletter",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 404
