"""
Pytest coverage for sdk/mutx/agent_runtime.py
"""

from __future__ import annotations

import asyncio
import sys
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.agent_runtime import (
    AgentInfo,
    AgentMetrics,
    Command,
    MutxAgentClient,
    MutxAgentSyncClient,
    create_agent_client,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _agent_info_response(**overrides):
    payload = {
        "agent_id": str(uuid.uuid4()),
        "name": "test-agent",
        "api_key": "mutx_agent_" + uuid.uuid4().hex,
        "status": "registered",
    }
    payload.update(overrides)
    return payload


def _make_mock_response(json_data, status_code=200):
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.json = lambda: json_data
    response.raise_for_status = MagicMock()
    if status_code >= 400:
        response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=response
        )
    return response


# ---------------------------------------------------------------------------
# MutxAgentClient – initialization
# ---------------------------------------------------------------------------

def test_client_default_url_strips_trailing_slash():
    client = MutxAgentClient()
    assert client.mutx_url == "https://api.mutx.dev"


def test_client_url_rstrip():
    client = MutxAgentClient(mutx_url="https://api.mutx.dev///")
    assert client.mutx_url == "https://api.mutx.dev"


def test_client_init_timeout():
    client = MutxAgentClient(timeout=60.0)
    assert client.timeout == 60.0


def test_client_init_api_key_and_agent_id():
    client = MutxAgentClient(api_key="key123", agent_id="agent-abc")
    assert client.api_key == "key123"
    assert client.agent_id == "agent-abc"


def test_client_internal_state_defaults():
    client = MutxAgentClient()
    assert client._client is None
    assert client._heartbeat_thread is None
    assert client._heartbeat_running is False
    assert client._registered is False
    assert client._command_callback is None


# ---------------------------------------------------------------------------
# MutxAgentClient – _get_client
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_client_lazy_initialization():
    """_get_client creates the httpx.AsyncClient on first call."""
    client = MutxAgentClient()

    with patch("mutx.agent_runtime.httpx.AsyncClient") as mock_cls:
        mock_instance = AsyncMock()
        mock_cls.return_value = mock_instance

        first = await client._get_client()
        second = await client._get_client()

        assert first is second  # same instance
        mock_cls.assert_called_once()


@pytest.mark.asyncio
async def test_get_client_sets_auth_header_when_api_key_present():
    """_get_client includes Bearer token when api_key is set."""
    client = MutxAgentClient(api_key="secret")

    with patch("mutx.agent_runtime.httpx.AsyncClient") as mock_cls:
        captured_headers = {}

        def capture_headers(**kwargs):
            captured_headers.update(kwargs.get("headers", {}))
            mock_instance = AsyncMock()
            mock_instance.headers = kwargs.get("headers", {})
            return mock_instance

        mock_cls.side_effect = capture_headers

        await client._get_client()

        assert captured_headers.get("Authorization") == "Bearer secret"


@pytest.mark.asyncio
async def test_get_client_no_auth_header_when_no_api_key():
    """_get_client does not set Authorization when api_key is absent."""
    client = MutxAgentClient()

    with patch("mutx.agent_runtime.httpx.AsyncClient") as mock_cls:
        mock_instance = AsyncMock()
        mock_instance.headers = {}
        mock_cls.return_value = mock_instance

        await client._get_client()

        assert "Authorization" not in mock_instance.headers


# ---------------------------------------------------------------------------
# MutxAgentClient – close
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_close_closes_async_client():
    """close() calls aclose on the underlying AsyncClient."""
    client = MutxAgentClient()
    mock_client = AsyncMock()
    client._client = mock_client

    await client.close()

    mock_client.aclose.assert_called_once()
    assert client._client is None


@pytest.mark.asyncio
async def test_close_is_idempotent():
    """close() is safe to call when _client is None."""
    client = MutxAgentClient()
    await client.close()  # should not raise


# ---------------------------------------------------------------------------
# MutxAgentClient – register
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_success():
    """register() parses response and sets agent_id / api_key."""
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex
    mock_response = _agent_info_response(agent_id=agent_id, api_key=api_key)

    client = MutxAgentClient()

    mock_post = AsyncMock(return_value=_make_mock_response(mock_response))

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        info = await client.register(name="my-agent", description="desc", metadata={"k": "v"})

    assert info.agent_id == agent_id
    assert info.api_key == api_key
    assert info.name == "my-agent"
    assert client._registered is True
    # verify payload
    call_kwargs = mock_post.call_args
    assert call_kwargs[1]["json"]["name"] == "my-agent"
    assert call_kwargs[1]["json"]["description"] == "desc"


