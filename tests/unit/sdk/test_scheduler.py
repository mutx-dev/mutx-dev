"""
Tests for the scheduler SDK module.

Scheduler feature is planned for v1.3 and returns 503. These tests verify
the SDK layer correctly maps to the backend API contract and handles errors.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from typing import Any

import httpx
import pytest

from mutx.scheduler import Scheduler, SchedulerTask


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

STATUS_PAYLOAD: dict[str, Any] = {
    "status": "running",
    "tasks": [],
}


def _task_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-task",
        "enabled": True,
        "schedule": "0 * * * *",
        "last_run": 1742340000,
        "next_run": 1742343600,
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# SchedulerTask
# ---------------------------------------------------------------------------

class TestSchedulerTask:
    """Tests for the SchedulerTask data class."""

    def test_parses_required_fields(self) -> None:
        """Test that required fields are parsed correctly."""
        data = _task_payload()
        task = SchedulerTask(data)

        assert task.id == data["id"]
        assert task.name == data["name"]
        assert task.enabled is True

    def test_parses_optional_fields_when_none(self) -> None:
        """Test that optional fields are parsed with correct defaults when None."""
        data = _task_payload(schedule=None, last_run=None, next_run=None)
        task = SchedulerTask(data)

        assert task.schedule is None
        assert task.last_run is None
        assert task.next_run is None

    def test_parses_optional_fields_when_present(self) -> None:
        """Test all optional fields when they have values."""
        data = _task_payload(
            schedule="0 9 * * *",
            last_run=1742340000,
            next_run=1742343600,
        )
        task = SchedulerTask(data)

        assert task.schedule == "0 9 * * *"
        assert task.last_run == 1742340000
        assert task.next_run == 1742343600

    def test_stores_raw_data(self) -> None:
        """Test that raw data is preserved in _data."""
        data = _task_payload()
        task = SchedulerTask(data)

        assert task._data is data

    def test_repr_includes_id_and_name_and_enabled(self) -> None:
        """Test that __repr__ contains key fields."""
        data = _task_payload(name="nightly-job", enabled=False)
        task = SchedulerTask(data)

        repr_str = repr(task)

        assert "SchedulerTask" in repr_str
        assert data["id"] in repr_str
        assert "nightly-job" in repr_str
        assert "False" in repr_str


# ---------------------------------------------------------------------------
# Scheduler – client type enforcement
# ---------------------------------------------------------------------------

class TestSchedulerClientTypeEnforcement:
    """Tests for sync/async client type enforcement."""

    def test_init_accepts_sync_client(self) -> None:
        """Test that Scheduler can be initialized with a sync httpx.Client."""
        client = httpx.Client(base_url="https://api.test")
        scheduler = Scheduler(client)
        assert scheduler._client is client

    def test_init_accepts_async_client(self) -> None:
        """Test that Scheduler can be initialized with an async httpx.AsyncClient."""
        client = httpx.AsyncClient(base_url="https://api.test")
        scheduler = Scheduler(client)
        assert scheduler._client is client

    def test_sync_method_raises_on_async_client(self) -> None:
        """Test that sync get_status raises RuntimeError when used with async client."""
        client = httpx.AsyncClient(base_url="https://api.test")
        scheduler = Scheduler(client)

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            scheduler.get_status()

    def test_async_method_raises_on_sync_client(self) -> None:
        """Test that async aget_status raises RuntimeError when used with sync client."""
        client = httpx.Client(base_url="https://api.test")
        scheduler = Scheduler(client)

        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(scheduler.aget_status())


# ---------------------------------------------------------------------------
# Scheduler.get_status
# ---------------------------------------------------------------------------

class TestSchedulerGetStatus:
    """Tests for Scheduler.get_status (sync)."""

    def test_hits_correct_route(self) -> None:
        """Test that get_status hits the /scheduler GET endpoint."""
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json=STATUS_PAYLOAD)

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        scheduler.get_status()

        assert captured["path"] == "/scheduler"
        assert captured["method"] == "GET"

    def test_returns_json_response(self) -> None:
        """Test that get_status returns the parsed JSON response."""

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=STATUS_PAYLOAD)

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        result = scheduler.get_status()

        assert result == STATUS_PAYLOAD

    def test_raises_for_status_on_503(self) -> None:
        """Test that get_status raises HTTPStatusError on 503."""

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "Not yet implemented"})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        with pytest.raises(httpx.HTTPStatusError):
            scheduler.get_status()


# ---------------------------------------------------------------------------
# Scheduler.aget_status
# ---------------------------------------------------------------------------

class TestSchedulerAgetStatus:
    """Tests for Scheduler.aget_status (async)."""

    def test_hits_correct_route(self) -> None:
        """Test that aget_status hits the /scheduler GET endpoint."""
        captured: dict[str, Any] = {}

        async def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json=STATUS_PAYLOAD)

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        asyncio.run(scheduler.aget_status())

        assert captured["path"] == "/scheduler"
        assert captured["method"] == "GET"

    def test_returns_json_response(self) -> None:
        """Test that aget_status returns the parsed JSON response."""

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=STATUS_PAYLOAD)

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        result = asyncio.run(scheduler.aget_status())

        assert result == STATUS_PAYLOAD

    def test_raises_for_status_on_503(self) -> None:
        """Test that aget_status raises HTTPStatusError on 503."""

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "Not yet implemented"})

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        with pytest.raises(httpx.HTTPStatusError):
            asyncio.run(scheduler.aget_status())


# ---------------------------------------------------------------------------
# Scheduler.trigger_task
# ---------------------------------------------------------------------------

class TestSchedulerTriggerTask:
    """Tests for Scheduler.trigger_task (sync)."""

    def test_hits_correct_route(self) -> None:
        """Test that trigger_task hits the POST /scheduler endpoint."""
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json={"triggered": True})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        scheduler.trigger_task(task_id="task-123")

        assert captured["path"] == "/scheduler"
        assert captured["method"] == "POST"

    def test_sends_task_id_in_json_body(self) -> None:
        """Test that task_id is sent in the JSON request body."""
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json={"triggered": True})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        scheduler.trigger_task(task_id="task-abc-456")

        assert captured["json"] == {"task_id": "task-abc-456"}

    def test_returns_json_response(self) -> None:
        """Test that trigger_task returns the parsed JSON response."""

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"triggered": True, "task_id": "task-123"})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        result = scheduler.trigger_task(task_id="task-123")

        assert result["triggered"] is True

    def test_raises_for_status_on_503(self) -> None:
        """Test that trigger_task raises HTTPStatusError on 503."""

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "Scheduler not yet implemented"})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        with pytest.raises(httpx.HTTPStatusError):
            scheduler.trigger_task(task_id="task-123")

    def test_raises_for_status_on_404(self) -> None:
        """Test that trigger_task raises HTTPStatusError when task not found."""

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(404, json={"detail": "Task not found"})

        client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
        scheduler = Scheduler(client)

        with pytest.raises(httpx.HTTPStatusError):
            scheduler.trigger_task(task_id="nonexistent-task")


# ---------------------------------------------------------------------------
# Scheduler.atrigger_task
# ---------------------------------------------------------------------------

class TestSchedulerAtriggerTask:
    """Tests for Scheduler.atrigger_task (async)."""

    def test_hits_correct_route(self) -> None:
        """Test that atrigger_task hits the POST /scheduler endpoint."""
        captured: dict[str, Any] = {}

        async def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json={"triggered": True})

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        asyncio.run(scheduler.atrigger_task(task_id="task-123"))

        assert captured["path"] == "/scheduler"
        assert captured["method"] == "POST"

    def test_sends_task_id_in_json_body(self) -> None:
        """Test that task_id is sent in the JSON request body."""
        captured: dict[str, Any] = {}

        async def handler(request: httpx.Request) -> httpx.Response:
            captured["json"] = json.loads(request.content.decode())
            return httpx.Response(200, json={"triggered": True})

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        asyncio.run(scheduler.atrigger_task(task_id="task-xyz-789"))

        assert captured["json"] == {"task_id": "task-xyz-789"}

    def test_returns_json_response(self) -> None:
        """Test that atrigger_task returns the parsed JSON response."""

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"triggered": True, "task_id": "task-123"})

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        result = asyncio.run(scheduler.atrigger_task(task_id="task-123"))

        assert result["triggered"] is True

    def test_raises_for_status_on_503(self) -> None:
        """Test that atrigger_task raises HTTPStatusError on 503."""

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, json={"detail": "Scheduler not yet implemented"})

        client = httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        scheduler = Scheduler(client)

        with pytest.raises(httpx.HTTPStatusError):
            asyncio.run(scheduler.atrigger_task(task_id="task-123"))


# ---------------------------------------------------------------------------
# Integration: SchedulerTask parsed from realistic backend response
# ---------------------------------------------------------------------------

class TestSchedulerTaskIntegration:
    """Tests for SchedulerTask parsed from a full status response."""

    def test_multiple_tasks_parsed_correctly(self) -> None:
        """Test that multiple tasks from a status response parse correctly."""
        payload = {
            "status": "running",
            "tasks": [
                _task_payload(name="nightly-backup", enabled=True),
                _task_payload(name="hourly-scrape", enabled=False),
                _task_payload(name="weekly-report", enabled=True, last_run=None, next_run=None),
            ],
        }

        tasks = [SchedulerTask(t) for t in payload["tasks"]]

        assert tasks[0].name == "nightly-backup"
        assert tasks[0].enabled is True
        assert tasks[1].name == "hourly-scrape"
        assert tasks[1].enabled is False
        assert tasks[2].name == "weekly-report"
        assert tasks[2].last_run is None
        assert tasks[2].next_run is None

    def test_disabled_task_repr(self) -> None:
        """Test __repr__ for a disabled task."""
        data = _task_payload(name="disabled-task", enabled=False)
        task = SchedulerTask(data)

        repr_str = repr(task)

        assert "disabled-task" in repr_str
        assert "False" in repr_str
