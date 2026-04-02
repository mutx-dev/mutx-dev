"""
Unit tests for the GovernanceSupervision SDK module.

Tests cover:
- SupervisedAgent and LaunchProfile data classes
- GovernanceSupervision sync methods (list_agents, list_profiles, get_agent, start_agent, stop_agent, restart_agent)
- GovernanceSupervision async methods (alist_agents, alist_profiles, aget_agent, astart_agent, astop_agent, arestart_agent)
- Client type enforcement (_require_sync_client, _require_async_client)
- Error handling (HTTP status raised via raise_for_status)
"""

from __future__ import annotations

import sys
import uuid
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.governance_supervision import (
    GovernanceSupervision,
    LaunchProfile,
    SupervisedAgent,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _supervised_agent_payload(**overrides: Any) -> dict[str, Any]:
    """Minimal valid payload for SupervisedAgent."""
    payload = {
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "pid": 12345,
        "started_at": "2026-04-02T10:00:00Z",
        "restart_count": 0,
    }
    payload.update(overrides)
    return payload


def _launch_profile_payload(**overrides: Any) -> dict[str, Any]:
    """Minimal valid payload for LaunchProfile (requires name + command)."""
    payload = {
        "name": "default-profile",
        "command": ["python", "agent.py"],
        "env_keys": ["OPENAI_API_KEY"],
        "faramesh_policy": "strict",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# SupervisedAgent
# ---------------------------------------------------------------------------

class TestSupervisedAgent:
    def test_parses_required_fields(self) -> None:
        payload = _supervised_agent_payload()
        agent = SupervisedAgent(payload)

        assert agent.agent_id == payload["agent_id"]
        assert agent.status == payload["status"]
        assert agent.pid == payload["pid"]
        assert agent.started_at == payload["started_at"]
        assert agent.restart_count == payload["restart_count"]

    def test_defaults_when_fields_missing(self) -> None:
        agent = SupervisedAgent({"agent_id": "test-123", "status": "stopped"})

        assert agent.agent_id == "test-123"
        assert agent.status == "stopped"
        assert agent.pid is None
        assert agent.started_at is None
        assert agent.restart_count == 0

    def test_repr(self) -> None:
        agent = SupervisedAgent(_supervised_agent_payload(agent_id="agent-x", status="running"))
        r = repr(agent)
        assert "agent-x" in r
        assert "running" in r

    def test_stores_raw_data(self) -> None:
        payload = _supervised_agent_payload()
        agent = SupervisedAgent(payload)
        assert agent._data == payload


# ---------------------------------------------------------------------------
# LaunchProfile
# ---------------------------------------------------------------------------

class TestLaunchProfile:
    def test_parses_required_fields(self) -> None:
        payload = _launch_profile_payload()
        profile = LaunchProfile(payload)

        assert profile.name == payload["name"]
        assert profile.command == payload["command"]
        assert profile.env_keys == payload["env_keys"]
        assert profile.faram_mesh_policy == payload["faramesh_policy"]

    def test_requires_name_and_command(self) -> None:
        # name is required
        with pytest.raises(KeyError):
            LaunchProfile({"command": ["python", "agent.py"]})

        # command is required
        with pytest.raises(KeyError):
            LaunchProfile({"name": "profile"})

    def test_optional_fields_default(self) -> None:
        profile = LaunchProfile({"name": "profile", "command": ["python", "agent.py"]})
        assert profile.env_keys == []
        assert profile.faram_mesh_policy is None

    def test_stores_raw_data(self) -> None:
        payload = _launch_profile_payload()
        profile = LaunchProfile(payload)
        assert profile._data == payload


# ---------------------------------------------------------------------------
# GovernanceSupervision — client type enforcement (sync methods on async client)
# ---------------------------------------------------------------------------

class TestGovernanceSupervisionSyncOnAsyncClient:
    def test_list_agents_raises_on_async_client(self) -> None:
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.list_agents()
        # clean up the coroutine from the failed check
        async_client.aclose()

    def test_list_profiles_raises_on_async_client(self) -> None:
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.list_profiles()
        async_client.aclose()

    def test_get_agent_raises_on_async_client(self) -> None:
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.get_agent("agent-1")
        async_client.aclose()

    def test_start_agent_raises_on_async_client(self) -> None:
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.start_agent("agent-1", ["python", "main.py"])
        async_client.aclose()

    def test_stop_agent_raises_on_async_client(self) -> None:
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.stop_agent("agent-1")
        async_client.aclose()

    def test_restart_agent_raises_on_async_client(self) -> None:
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.restart_agent("agent-1")
        async_client.aclose()


# ---------------------------------------------------------------------------
# GovernanceSupervision — sync methods (mocked httpx.Client)
# ---------------------------------------------------------------------------

class TestGovernanceSupervisionSync:
    def test_list_agents_returns_agents(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = [
            _supervised_agent_payload(agent_id="agent-1"),
            _supervised_agent_payload(agent_id="agent-2"),
        ]

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agents = gs.list_agents()

        assert len(agents) == 2
        assert agents[0].agent_id == "agent-1"
        assert agents[1].agent_id == "agent-2"
        mock_client.get.assert_called_once_with("/runtime/governance/supervised/")

    def test_list_agents_raises_on_error(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server error",
            request=MagicMock(),
            response=MagicMock(status_code=500),
        )

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        with pytest.raises(httpx.HTTPStatusError):
            gs.list_agents()

    def test_list_profiles_returns_profiles(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = [
            _launch_profile_payload(name="profile-a"),
            _launch_profile_payload(name="profile-b"),
        ]

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        profiles = gs.list_profiles()

        assert len(profiles) == 2
        assert profiles[0].name == "profile-a"
        assert profiles[1].name == "profile-b"
        mock_client.get.assert_called_once_with("/runtime/governance/supervised/profiles")

    def test_get_agent_returns_agent(self) -> None:
        agent_id = "test-agent-99"
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload(agent_id=agent_id)

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agent = gs.get_agent(agent_id)

        assert agent.agent_id == agent_id
        mock_client.get.assert_called_once_with(f"/runtime/governance/supervised/{agent_id}")

    def test_start_agent_basic(self) -> None:
        agent_id = "new-agent"
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload(agent_id=agent_id, status="starting")

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agent = gs.start_agent(agent_id, ["python", "main.py"])

        assert agent.agent_id == agent_id
        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["agent_id"] == agent_id
        assert call_kwargs["json"]["command"] == ["python", "main.py"]

    def test_start_agent_with_profile(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload()

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        gs.start_agent("agent-1", ["python", "main.py"], profile="my-profile")

        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["profile"] == "my-profile"

    def test_start_agent_with_env(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload()

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        gs.start_agent("agent-1", ["python", "main.py"], env={"DEBUG": "1"})

        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["env"] == {"DEBUG": "1"}

    def test_start_agent_with_faramesh_policy(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload()

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        gs.start_agent("agent-1", ["python", "main.py"], faramesh_policy="strict")

        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["faramesh_policy"] == "strict"

    def test_stop_agent_returns_dict(self) -> None:
        agent_id = "running-agent"
        mock_response = MagicMock()
        mock_response.json.return_value = {"agent_id": agent_id, "stopped": True}

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        result = gs.stop_agent(agent_id, timeout=5.0)

        assert result["agent_id"] == agent_id
        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["timeout"] == 5.0

    def test_stop_agent_default_timeout(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = {}

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        gs.stop_agent("agent-1")

        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["timeout"] == 10.0

    def test_restart_agent_returns_agent(self) -> None:
        agent_id = "agent-to-restart"
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload(agent_id=agent_id, status="running")

        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agent = gs.restart_agent(agent_id)

        assert agent.agent_id == agent_id
        mock_client.post.assert_called_once_with(f"/runtime/governance/supervised/{agent_id}/restart")


# ---------------------------------------------------------------------------
# GovernanceSupervision — async methods (mocked httpx.AsyncClient)
# ---------------------------------------------------------------------------

class TestGovernanceSupervisionAsync:
    @pytest.mark.asyncio
    async def test_alist_agents_returns_agents(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = [
            _supervised_agent_payload(agent_id="async-agent-1"),
            _supervised_agent_payload(agent_id="async-agent-2"),
        ]

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agents = await gs.alist_agents()

        assert len(agents) == 2
        assert agents[0].agent_id == "async-agent-1"
        assert agents[1].agent_id == "async-agent-2"
        mock_client.get.assert_called_once_with("/runtime/governance/supervised/")

    @pytest.mark.asyncio
    async def test_alist_agents_raises_on_error(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server error",
            request=MagicMock(),
            response=MagicMock(status_code=500),
        )

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        with pytest.raises(httpx.HTTPStatusError):
            await gs.alist_agents()

    @pytest.mark.asyncio
    async def test_alist_profiles_returns_profiles(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = [
            _launch_profile_payload(name="async-profile"),
        ]

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        profiles = await gs.alist_profiles()

        assert len(profiles) == 1
        assert profiles[0].name == "async-profile"
        mock_client.get.assert_called_once_with("/runtime/governance/supervised/profiles")

    @pytest.mark.asyncio
    async def test_aget_agent_returns_agent(self) -> None:
        agent_id = "async-test-agent"
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload(agent_id=agent_id)

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agent = await gs.aget_agent(agent_id)

        assert agent.agent_id == agent_id
        mock_client.get.assert_called_once_with(f"/runtime/governance/supervised/{agent_id}")

    @pytest.mark.asyncio
    async def test_astart_agent_basic(self) -> None:
        agent_id = "async-new-agent"
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload(agent_id=agent_id, status="starting")

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agent = await gs.astart_agent(agent_id, ["python", "main.py"])

        assert agent.agent_id == agent_id
        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["agent_id"] == agent_id
        assert call_kwargs["json"]["command"] == ["python", "main.py"]

    @pytest.mark.asyncio
    async def test_astart_agent_with_all_options(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload()

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        await gs.astart_agent(
            "agent-1",
            ["python", "main.py"],
            profile="async-profile",
            env={"KEY": "value"},
            faramesh_policy="strict",
        )

        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["profile"] == "async-profile"
        assert call_kwargs["json"]["env"] == {"KEY": "value"}
        assert call_kwargs["json"]["faramesh_policy"] == "strict"

    @pytest.mark.asyncio
    async def test_astop_agent_returns_dict(self) -> None:
        agent_id = "async-running-agent"
        mock_response = MagicMock()
        mock_response.json.return_value = {"agent_id": agent_id, "stopped": True}

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        result = await gs.astop_agent(agent_id, timeout=3.0)

        assert result["agent_id"] == agent_id
        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["timeout"] == 3.0

    @pytest.mark.asyncio
    async def test_astop_agent_default_timeout(self) -> None:
        mock_response = MagicMock()
        mock_response.json.return_value = {}

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        await gs.astop_agent("agent-1")

        call_kwargs = mock_client.post.call_args.kwargs
        assert call_kwargs["json"]["timeout"] == 10.0

    @pytest.mark.asyncio
    async def test_arestart_agent_returns_agent(self) -> None:
        agent_id = "async-agent-to-restart"
        mock_response = MagicMock()
        mock_response.json.return_value = _supervised_agent_payload(agent_id=agent_id, status="running")

        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        agent = await gs.arestart_agent(agent_id)

        assert agent.agent_id == agent_id
        mock_client.post.assert_called_once_with(f"/runtime/governance/supervised/{agent_id}/restart")