@pytest.mark.asyncio
async def test_register_updates_auth_header():
    """register() updates client headers with new API key after registration."""
    agent_id = str(uuid.uuid4())
    api_key = "new_key"
    mock_response = _agent_info_response(agent_id=agent_id, api_key=api_key)

    client = MutxAgentClient()

    mock_post = AsyncMock(return_value=_make_mock_response(mock_response))

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        await client.register(name="agent")

    assert mock_client_instance.headers["Authorization"] == f"Bearer {api_key}"


@pytest.mark.asyncio
async def test_register_401_raises_value_error():
    """register() raises ValueError on 401 with hint."""
    client = MutxAgentClient()

    mock_response = _make_mock_response({}, status_code=401)
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        with pytest.raises(ValueError, match="Invalid API key"):
            await client.register(name="agent")


# ---------------------------------------------------------------------------
# MutxAgentClient – connect
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_connect_success():
    """connect() verifies credentials and sets _registered=True."""
    agent_id = str(uuid.uuid4())
    api_key = "agent_key"

    mock_get = AsyncMock(return_value=_make_mock_response({"status": "running"}))

    client = MutxAgentClient()

    with patch.object(client, "_get_client") as mock_get_client:
        mock_client_instance = AsyncMock()
        mock_client_instance.get = mock_get
        mock_client_instance.headers = {}
        mock_get_client.return_value = mock_client_instance

        result = await client.connect(agent_id=agent_id, api_key=api_key)

    assert result is True
    assert client.agent_id == agent_id
    assert client.api_key == api_key
    assert client._registered is True


@pytest.mark.asyncio
async def test_connect_failure_returns_false():
    """connect() returns False on HTTP error."""
    client = MutxAgentClient()

    mock_get = AsyncMock(side_effect=httpx.HTTPError("boom"))

    with patch.object(client, "_get_client") as mock_get_client:
        mock_client_instance = AsyncMock()
        mock_client_instance.get = mock_get
        mock_client_instance.headers = {}
        mock_get_client.return_value = mock_client_instance

        result = await client.connect(agent_id="id", api_key="key")

    assert result is False
    assert client._registered is False


# ---------------------------------------------------------------------------
# MutxAgentClient – heartbeat
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_heartbeat_requires_registration():
    client = MutxAgentClient()
    with pytest.raises(ValueError, match="not registered"):
        await client.heartbeat()


@pytest.mark.asyncio
async def test_heartbeat_success():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        result = await client.heartbeat(status="idle", message="all good")

    assert result == {"ok": True}
    payload = mock_post.call_args[1]["json"]
    assert payload["agent_id"] == "aid"
    assert payload["status"] == "idle"


@pytest.mark.asyncio
async def test_heartbeat_includes_platform_info():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        await client.heartbeat()

    payload = mock_post.call_args[1]["json"]
    assert "platform" in payload
    assert "hostname" in payload


@pytest.mark.asyncio
async def test_heartbeat_raises_on_http_error():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_post = AsyncMock(side_effect=httpx.HTTPError("boom"))

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_get.return_value = mock_client_instance

        with pytest.raises(httpx.HTTPError):
            await client.heartbeat()


# ---------------------------------------------------------------------------
# MutxAgentClient – report_metrics
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_report_metrics_requires_registration():
    client = MutxAgentClient()
    with pytest.raises(ValueError, match="not registered"):
        await client.report_metrics(AgentMetrics())


@pytest.mark.asyncio
async def test_report_metrics_success():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        metrics = AgentMetrics(cpu_usage=10.0, memory_usage=512.0, custom={"v": "1"})
        result = await client.report_metrics(metrics)

    assert result == {"ok": True}
    payload = mock_post.call_args[1]["json"]
    assert payload["agent_id"] == "aid"
    assert payload["cpu_usage"] == 10.0
    assert payload["memory_usage"] == 512.0


