# SDK contract tests for agent runtime module

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch

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


def _agent_info_response(**overrides):
    payload = {
        "agent_id": str(uuid.uuid4()),
        "name": "test-agent",
        "api_key": "mutx_agent_" + uuid.uuid4().hex,
        "status": "registered",
    }
    payload.update(overrides)
    return payload


def _command_response(**overrides):
    payload = {
        "command_id": str(uuid.uuid4()),
        "action": "run_task",
        "parameters": {"task_id": "123"},
        "received_at": datetime.now(timezone.utc).isoformat(),
    }
    payload.update(overrides)
    return payload


def test_agent_info_parses_response():
    response = _agent_info_response()
    info = AgentInfo(
        agent_id=response["agent_id"],
        name=response["name"],
        api_key=response["api_key"],
        status=response["status"],
        registered_at=datetime.now(timezone.utc),
    )

    assert info.agent_id == response["agent_id"]
    assert info.name == response["name"]
    assert info.api_key == response["api_key"]
    assert info.status == "registered"


def test_command_parses_response():
    received_at = datetime.now(timezone.utc)
    cmd = Command(
        command_id=str(uuid.uuid4()),
        action="stop",
        parameters={"reason": "maintenance"},
        received_at=received_at,
    )

    assert cmd.action == "stop"
    assert cmd.parameters["reason"] == "maintenance"


def test_agent_metrics_defaults():
    metrics = AgentMetrics()

    assert metrics.cpu_usage == 0.0
    assert metrics.memory_usage == 0.0
    assert metrics.uptime_seconds == 0.0
    assert metrics.requests_processed == 0
    assert metrics.errors_count == 0
    assert metrics.custom == {}


def test_agent_metrics_with_values():
    metrics = AgentMetrics(
        cpu_usage=50.5,
        memory_usage=1024.0,
        uptime_seconds=3600.0,
        requests_processed=100,
        errors_count=2,
        custom={"version": "1.0"},
    )

    assert metrics.cpu_usage == 50.5
    assert metrics.memory_usage == 1024.0
    assert metrics.uptime_seconds == 3600.0
    assert metrics.requests_processed == 100
    assert metrics.errors_count == 2
    assert metrics.custom["version"] == "1.0"


@pytest.mark.asyncio
async def test_mutx_agent_client_register_hits_contract_route():
    captured = {}
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: _agent_info_response(agent_id=agent_id, api_key=api_key)
        return response

    client = MutxAgentClient(mutx_url="https://api.test")
    client._client = AsyncMock()
    client._client.post = mock_post

    info = await client.register(name="test-agent", description="Test agent")

    assert captured["path"] == "/v1/agents/register"
    assert captured["json"]["name"] == "test-agent"
    assert captured["json"]["description"] == "Test agent"
    assert info.agent_id == agent_id


@pytest.mark.asyncio
async def test_mutx_agent_client_heartbeat_hits_contract_route():
    captured = {}
    agent_id = str(uuid.uuid4())

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: {"status": "ok"}
        return response

    client = MutxAgentClient(mutx_url="https://api.test", agent_id=agent_id, api_key="test-key")
    client._client = AsyncMock()
    client._client.post = mock_post

    await client.heartbeat(status="running", message="all good")

    assert captured["path"] == "/v1/agents/heartbeat"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["status"] == "running"
    assert captured["json"]["message"] == "all good"


@pytest.mark.asyncio
async def test_mutx_agent_client_heartbeat_requires_registration():
    client = MutxAgentClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        await client.heartbeat()


@pytest.mark.asyncio
async def test_mutx_agent_client_report_metrics_hits_contract_route():
    captured = {}
    agent_id = str(uuid.uuid4())

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: {"status": "ok"}
        return response

    client = MutxAgentClient(mutx_url="https://api.test", agent_id=agent_id, api_key="test-key")
    client._client = AsyncMock()
    client._client.post = mock_post

    metrics = AgentMetrics(cpu_usage=25.0, memory_usage=512.0, requests_processed=10)
    await client.report_metrics(metrics)

    assert captured["path"] == "/v1/agents/metrics"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["cpu_usage"] == 25.0
    assert captured["json"]["memory_usage"] == 512.0
    assert captured["json"]["requests_processed"] == 10


