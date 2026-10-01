import asyncio
from datetime import datetime, timedelta, timezone

import pytest

from src.api.services import monitor as monitor_module


class _FakeSession:
    def __init__(self):
        self.committed = False
        self.commit_calls = 0
        self.rollback_calls = 0
        self.commit_event: asyncio.Event | None = None
        self.rollback_event: asyncio.Event | None = None

    async def commit(self):
        self.committed = True
        self.commit_calls += 1
        if self.commit_event is not None:
            self.commit_event.set()

    async def rollback(self):
        self.rollback_calls += 1
        if self.rollback_event is not None:
            self.rollback_event.set()


class _FakeSessionManager:
    def __init__(self, session: _FakeSession):
        self.session = session

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, _exc_type, _exc, _tb):
        return False


@pytest.mark.asyncio
async def test_start_background_monitor_cancels_cleanly(monkeypatch):
    monitor_cycle_started = asyncio.Event()
    session = _FakeSession()

    async def fake_monitor_agent_health(_session):
        monitor_cycle_started.set()

    monkeypatch.setattr(
        monitor_module,
        "monitor_agent_health",
        fake_monitor_agent_health,
    )
    monkeypatch.setattr(
        monitor_module.database_module,
        "async_session_maker",
        lambda: _FakeSessionManager(session),
    )

    task = asyncio.create_task(monitor_module.start_background_monitor())
    await asyncio.wait_for(monitor_cycle_started.wait(), timeout=1)
    task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await task

    assert session.committed is True


@pytest.mark.asyncio
async def test_start_background_monitor_commits_successful_iteration(monkeypatch, tmp_path):
    session = _FakeSession()
    session.commit_event = asyncio.Event()
    heartbeat_file = tmp_path / "monitor.heartbeat"
    runtime_state = monitor_module.MonitorRuntimeState(heartbeat_file=heartbeat_file)

    async def fake_monitor_agent_health(_session):
        return None

    monkeypatch.setattr(monitor_module, "monitor_agent_health", fake_monitor_agent_health)
    monkeypatch.setattr(
        monitor_module.database_module,
        "async_session_maker",
        lambda: _FakeSessionManager(session),
    )

    task = asyncio.create_task(monitor_module.start_background_monitor(runtime_state))
    await asyncio.wait_for(session.commit_event.wait(), timeout=1)
    task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await task

    assert session.commit_calls >= 1
    assert session.rollback_calls == 0
    assert runtime_state.last_success_at is not None
    assert runtime_state.consecutive_failures == 0
    assert monitor_module.heartbeat_is_fresh(heartbeat_file, 30)


@pytest.mark.asyncio
async def test_start_background_monitor_rolls_back_failed_iteration(monkeypatch):
    real_sleep = asyncio.sleep
    session = _FakeSession()
    session.rollback_event = asyncio.Event()
    runtime_state = monitor_module.MonitorRuntimeState()

    async def fake_monitor_agent_health(_session):
        raise RuntimeError("boom")

    async def fake_sleep(_delay):
        await real_sleep(0)

    monkeypatch.setattr(monitor_module, "monitor_agent_health", fake_monitor_agent_health)
    monkeypatch.setattr(
        monitor_module.database_module,
        "async_session_maker",
        lambda: _FakeSessionManager(session),
    )
    monkeypatch.setattr(monitor_module.asyncio, "sleep", fake_sleep)

    task = asyncio.create_task(monitor_module.start_background_monitor(runtime_state))
    await asyncio.wait_for(session.rollback_event.wait(), timeout=1)
    task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await task

    assert session.commit_calls == 0
    assert session.rollback_calls >= 1
    assert runtime_state.last_error == "boom"
    assert runtime_state.last_error_at is not None
    assert runtime_state.consecutive_failures >= 1


@pytest.mark.asyncio
async def test_start_background_monitor_exits_after_bounded_consecutive_failures(monkeypatch):
    real_sleep = asyncio.sleep
    session = _FakeSession()
    runtime_state = monitor_module.MonitorRuntimeState()

    async def fake_monitor_agent_health(_session):
        raise RuntimeError("database unavailable")

    async def fake_sleep(_delay):
        await real_sleep(0)

    monkeypatch.setattr(monitor_module, "monitor_agent_health", fake_monitor_agent_health)
    monkeypatch.setattr(
        monitor_module.database_module,
        "async_session_maker",
        lambda: _FakeSessionManager(session),
    )
    monkeypatch.setattr(monitor_module.asyncio, "sleep", fake_sleep)

    with pytest.raises(RuntimeError, match=r"consecutive failure limit \(2\)"):
        await monitor_module.start_background_monitor(runtime_state, max_consecutive_failures=2)

    assert runtime_state.consecutive_failures == 2
    assert session.rollback_calls == 2


def test_monitor_heartbeat_rejects_missing_stale_and_future_values(tmp_path):
    heartbeat_file = tmp_path / "monitor.heartbeat"
    now = datetime.now(timezone.utc)

    assert not monitor_module.heartbeat_is_fresh(heartbeat_file, 30, now=now)

    heartbeat_file.write_text(f"{(now - timedelta(seconds=31)).timestamp()}\n")
    assert not monitor_module.heartbeat_is_fresh(heartbeat_file, 30, now=now)

    heartbeat_file.write_text(f"{(now + timedelta(seconds=6)).timestamp()}\n")
    assert not monitor_module.heartbeat_is_fresh(heartbeat_file, 30, now=now)

    heartbeat_file.write_text(f"{(now - timedelta(seconds=5)).timestamp()}\n")
    assert monitor_module.heartbeat_is_fresh(heartbeat_file, 30, now=now)