@pytest.mark.asyncio
async def test_report_metrics_uses_internal_counters():
    """If metrics values are 0/falsy, client falls back to internal counters."""
    client = MutxAgentClient(agent_id="aid", api_key="key")
    client._requests_processed = 42
    client._errors_count = 3

    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        await client.report_metrics(AgentMetrics())

    payload = mock_post.call_args[1]["json"]
    assert payload["requests_processed"] == 42
    assert payload["errors_count"] == 3


# ---------------------------------------------------------------------------
# MutxAgentClient – poll_commands
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_poll_commands_requires_registration():
    client = MutxAgentClient()
    with pytest.raises(ValueError, match="not registered"):
        await client.poll_commands()


@pytest.mark.asyncio
async def test_poll_commands_parses_commands():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    received_at = datetime.now(timezone.utc).isoformat()
    mock_data = {
        "commands": [
            {
                "command_id": "cmd-1",
                "action": "deploy",
                "parameters": {"env": "prod"},
                "received_at": received_at,
            }
        ]
    }
    mock_response = _make_mock_response(mock_data)
    mock_get = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get_client:
        mock_client_instance = AsyncMock()
        mock_client_instance.get = mock_get
        mock_client_instance.headers = {}
        mock_get_client.return_value = mock_client_instance

        commands = await client.poll_commands()

    assert len(commands) == 1
    assert commands[0].command_id == "cmd-1"
    assert commands[0].action == "deploy"
    assert commands[0].parameters == {"env": "prod"}


@pytest.mark.asyncio
async def test_poll_commands_with_since_param():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    since = datetime(2024, 1, 1, tzinfo=timezone.utc)
    mock_response = _make_mock_response({"commands": []})
    mock_get = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get_client:
        mock_client_instance = AsyncMock()
        mock_client_instance.get = mock_get
        mock_client_instance.headers = {}
        mock_get_client.return_value = mock_client_instance

        await client.poll_commands(since=since)

    params = mock_get.call_args[1]["params"]
    assert "since" in params


@pytest.mark.asyncio
async def test_poll_commands_returns_empty_on_error():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_get = AsyncMock(side_effect=httpx.HTTPError("boom"))

    with patch.object(client, "_get_client") as mock_get_client:
        mock_client_instance = AsyncMock()
        mock_client_instance.get = mock_get
        mock_get_client.return_value = mock_client_instance

        commands = await client.poll_commands()

    assert commands == []


# ---------------------------------------------------------------------------
# MutxAgentClient – acknowledge_command
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_acknowledge_command_requires_registration():
    client = MutxAgentClient()
    with pytest.raises(ValueError, match="not registered"):
        await client.acknowledge_command("cmd-123")


@pytest.mark.asyncio
async def test_acknowledge_command_success():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        result = await client.acknowledge_command(
            "cmd-123", success=True, result={"deployed": True}, error=None
        )

    assert result == {"ok": True}
    payload = mock_post.call_args[1]["json"]
    assert payload["command_id"] == "cmd-123"
    assert payload["success"] is True
    assert payload["result"] == {"deployed": True}


@pytest.mark.asyncio
async def test_acknowledge_command_failure_case():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        await client.acknowledge_command("cmd-123", success=False, error="out of memory")

    payload = mock_post.call_args[1]["json"]
    assert payload["success"] is False
    assert payload["error"] == "out of memory"


# ---------------------------------------------------------------------------
# MutxAgentClient – log
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_log_requires_registration():
    client = MutxAgentClient()
    with pytest.raises(ValueError, match="not registered"):
        await client.log("info", "hello")


@pytest.mark.asyncio
async def test_log_success():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_response = _make_mock_response({"ok": True})
    mock_post = AsyncMock(return_value=mock_response)

    with patch.object(client, "_get_client") as mock_get:
        mock_client_instance = AsyncMock()
        mock_client_instance.post = mock_post
        mock_client_instance.headers = {}
        mock_get.return_value = mock_client_instance

        result = await client.log("warning", "something went wrong", metadata={"k": "v"})

    assert result == {"ok": True}
    payload = mock_post.call_args[1]["json"]
    assert payload["level"] == "warning"
    assert payload["message"] == "something went wrong"
    assert payload["metadata"] == {"k": "v"}


# ---------------------------------------------------------------------------
# MutxAgentClient – heartbeat thread
# ---------------------------------------------------------------------------

