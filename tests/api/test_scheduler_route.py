"""Tests for /v1/scheduler route — unmounted, returns 404."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scheduler_get_not_mounted(client: AsyncClient):
    """Scheduler is unmounted — returns 404."""
    response = await client.get("/v1/scheduler")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_scheduler_post_not_mounted(client: AsyncClient):
    """Scheduler POST is unmounted — returns 404."""
    response = await client.post(
        "/v1/scheduler",
        json={"task_id": "some-task"},
    )
    assert response.status_code == 404
