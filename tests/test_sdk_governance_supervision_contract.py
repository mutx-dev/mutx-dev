"""Contract tests for sdk/mutx/governance_supervision.py."""

from __future__ import annotations

import json
import uuid
from typing import Any

import httpx
import pytest

from mutx.governance_supervision import GovernanceSupervision, LaunchProfile, SupervisedAgent


# ---------------------------------------------------------------------------
# Payload helpers
# ---------------------------------------------------------------------------


def _agent_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "pid": 12345,
        "started_at": "2026-03-12T09:00:00",
        "restart_count": 0,
    }
    payload.update(overrides)
    return payload


def _profile_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "default",
        "command": ["python", "-m", "mutx.agent"],
        "env_keys": ["OPENAI_API_KEY"],
        "faramesh_policy": None,
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# SupervisedAgent parser tests
# ---------------------------------------------------------------------------


def test_supervised_agent_parser_maps_fields() -> None:
    payload = _agent_payload(status="running", pid=9999, restart_count=2)
    agent = SupervisedAgent(payload)

    assert agent.agent_id == payload["agent_id"]
    assert agent.status == "running"
    assert agent.pid == 9999
    assert agent.started_at == "2026-03-12T09:00:00"
    assert agent.restart_count == 2
    assert agent._data == payload


def test_supervised_agent_parser_handles_missing_nullable_fields() -> None:
    payload = _agent_payload(pid=None, started_at=None, restart_count=0)
    agent = SupervisedAgent(payload)

    assert agent.pid is None
    assert agent.started_at is None


def test_supervised_agent_parser_defaults_for_missing_fields() -> None:
    agent = SupervisedAgent({})

    assert agent.agent_id == ""
    assert agent.status == ""
    assert agent.pid is None
    assert agent.started_at is None
    assert agent.restart_count == 0


def test_supervised_agent_repr() -> None:
    agent = SupervisedAgent(_agent_payload(agent_id="agent-42", status="stopped"))
    assert "agent-42" in repr(agent)
    assert "stopped" in repr(agent)


# ---------------------------------------------------------------------------
# LaunchProfile parser tests
# ---------------------------------------------------------------------------


def test_launch_profile_parser_maps_fields() -> None:
    payload = _profile_payload(
        name="prod-agent",
        command=["/usr/bin/python", "run.py"],
        env_keys=["API_KEY", "SECRET"],
        faramesh_policy="strict",
    )
    profile = LaunchProfile(payload)

    assert profile.name == "prod-agent"
    assert profile.command == ["/usr/bin/python", "run.py"]
    assert profile.env_keys == ["API_KEY", "SECRET"]
    assert profile.faram_mesh_policy == "strict"
    assert profile._data == payload


def test_launch_profile_parser_requires_name_and_command() -> None:
    payload = _profile_payload()
    profile = LaunchProfile(payload)

    assert profile.name == "default"
    assert profile.command == ["python", "-m", "mutx.agent"]


# ---------------------------------------------------------------------------
# Sync list_agents tests
# ---------------------------------------------------------------------------


def test_list_agents_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_agent_payload(), _agent_payload(status="stopped")])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        agents = governance.list_agents()

    assert captured["path"] == "/runtime/governance/supervised/"
    assert len(agents) == 2
    assert agents[0].status == "running"
    assert agents[1].status == "stopped"


def test_list_agents_raises_on_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"detail": "unauthorized"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(httpx.HTTPStatusError):
            governance.list_agents()


# ---------------------------------------------------------------------------
# Async alist_agents tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_alist_agents_hits_correct_route() -> None:
    captured: dict[str, Any] = {}
    expected = _agent_payload()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[expected])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        agents = await governance.alist_agents()

    assert captured["path"] == "/runtime/governance/supervised/"
    assert len(agents) == 1
    assert agents[0].agent_id == expected["agent_id"]


# ---------------------------------------------------------------------------
# Sync list_profiles tests
# ---------------------------------------------------------------------------


def test_list_profiles_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_profile_payload(), _profile_payload(name="debug")])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        profiles = governance.list_profiles()

    assert captured["path"] == "/runtime/governance/supervised/profiles"
    assert len(profiles) == 2
    assert profiles[0].name == "default"
    assert profiles[1].name == "debug"


# ---------------------------------------------------------------------------
# Async alist_profiles tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_alist_profiles_hits_correct_route() -> None:
    captured: dict[str, Any] = {}
    expected = _profile_payload(name="async-profile")

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[expected])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        profiles = await governance.alist_profiles()

    assert captured["path"] == "/runtime/governance/supervised/profiles"
    assert len(profiles) == 1
    assert profiles[0].name == "async-profile"


# ---------------------------------------------------------------------------
# Sync get_agent tests
# ---------------------------------------------------------------------------