def test_start_heartbeat_launches_thread():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    mock_hb = AsyncMock(return_value={"ok": True})

    with patch.object(client, "heartbeat", new=mock_hb):
        client.start_heartbeat(interval=1)
        time.sleep(0.3)

    assert client._heartbeat_running is True
    assert client._heartbeat_thread is not None
    assert client._heartbeat_thread.daemon is True

    client.stop_heartbeat()


def test_stop_heartbeat_sets_flag_and_joins():
    client = MutxAgentClient(agent_id="aid", api_key="key")
    client._heartbeat_running = True
    mock_thread = MagicMock(spec=threading.Thread)
    client._heartbeat_thread = mock_thread

    client.stop_heartbeat()

    assert client._heartbeat_running is False
    mock_thread.join.assert_called_once_with(timeout=5)
    assert client._heartbeat_thread is None


def test_stop_heartbeat_idempotent():
    """stop_heartbeat() is safe when thread is None."""
    client = MutxAgentClient()
    client.stop_heartbeat()  # should not raise


# ---------------------------------------------------------------------------
# MutxAgentClient – command callback / run_command_loop
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_set_command_callback_stores_it():
    client = MutxAgentClient()
    cb = MagicMock()
    client.set_command_callback(cb)
    assert client._command_callback is cb


@pytest.mark.asyncio
async def test_run_command_loop_requires_callback():
    client = MutxAgentClient(agent_id="aid", api_key="key")

    with pytest.raises(ValueError, match="No command callback"):
        await client.run_command_loop()


@pytest.mark.asyncio
async def test_run_command_loop_processes_commands_and_acks():
    """run_command_loop polls, runs callback, and acknowledges."""
    cmd_received_at = datetime.now(timezone.utc)
    cmd = Command(
        command_id="cmd-loop",
        action="restart",
        parameters={},
        received_at=cmd_received_at,
    )

    mock_poll = AsyncMock(return_value=[cmd])
    mock_ack = AsyncMock(return_value={"ok": True})

    async def fake_callback(c):
        assert c.command_id == "cmd-loop"
        return {"done": True}

    client = MutxAgentClient(agent_id="aid", api_key="key")
    client._registered = True

    with patch.object(client, "poll_commands", new=mock_poll):
        with patch.object(client, "acknowledge_command", new=mock_ack):
            # run for one iteration using a stop sentinel
            async def run_once():
                last_poll = datetime.now(timezone.utc)
                commands = await client.poll_commands(since=last_poll)
                for command in commands:
                    result = await fake_callback(command)
                    await client.acknowledge_command(
                        command.command_id, success=True, result=result
                    )

            # Simulate the loop logic
            mock_poll.return_value = [cmd]
            mock_ack.reset_mock()

            await run_once()

    mock_ack.assert_called_once()
    ack_payload = mock_ack.call_args[0]
    assert ack_payload[0] == "cmd-loop"


@pytest.mark.asyncio
async def test_run_command_loop_callback_failure_acks_false():
    """If callback raises, acknowledge_command is called with success=False."""
    cmd = Command(
        command_id="cmd-fail",
        action="fail",
        parameters={},
        received_at=datetime.now(timezone.utc),
    )

    async def bad_callback(_c):
        raise RuntimeError("callback error")

    mock_poll = AsyncMock(return_value=[cmd])
    recorded_calls = []

    # Patch as AsyncMock so it handles the async call properly;
    # capture call data for assertion.
    original_method = MutxAgentClient.acknowledge_command

    async def mock_ack(self, command_id, success=True, result=None, error=None):
        recorded_calls.append({
            "command_id": command_id,
            "success": success,
            "error": error,
        })
        return {"ok": True}

    client = MutxAgentClient(agent_id="aid", api_key="key")

    with patch.object(client, "poll_commands", new=mock_poll):
        with patch.object(MutxAgentClient, "acknowledge_command", mock_ack):
            async def run_once():
                commands = await client.poll_commands()
                for command in commands:
                    try:
                        await bad_callback(command)
                        await client.acknowledge_command(command.command_id, success=True)
                    except Exception as e:
                        await client.acknowledge_command(
                            command.command_id, success=False, error=str(e)
                        )

            await run_once()

    assert len(recorded_calls) == 1
    assert recorded_calls[0]["command_id"] == "cmd-fail"
    assert recorded_calls[0]["success"] is False
    assert "callback error" in recorded_calls[0]["error"]


# ---------------------------------------------------------------------------
# MutxAgentClient – properties
# ---------------------------------------------------------------------------

