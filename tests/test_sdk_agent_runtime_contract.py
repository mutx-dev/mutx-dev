"""
SDK contract tests for agent runtime module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

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


def test_agent_info_parses_response():
    """Test that AgentInfo correctly parses the backend response."""
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
    """Test that Command correctly parses the backend response."""
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
    """Test AgentMetrics has correct default values."""
    metrics = AgentMetrics()

    assert metrics.cpu_usage == 0.0
    assert metrics.memory_usage == 0.0
    assert metrics.uptime_seconds == 0.0
    assert metrics.requests_processed == 0
    assert metrics.errors_count == 0
    assert metrics.custom == {}


def test_agent_metrics_with_values():
    """Test AgentMetrics correctly stores provided values."""
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
async def test_mutx_agent_client_heartbeat_requires_registration():
    """Test that heartbeat raises error when agent is not registered."""
    client = MutxAgentClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        await client.heartbeat()


def test_mutx_agent_sync_client_requires_registration_for_heartbeat():
    """Test that sync heartbeat raises error when agent is not registered."""
    client = MutxAgentSyncClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        client.heartbeat()


def test_mutx_agent_sync_client_requires_registration_for_metrics():
    """Test that sync report_metrics raises error when agent is not registered."""
    client = MutxAgentSyncClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        client.report_metrics()


def test_mutx_agent_sync_client_requires_registration_for_log():
    """Test that sync log raises error when agent is not registered."""
    client = MutxAgentSyncClient(mutx_url="https://api.test")

    with pytest.raises(ValueError, match="not registered"):
        client.log(level="info", message="test")


def test_mutx_agent_client_is_registered_property():
    """Test is_registered property tracks registration state."""
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client.is_registered is False

    client._registered = True
    assert client.is_registered is True


def test_mutx_agent_sync_client_is_registered_property():
    """Test sync client is_registered property tracks registration state."""
    client = MutxAgentSyncClient(mutx_url="https://api.test")
    assert client.is_registered is False

    client._registered = True
    assert client.is_registered is True


def test_mutx_agent_client_uptime_property():
    """Test uptime property returns non-negative value."""
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client.uptime >= 0


def test_mutx_agent_client_increment_requests():
    """Test increment_requests tracks request count."""
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client._requests_processed == 0

    client.increment_requests()
    assert client._requests_processed == 1

    client.increment_requests()
    assert client._requests_processed == 2


def test_mutx_agent_client_increment_errors():
    """Test increment_errors tracks error count."""
    client = MutxAgentClient(mutx_url="https://api.test")
    assert client._errors_count == 0

    client.increment_errors()
    assert client._errors_count == 1


@pytest.mark.asyncio
async def test_create_agent_client_registers_new_agent():
    """Test create_agent_client helper creates and registers an agent."""
    agent_id = str(uuid.uuid4())
    api_key = "mutx_agent_" + uuid.uuid4().hex

    async def mock_post(*args, **kwargs):
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: _agent_info_response(agent_id=agent_id, api_key=api_key)
        return response

    with patch("mutx.agent_runtime.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.post = mock_post
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_instance.headers = {}

        with patch("mutx.agent_runtime.MutxAgentClient._get_client", return_value=mock_instance):
            client = await create_agent_client(mutx_url="https://api.test", agent_name="new-agent")

    assert client.agent_id == agent_id
    assert client.api_key == api_key