def test_get_agent_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_payload(agent_id=agent_id, status="running"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        agent = governance.get_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}"
    assert agent.agent_id == agent_id
    assert agent.status == "running"


# ---------------------------------------------------------------------------
# Async aget_agent tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_aget_agent_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_payload(agent_id=agent_id, status="stopped"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        agent = await governance.aget_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}"
    assert agent.agent_id == agent_id
    assert agent.status == "stopped"


# ---------------------------------------------------------------------------
# Sync start_agent tests
# ---------------------------------------------------------------------------


def test_start_agent_hits_correct_route_and_sends_payload() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_payload(agent_id=agent_id, status="running"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        agent = governance.start_agent(agent_id=agent_id, command=["python", "run.py"])

    assert captured["path"] == "/runtime/governance/supervised/start"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["command"] == ["python", "run.py"]
    assert "profile" not in captured["json"]
    assert agent.status == "running"


def test_start_agent_includes_optional_profile() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        governance.start_agent(agent_id="a1", command=["python"], profile="debug")

    assert captured["json"]["profile"] == "debug"


def test_start_agent_includes_optional_env() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        governance.start_agent(agent_id="a1", command=["python"], env={"KEY": "val"})

    assert captured["json"]["env"] == {"KEY": "val"}


def test_start_agent_includes_optional_faramesh_policy() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        governance.start_agent(agent_id="a1", command=["python"], faramesh_policy="strict")

    assert captured["json"]["faramesh_policy"] == "strict"


# ---------------------------------------------------------------------------
# Async astart_agent tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_astart_agent_hits_correct_route_and_sends_payload() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_payload(agent_id=agent_id, status="running"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        agent = await governance.astart_agent(
            agent_id=agent_id, command=["python", "async_run.py"]
        )

    assert captured["path"] == "/runtime/governance/supervised/start"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["command"] == ["python", "async_run.py"]
    assert agent.agent_id == agent_id


# ---------------------------------------------------------------------------
# Sync stop_agent tests
# ---------------------------------------------------------------------------


def test_stop_agent_hits_correct_route_and_sends_timeout() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "stopped", "agent_id": agent_id})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        result = governance.stop_agent(agent_id, timeout=5.0)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/stop"
    assert captured["json"]["timeout"] == 5.0
    assert result["status"] == "stopped"


def test_stop_agent_uses_default_timeout() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "stopped"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        governance.stop_agent(agent_id)

    assert captured["json"]["timeout"] == 10.0


# ---------------------------------------------------------------------------
# Async astop_agent tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_astop_agent_hits_correct_route_and_sends_timeout() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "stopped", "agent_id": agent_id})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        result = await governance.astop_agent(agent_id, timeout=3.5)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/stop"
    assert captured["json"]["timeout"] == 3.5
    assert result["status"] == "stopped"


# ---------------------------------------------------------------------------
# Sync restart_agent tests
# ---------------------------------------------------------------------------


def test_restart_agent_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_payload(agent_id=agent_id, status="running"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        agent = governance.restart_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/restart"
    assert agent.agent_id == agent_id
    assert agent.status == "running"


# ---------------------------------------------------------------------------
# Async arestart_agent tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_arestart_agent_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_payload(agent_id=agent_id, status="stopped"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        agent = await governance.arestart_agent(agent_id)

    assert captured["path"] == f"/runtime/governance/supervised/{agent_id}/restart"
    assert agent.agent_id == agent_id
    assert agent.status == "stopped"


# ---------------------------------------------------------------------------
# Client type enforcement tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sync_list_agents_raises_on_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            governance.list_agents()


@pytest.mark.asyncio
async def test_async_alist_agents_raises_on_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await governance.alist_agents()


@pytest.mark.asyncio
async def test_sync_list_profiles_raises_on_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            governance.list_profiles()


@pytest.mark.asyncio
async def test_sync_get_agent_raises_on_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            governance.get_agent("any-id")


@pytest.mark.asyncio
async def test_sync_start_agent_raises_on_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            governance.start_agent("any-id", command=["python"])


@pytest.mark.asyncio
async def test_sync_stop_agent_raises_on_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            governance.stop_agent("any-id")


@pytest.mark.asyncio
async def test_sync_restart_agent_raises_on_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            governance.restart_agent("any-id")


@pytest.mark.asyncio
async def test_async_aget_agent_raises_on_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await governance.aget_agent("any-id")


@pytest.mark.asyncio
async def test_async_astart_agent_raises_on_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await governance.astart_agent("any-id", command=["python"])


@pytest.mark.asyncio
async def test_async_astop_agent_raises_on_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await governance.astop_agent("any-id")


@pytest.mark.asyncio
async def test_async_arestart_agent_raises_on_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        governance = GovernanceSupervision(client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await governance.arestart_agent("any-id")
