"""Tests for /v1/scheduler route — mounted, requires admin role."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scheduler_get_requires_admin(client: AsyncClient):
    """Scheduler GET requires admin role — returns 403 for non-admin users."""
    response = await client.get("/v1/scheduler")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_scheduler_post_requires_admin(client: AsyncClient):
    """Scheduler POST requires admin role — returns 403 for non-admin users."""
    response = await client.post(
        "/v1/scheduler",
        json={"name": "test-task"},
    )
    assert response.status_code == 403
