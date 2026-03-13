import asyncio

import pytest

from src.api.services import monitor as monitor_module


class _FakeExecuteResult:
    def scalars(self):
        return self

    def all(self):
        return []


class _FakeSession:
    async def execute(self, _query):
        return _FakeExecuteResult()

    async def commit(self):
        return None


class _FakeSessionManager:
    async def __aenter__(self):
        return _FakeSession()

    async def __aexit__(self, _exc_type, _exc, _tb):
        return False


def _fake_session_maker():
    return _FakeSessionManager()


class _FakeSelfHealing:
    def __init__(self, *, fail_stop: bool = False):
        self.start_calls = 0
        self.stop_calls = 0
        self.fail_stop = fail_stop

    async def start(self):
        self.start_calls += 1

    async def stop(self):
        self.stop_calls += 1
        if self.fail_stop:
            raise RuntimeError("boom")


@pytest.mark.asyncio
async def test_start_background_monitor_stops_self_healing_on_cancel(monkeypatch):
    monitor_cycle_started = asyncio.Event()
    fake_self_healing = _FakeSelfHealing()

    async def fake_monitor_agent_health(_session):
        monitor_cycle_started.set()

    monkeypatch.setattr(
        monitor_module,
        "get_self_healing_service",
        lambda: fake_self_healing,
    )
    monkeypatch.setattr(
        monitor_module,
        "monitor_agent_health",
        fake_monitor_agent_health,
    )
    monkeypatch.setattr(
        monitor_module.database_module,
        "async_session_maker",
        _fake_session_maker,
    )

    task = asyncio.create_task(monitor_module.start_background_monitor())
    await asyncio.wait_for(monitor_cycle_started.wait(), timeout=1)
    task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await task

    assert fake_self_healing.start_calls == 1
    assert fake_self_healing.stop_calls == 1


@pytest.mark.asyncio
async def test_start_background_monitor_cancellation_survives_stop_failure(monkeypatch):
    monitor_cycle_started = asyncio.Event()
    fake_self_healing = _FakeSelfHealing(fail_stop=True)

    async def fake_monitor_agent_health(_session):
        monitor_cycle_started.set()

    monkeypatch.setattr(
        monitor_module,
        "get_self_healing_service",
        lambda: fake_self_healing,
    )
    monkeypatch.setattr(
        monitor_module,
        "monitor_agent_health",
        fake_monitor_agent_health,
    )
    monkeypatch.setattr(
        monitor_module.database_module,
        "async_session_maker",
        _fake_session_maker,
    )

    task = asyncio.create_task(monitor_module.start_background_monitor())
    await asyncio.wait_for(monitor_cycle_started.wait(), timeout=1)
    task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await task

    assert fake_self_healing.start_calls == 1
    assert fake_self_healing.stop_calls == 1
