"""Tests for /v1/scheduler route — mounted, internal-only."""

from types import SimpleNamespace

import pytest
from httpx import AsyncClient

import src.api.routes.scheduler as scheduler_route


@pytest.mark.asyncio
async def test_scheduler_get_requires_authentication(client_no_auth: AsyncClient):
    response = await client_no_auth.get("/v1/scheduler")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_scheduler_get_requires_internal_user(other_user_client: AsyncClient):
    response = await other_user_client.get("/v1/scheduler")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_scheduler_post_requires_authentication(client_no_auth: AsyncClient):
    response = await client_no_auth.post(
        "/v1/scheduler",
        json={"name": "test-task"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_scheduler_post_requires_internal_user(other_user_client: AsyncClient):
    response = await other_user_client.post(
        "/v1/scheduler",
        json={"name": "test-task"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_scheduler_internal_user_can_list_tasks(client: AsyncClient):
    scheduler_route._task_store.clear()
    response = await client.get("/v1/scheduler")
    assert response.status_code == 200
    assert response.json() == {"tasks": [], "total": 0}


def test_parse_schedule_next_interval_uses_last_run_plus_interval():
    """Interval tasks should schedule their next run after the configured interval."""
    task = {
        "created_at": 1_700_000_000,
        "last_run": 1_700_000_120,
        "interval_seconds": 60,
    }

    next_run = scheduler_route._parse_schedule_next(task)

    assert next_run is not None
    assert int(next_run.timestamp()) == 1_700_000_180


@pytest.mark.asyncio
async def test_create_scheduled_task_sets_future_interval_next_run(monkeypatch):
    """Creating an interval task should return the actual future next_run timestamp."""
    scheduler_route._task_store.clear()
    admin_user = SimpleNamespace(role="admin")
    monkeypatch.setattr(scheduler_route, "_ensure_scheduler_running", lambda: None)

    response = await scheduler_route.create_scheduled_task(
        scheduler_route.SchedulerTaskCreate(name="heartbeat", interval_seconds=90),
        current_user=admin_user,
    )

    assert response.next_run is not None
    assert response.next_run - response.created_at == 90
    scheduler_route._task_store.clear()