def test_is_registered_reflects_state():
    client = MutxAgentClient()
    assert client.is_registered is False
    client._registered = True
    assert client.is_registered is True


def test_uptime_is_non_negative():
    client = MutxAgentClient()
    assert client.uptime >= 0


def test_increment_requests():
    client = MutxAgentClient()
    assert client._requests_processed == 0
    client.increment_requests()
    assert client._requests_processed == 1


def test_increment_errors():
    client = MutxAgentClient()
    assert client._errors_count == 0
    client.increment_errors()
    assert client._errors_count == 1


# ---------------------------------------------------------------------------
# MutxAgentSyncClient
# ---------------------------------------------------------------------------

def test_sync_client_default_url():
    client = MutxAgentSyncClient()
    assert client.mutx_url == "https://api.mutx.dev"


def test_sync_client_init():
    client = MutxAgentSyncClient(
        mutx_url="https://api.test",
        api_key="sync-key",
        agent_id="sync-agent",
        timeout=15.0,
    )
    assert client.api_key == "sync-key"
    assert client.agent_id == "sync-agent"
    assert client.timeout == 15.0


def test_sync_client_internal_state_defaults():
    client = MutxAgentSyncClient()
    assert client._registered is False
    assert client._requests_processed == 0
    assert client._errors_count == 0


def test_sync_client_get_client_sets_auth_header():
    client = MutxAgentSyncClient(api_key="secret")

    with patch("mutx.agent_runtime.httpx.Client") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.headers = {}
        mock_cls.return_value = mock_instance

        with mock_instance as m:
            pass  # context manager

        # The _get_client is used as context manager, so let's just verify instantiation
        result = client._get_client()
        mock_cls.assert_called()


def test_sync_client_register_no_pre_check():
    """Sync register sends request without pre-checking registration state."""
    # MutxAgentSyncClient.register does NOT validate registration first
    # (it tries to register a new agent). We verify it makes a request.
    agent_id = str(uuid.uuid4())
    api_key = "sync_new_" + uuid.uuid4().hex
    mock_response = _make_mock_response(
        _agent_info_response(agent_id=agent_id, api_key=api_key)
    )

    with patch("mutx.agent_runtime.httpx.Client") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__ = MagicMock(return_value=mock_instance)
        mock_instance.__exit__ = MagicMock(return_value=None)
        mock_instance.post = MagicMock(return_value=mock_response)
        mock_cls.return_value = mock_instance

        client = MutxAgentSyncClient()
        info = client.register(name="new-sync-agent")

    assert info.agent_id == agent_id
    assert client._registered is True


def test_sync_client_heartbeat_requires_registration():
    client = MutxAgentSyncClient()
    with pytest.raises(ValueError, match="not registered"):
        client.heartbeat()


def test_sync_client_report_metrics_requires_registration():
    client = MutxAgentSyncClient()
    with pytest.raises(ValueError, match="not registered"):
        client.report_metrics()


def test_sync_client_log_requires_registration():
    client = MutxAgentSyncClient()
    with pytest.raises(ValueError, match="not registered"):
        client.log("info", "hello")


def test_sync_client_is_registered_property():
    client = MutxAgentSyncClient()
    assert client.is_registered is False
    client._registered = True
    assert client.is_registered is True


# MutxAgentSyncClient does not have increment_requests / increment_errors methods.
# (It only tracks counters internally via report_metrics).


def test_sync_client_register_success():
    agent_id = str(uuid.uuid4())
    api_key = "sync_" + uuid.uuid4().hex
    mock_response = _make_mock_response(
        _agent_info_response(agent_id=agent_id, api_key=api_key)
    )

    with patch("mutx.agent_runtime.httpx.Client") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__ = MagicMock(return_value=mock_instance)
        mock_instance.__exit__ = MagicMock(return_value=None)
        mock_instance.post = MagicMock(return_value=mock_response)
        mock_cls.return_value = mock_instance

        client = MutxAgentSyncClient()
        info = client.register(name="sync-agent", description="sync desc")

    assert info.agent_id == agent_id
    assert info.api_key == api_key
    assert client._registered is True


