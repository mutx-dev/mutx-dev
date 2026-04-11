"""Tests for /v1/scheduler route — mounted, requires admin role."""

from types import SimpleNamespace

import pytest
from httpx import AsyncClient

import src.api.routes.scheduler as scheduler_route


@pytest.fixture(autouse=True)
def isolated_scheduler_task_store():
    """Isolate scheduler task-store state between tests."""
    snapshot = dict(scheduler_route._task_store)
    scheduler_route._task_store.clear()
    try:
        yield
    finally:
        scheduler_route._task_store.clear()
        scheduler_route._task_store.update(snapshot)


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


@pytest.mark.asyncio
async def test_interval_task_next_run_is_created_at_plus_interval(monkeypatch):
    """Interval tasks should schedule their next run after the configured interval."""
    admin_user = SimpleNamespace(role="admin")
    monkeypatch.setattr(scheduler_route, "_ensure_scheduler_running", lambda: None)

    response = await scheduler_route.create_scheduled_task(
        scheduler_route.SchedulerTaskCreate(name="interval-check", interval_seconds=60),
        current_user=admin_user,
    )

    assert response.next_run is not None
    assert response.next_run - response.created_at == 60


@pytest.mark.asyncio
async def test_create_scheduled_task_sets_future_interval_next_run():
    """Creating an interval task should return the actual future next_run timestamp."""
    admin_user = SimpleNamespace(role="admin")

    response = await scheduler_route.create_scheduled_task(
        scheduler_route.SchedulerTaskCreate(name="heartbeat", interval_seconds=90),
        current_user=admin_user,
    )

    assert response.next_run is not None
    assert response.next_run - response.created_at == 90
    assert response.id in scheduler_route._task_store
    stored_task = scheduler_route._task_store[response.id]
    assert stored_task["name"] == "heartbeat"
    assert stored_task["interval_seconds"] == 90
    assert stored_task["next_run"] == response.next_run