@pytest.mark.asyncio
async def test_mutx_agent_client_poll_commands_hits_contract_route():
    captured = {}
    agent_id = str(uuid.uuid4())
    command_id = str(uuid.uuid4())

    async def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["params"] = kwargs.get("params", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: {"commands": [_command_response(command_id=command_id)]}
        return response

    client = MutxAgentClient(mutx_url="https://api.test", agent_id=agent_id, api_key="test-key")
    client._client = AsyncMock()
    client._client.get = mock_get

    commands = await client.poll_commands()

    assert captured["path"] == "/v1/agents/commands"
    assert captured["params"]["agent_id"] == agent_id
    assert len(commands) == 1
    assert commands[0].command_id == command_id
    assert commands[0].action == "run_task"


@pytest.mark.asyncio
async def test_mutx_agent_client_acknowledge_command_hits_contract_route():
    captured = {}
    agent_id = str(uuid.uuid4())
    command_id = str(uuid.uuid4())

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: {"status": "acknowledged"}
        return response

    client = MutxAgentClient(mutx_url="https://api.test", agent_id=agent_id, api_key="test-key")
    client._client = AsyncMock()
    client._client.post = mock_post

    await client.acknowledge_command(command_id=command_id, success=True, result={"output": "done"})

    assert captured["path"] == "/v1/agents/commands/acknowledge"
    assert captured["json"]["command_id"] == command_id
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["success"] is True
    assert captured["json"]["result"]["output"] == "done"


@pytest.mark.asyncio
async def test_mutx_agent_client_log_hits_contract_route():
    captured = {}
    agent_id = str(uuid.uuid4())

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: {"status": "logged"}
        return response

    client = MutxAgentClient(mutx_url="https://api.test", agent_id=agent_id, api_key="test-key")
    client._client = AsyncMock()
    client._client.post = mock_post

    await client.log(level="info", message="Agent started", metadata={"host": "server1"})

    assert captured["path"] == "/v1/agents/logs"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["level"] == "info"
    assert captured["json"]["message"] == "Agent started"
    assert captured["json"]["metadata"]["host"] == "server1"


def test_mutx_agent_sync_client_register():
    captured = {}
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(
            201, json=_agent_info_response(agent_id=agent_id, api_key=api_key)
        )
        return response

    with patch("mutx.agent_runtime.httpx.Client") as mock_client:
        mock_instance = mock_client.return_value.__enter__.return_value
        mock_instance.post = mock_post

        client = MutxAgentSyncClient(mutx_url="https://api.test")
        info = client.register(name="sync-agent", description="Sync test")

    assert captured["path"] == "/v1/agents/register"
    assert captured["json"]["name"] == "sync-agent"
    assert info.agent_id == agent_id


def test_mutx_agent_sync_client_heartbeat():
    captured = {}
    agent_id = str(uuid.uuid4())

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json={"status": "ok"})
        return response

    with patch("mutx.agent_runtime.httpx.Client") as mock_client:
        mock_instance = mock_client.return_value.__enter__.return_value
        mock_instance.post = mock_post

        client = MutxAgentSyncClient(mutx_url="https://api.test", agent_id=agent_id)
        client.heartbeat(status="idle", message="waiting")

    assert captured["path"] == "/v1/agents/heartbeat"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["status"] == "idle"


def test_mutx_agent_sync_client_report_metrics():
    captured = {}
    agent_id = str(uuid.uuid4())

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json={"status": "ok"})
        return response

    with patch("mutx.agent_runtime.httpx.Client") as mock_client:
        mock_instance = mock_client.return_value.__enter__.return_value
        mock_instance.post = mock_post

        client = MutxAgentSyncClient(mutx_url="https://api.test", agent_id=agent_id)
        client.report_metrics(cpu_usage=75.0, memory_usage=2048.0)

    assert captured["path"] == "/v1/agents/metrics"
    assert captured["json"]["cpu_usage"] == 75.0
    assert captured["json"]["memory_usage"] == 2048.0


def test_mutx_agent_sync_client_log():
    captured = {}
    agent_id = str(uuid.uuid4())

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else ""
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json={"status": "ok"})
        return response

    with patch("mutx.agent_runtime.httpx.Client") as mock_client:
        mock_instance = mock_client.return_value.__enter__.return_value
        mock_instance.post = mock_post

        client = MutxAgentSyncClient(mutx_url="https://api.test", agent_id=agent_id)
        client.log(level="error", message="Something failed", metadata={"code": 500})

    assert captured["path"] == "/v1/agents/logs"
    assert captured["json"]["level"] == "error"
    assert captured["json"]["message"] == "Something failed"
    assert captured["json"]["metadata"]["code"] == 500


def test_mutx_agent_sync_client_requires_registration_for_heartbeat():
    client = MutxAgentSyncClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        client.heartbeat()


def test_mutx_agent_sync_client_requires_registration_for_metrics():
    client = MutxAgentSyncClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        client.report_metrics()


def test_mutx_agent_sync_client_requires_registration_for_log():
    client = MutxAgentSyncClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        client.log(level="info", message="test")


@pytest.mark.asyncio
async def test_create_agent_client_registers_new_agent():
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex

    async def mock_post(*args, **kwargs):
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: _agent_info_response(agent_id=agent_id, api_key=api_key)
        return response

    with patch("mutx.agent_runtime.httpx.AsyncClient"):
        mock_instance = AsyncMock()
        mock_instance.post = mock_post
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_instance.headers = {}

        with patch("mutx.agent_runtime.MutxAgentClient._get_client", return_value=mock_instance):
            client = await create_agent_client(mutx_url="https://api.test", agent_name="new-agent")

    assert client.agent_id == agent_id
    assert client.api_key == api_key


def test_mutx_agent_client_is_registered_property():
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client.is_registered is False

    client._registered = True
    assert client.is_registered is True


def test_mutx_agent_sync_client_is_registered_property():
    client = MutxAgentSyncClient(mutx_url="https://api.test")
    assert client.is_registered is False

    client._registered = True
    assert client.is_registered is True


def test_mutx_agent_client_uptime_property():
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client.uptime >= 0


def test_mutx_agent_client_increment_requests():
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client._requests_processed == 0

    client.increment_requests()
    assert client._requests_processed == 1

    client.increment_requests()
    assert client._requests_processed == 2


def test_mutx_agent_client_increment_errors():
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client._errors_count == 0

    client.increment_errors()
    assert client._errors_count == 1
