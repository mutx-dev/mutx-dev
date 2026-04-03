# SDK contract tests for governance supervision module

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from mutx.governance_supervision import (
    GovernanceSupervision,
    LaunchProfile,
    SupervisedAgent,
)


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def _agent_payload(**overrides):
    payload = {
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "pid": 12345,
        "started_at": "2026-01-01T00:00:00Z",
        "restart_count": 0,
    }
    payload.update(overrides)
    return payload


def _profile_payload(**overrides):
    payload = {
        "name": "default",
        "command": ["python", "-m", "mutx.agent"],
        "env_keys": ["API_KEY", "MUTX_URL"],
        "faram_mesh_policy": "strict",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# SupervisedAgent tests
# ---------------------------------------------------------------------------

def test_supervised_agent_parses_response():
    payload = _agent_payload(status="idle", pid=None, restart_count=2)
    agent = SupervisedAgent(payload)

    assert agent.agent_id == payload["agent_id"]
    assert agent.status == "idle"
    assert agent.pid is None
    assert agent.started_at == payload["started_at"]
    assert agent.restart_count == 2
    assert agent._data == payload


def test_supervised_agent_repr():
    payload = _agent_payload(agent_id="test-123", status="stopped")
    agent = SupervisedAgent(payload)

    assert "test-123" in repr(agent)
    assert "stopped" in repr(agent)


def test_supervised_agent_defaults():
    agent = SupervisedAgent({})

    assert agent.agent_id == ""
    assert agent.status == ""
    assert agent.pid is None
    assert agent.restart_count == 0
    assert agent.started_at is None


# ---------------------------------------------------------------------------
# LaunchProfile tests
# ---------------------------------------------------------------------------

def test_launch_profile_parses_response():
    payload = _profile_payload(name="prod-agent", faram_mesh_policy=None)
    profile = LaunchProfile(payload)

    assert profile.name == "prod-agent"
    assert profile.command == ["python", "-m", "mutx.agent"]
    assert profile.env_keys == ["API_KEY", "MUTX_URL"]
    assert profile.faram_mesh_policy is None
    assert profile._data == payload


def test_launch_profile_defaults():
    payload = {"name": "minimal", "command": ["echo", "hello"]}
    profile = LaunchProfile(payload)

    assert profile.name == "minimal"
    assert profile.command == ["echo", "hello"]
    assert profile.env_keys == []
    assert profile.faram_mesh_policy is None


# ---------------------------------------------------------------------------
# GovernanceSupervision — sync client enforcement
# ---------------------------------------------------------------------------

def test_list_agents_requires_sync_client():
    async_client = AsyncMock(spec=httpx.AsyncClient)
    resource = GovernanceSupervision(async_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        resource.list_agents()


@pytest.mark.asyncio
async def test_alist_agents_requires_async_client():
    sync_client = httpx.Client(base_url="https://api.test")
    resource = GovernanceSupervision(sync_client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await resource.alist_agents()


def test_list_profiles_requires_sync_client():
    async_client = AsyncMock(spec=httpx.AsyncClient)
    resource = GovernanceSupervision(async_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        resource.list_profiles()


def test_get_agent_requires_sync_client():
    async_client = AsyncMock(spec=httpx.AsyncClient)
    resource = GovernanceSupervision(async_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        resource.get_agent("any-id")


def test_start_agent_requires_sync_client():
    async_client = AsyncMock(spec=httpx.AsyncClient)
    resource = GovernanceSupervision(async_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        resource.start_agent("id", ["echo"])


def test_stop_agent_requires_sync_client():
    async_client = AsyncMock(spec=httpx.AsyncClient)
    resource = GovernanceSupervision(async_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        resource.stop_agent("id")


def test_restart_agent_requires_sync_client():
    async_client = AsyncMock(spec=httpx.AsyncClient)
    resource = GovernanceSupervision(async_client)

    with pytest.raises(RuntimeError, match="sync httpx.Client"):
        resource.restart_agent("id")


# ---------------------------------------------------------------------------
# GovernanceSupervision.list_agents — sync
# ---------------------------------------------------------------------------

def test_list_agents_hits_correct_route_and_returns_typed_list():
    captured = {}
    agents = [_agent_payload(), _agent_payload(status="stopped")]

    def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = httpx.Response(200, json=agents)
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.get = mock_get

    resource = GovernanceSupervision(mock_client)
    result = resource.list_agents()

    assert captured["path"] == "/runtime/governance/supervised/"
    assert isinstance(result, list)
    assert all(isinstance(a, SupervisedAgent) for a in result)
    assert len(result) == 2


# ---------------------------------------------------------------------------
# GovernanceSupervision.alist_agents — async
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_alist_agents_hits_correct_route():
    captured = {}
    agents = [_agent_payload()]

    async def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: agents
        return response

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get = mock_get

    resource = GovernanceSupervision(mock_client)
    result = await resource.alist_agents()

    assert captured["path"] == "/runtime/governance/supervised/"
    assert isinstance(result, list)
    assert all(isinstance(a, SupervisedAgent) for a in result)


# ---------------------------------------------------------------------------
# GovernanceSupervision.list_profiles — sync
# ---------------------------------------------------------------------------

def test_list_profiles_hits_correct_route_and_returns_typed_list():
    captured = {}
    profiles = [_profile_payload(name="default"), _profile_payload(name="debug")]

    def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = httpx.Response(200, json=profiles)
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.get = mock_get

    resource = GovernanceSupervision(mock_client)
    result = resource.list_profiles()

    assert captured["path"] == "/runtime/governance/supervised/profiles"
    assert isinstance(result, list)
    assert all(isinstance(p, LaunchProfile) for p in result)
    assert len(result) == 2
    assert result[0].name == "default"
    assert result[1].name == "debug"


# ---------------------------------------------------------------------------
# GovernanceSupervision.alist_profiles — async
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_alist_profiles_hits_correct_route():
    captured = {}
    profiles = [_profile_payload(name="prod")]

    async def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: profiles
        return response

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get = mock_get

    resource = GovernanceSupervision(mock_client)
    result = await resource.alist_profiles()

    assert captured["path"] == "/runtime/governance/supervised/profiles"
    assert isinstance(result, list)
    assert all(isinstance(p, LaunchProfile) for p in result)


# ---------------------------------------------------------------------------
# GovernanceSupervision.get_agent — sync
# ---------------------------------------------------------------------------

def test_get_agent_hits_correct_route_and_returns_typed_agent():
    captured = {}
    agent_id = str(uuid.uuid4())
    payload = _agent_payload(agent_id=agent_id, status="running")

    def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = httpx.Response(200, json=payload)
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.get = mock_get

    resource = GovernanceSupervision(mock_client)
    result = resource.get_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}"
    assert isinstance(result, SupervisedAgent)
    assert result.agent_id == agent_id
    assert result.status == "running"


# ---------------------------------------------------------------------------
# GovernanceSupervision.aget_agent — async
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aget_agent_hits_correct_route():
    captured = {}
    agent_id = str(uuid.uuid4())
    payload = _agent_payload(agent_id=agent_id)

    async def mock_get(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: payload
        return response

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get = mock_get

    resource = GovernanceSupervision(mock_client)
    result = await resource.aget_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}"
    assert isinstance(result, SupervisedAgent)


# ---------------------------------------------------------------------------
# GovernanceSupervision.start_agent — sync
# ---------------------------------------------------------------------------

def test_start_agent_hits_correct_route_with_full_payload():
    captured = {}
    agent_id = str(uuid.uuid4())
    payload = _agent_payload(agent_id=agent_id)

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json=payload)
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    result = resource.start_agent(
        agent_id=agent_id,
        command=["python", "agent.py"],
        profile="default",
        env={"KEY": "value"},
        faramesh_policy="strict",
    )

    assert captured["path"] == "/runtime/governance/supervised/start"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["command"] == ["python", "agent.py"]
    assert captured["json"]["profile"] == "default"
    assert captured["json"]["env"] == {"KEY": "value"}
    assert captured["json"]["faramesh_policy"] == "strict"
    assert isinstance(result, SupervisedAgent)


def test_start_agent_omits_optional_fields_when_not_provided():
    captured = {}

    def mock_post(*args, **kwargs):
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json=_agent_payload())
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    resource.start_agent(agent_id="minimal-agent", command=["echo", "hi"])

    # Only required fields should be present
    assert captured["json"]["agent_id"] == "minimal-agent"
    assert captured["json"]["command"] == ["echo", "hi"]
    assert "profile" not in captured["json"]
    assert "env" not in captured["json"]
    assert "faramesh_policy" not in captured["json"]


# ---------------------------------------------------------------------------
# GovernanceSupervision.astart_agent — async
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_astart_agent_hits_correct_route():
    captured = {}
    payload = _agent_payload()

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: payload
        return response

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    result = await resource.astart_agent(
        agent_id="async-agent", command=["python", "agent.py"]
    )

    assert captured["path"] == "/runtime/governance/supervised/start"
    assert isinstance(result, SupervisedAgent)


# ---------------------------------------------------------------------------
# GovernanceSupervision.stop_agent — sync
# ---------------------------------------------------------------------------

def test_stop_agent_hits_correct_route_with_custom_timeout():
    captured = {}
    agent_id = str(uuid.uuid4())

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json={"status": "stopped"})
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    result = resource.stop_agent(agent_id=agent_id, timeout=30.0)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/stop"
    assert captured["json"]["timeout"] == 30.0
    assert isinstance(result, dict)
    assert result["status"] == "stopped"


def test_stop_agent_uses_default_timeout():
    captured = {}

    def mock_post(*args, **kwargs):
        captured["json"] = kwargs.get("json", {})
        response = httpx.Response(200, json={"status": "ok"})
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    resource.stop_agent(agent_id="test")

    assert captured["json"]["timeout"] == 10.0


# ---------------------------------------------------------------------------
# GovernanceSupervision.astop_agent — async
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_astop_agent_hits_correct_route():
    captured = {}

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        captured["json"] = kwargs.get("json", {})
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: {"status": "stopped"}
        return response

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    result = await resource.astop_agent(agent_id="async-stop", timeout=5.0)

    assert captured["path"] == "/runtime/governance/supervised/async-stop/stop"
    assert captured["json"]["timeout"] == 5.0
    assert isinstance(result, dict)


# ---------------------------------------------------------------------------
# GovernanceSupervision.restart_agent — sync
# ---------------------------------------------------------------------------

def test_restart_agent_hits_correct_route_and_returns_typed_agent():
    captured = {}
    agent_id = str(uuid.uuid4())
    payload = _agent_payload(agent_id=agent_id, restart_count=1)

    def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = httpx.Response(200, json=payload)
        response.raise_for_status = lambda: None
        return response

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    result = resource.restart_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/restart"
    assert isinstance(result, SupervisedAgent)
    assert result.restart_count == 1


# ---------------------------------------------------------------------------
# GovernanceSupervision.arestart_agent — async
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_arestart_agent_hits_correct_route():
    captured = {}
    agent_id = str(uuid.uuid4())
    payload = _agent_payload(agent_id=agent_id)

    async def mock_post(*args, **kwargs):
        captured["path"] = args[1] if len(args) > 1 else args[0]
        response = AsyncMock()
        response.raise_for_status = lambda: None
        response.json = lambda: payload
        return response

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.post = mock_post

    resource = GovernanceSupervision(mock_client)
    result = await resource.arestart_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/restart"
    assert isinstance(result, SupervisedAgent)