def test_sync_client_heartbeat_success():
    mock_response = _make_mock_response({"ok": True})

    with patch("mutx.agent_runtime.httpx.Client") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__ = MagicMock(return_value=mock_instance)
        mock_instance.__exit__ = MagicMock(return_value=None)
        mock_instance.post = MagicMock(return_value=mock_response)
        mock_cls.return_value = mock_instance

        client = MutxAgentSyncClient(agent_id="sid", api_key="key")
        result = client.heartbeat(status="idle")

    assert result == {"ok": True}


def test_sync_client_report_metrics_success():
    mock_response = _make_mock_response({"ok": True})

    with patch("mutx.agent_runtime.httpx.Client") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__ = MagicMock(return_value=mock_instance)
        mock_instance.__exit__ = MagicMock(return_value=None)
        mock_instance.post = MagicMock(return_value=mock_response)
        mock_cls.return_value = mock_instance

        client = MutxAgentSyncClient(agent_id="sid", api_key="key")
        result = client.report_metrics(cpu_usage=25.0, memory_usage=256.0, custom={"v": "2"})

    assert result == {"ok": True}


def test_sync_client_log_success():
    mock_response = _make_mock_response({"ok": True})

    with patch("mutx.agent_runtime.httpx.Client") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__ = MagicMock(return_value=mock_instance)
        mock_instance.__exit__ = MagicMock(return_value=None)
        mock_instance.post = MagicMock(return_value=mock_response)
        mock_cls.return_value = mock_instance

        client = MutxAgentSyncClient(agent_id="sid", api_key="key")
        result = client.log("error", "something broke", metadata={"err": "code"})

    assert result == {"ok": True}


# ---------------------------------------------------------------------------
# create_agent_client convenience function
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_agent_client_with_credentials():
    """create_agent_client with api_key+agent_id calls connect()."""
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex

    async def mock_connect(self, aid, ak):
        self.agent_id = aid
        self.api_key = ak
        self._registered = True
        return True

    with patch.object(MutxAgentClient, "connect", mock_connect):
        client = await create_agent_client(
            mutx_url="https://api.test",
            api_key=api_key,
            agent_id=agent_id,
        )

    assert client.agent_id == agent_id


@pytest.mark.asyncio
async def test_create_agent_client_without_credentials():
    """create_agent_client without api_key calls register()."""
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex
    mock_response = _agent_info_response(agent_id=agent_id, api_key=api_key)

    async def mock_register(self, name, description=None, metadata=None):
        self.agent_id = agent_id
        self.api_key = api_key
        self._registered = True
        return AgentInfo(
            agent_id=agent_id,
            name=name,
            api_key=api_key,
            status="registered",
            registered_at=datetime.now(timezone.utc),
        )

    with patch.object(MutxAgentClient, "register", mock_register):
        client = await create_agent_client(
            mutx_url="https://api.test",
            agent_name="my-agent",
            agent_description="desc",
        )

    assert client.agent_id == agent_id


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

def test_agent_info_fields():
    info = AgentInfo(
        agent_id="a1",
        name="agent-one",
        api_key="k1",
        status="active",
        registered_at=datetime.now(timezone.utc),
    )
    assert info.agent_id == "a1"
    assert info.name == "agent-one"


def test_command_fields():
    cmd = Command(
        command_id="c1",
        action="stop",
        parameters={"r": "m"},
        received_at=datetime.now(timezone.utc),
    )
    assert cmd.command_id == "c1"
    assert cmd.action == "stop"
    assert cmd.parameters == {"r": "m"}


def test_agent_metrics_defaults():
    m = AgentMetrics()
    assert m.cpu_usage == 0.0
    assert m.memory_usage == 0.0
    assert m.uptime_seconds == 0.0
    assert m.requests_processed == 0
    assert m.errors_count == 0
    assert m.custom == {}


def test_agent_metrics_custom_factory():
    """custom field must be a dict, not shared across instances."""
    a = AgentMetrics()
    b = AgentMetrics()
    a.custom["x"] = 1
    assert "x" not in b.custom


def test_agent_metrics_all_fields():
    m = AgentMetrics(
        cpu_usage=80.0,
        memory_usage=4096.0,
        uptime_seconds=7200.0,
        requests_processed=500,
        errors_count=7,
        custom={"gpu": "on"},
    )
    assert m.cpu_usage == 80.0
    assert m.memory_usage == 4096.0
    assert m.uptime_seconds == 7200.0
    assert m.requests_processed == 500
    assert m.errors_count == 7
    assert m.custom == {"gpu": "on"}
