"""Tests for governance_supervision module."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.governance_supervision import (
    GovernanceSupervision,
    LaunchProfile,
    SupervisedAgent,
)


class TestSupervisedAgent:
    def test_init_full_data(self):
        data = {
            "agent_id": "agent-abc",
            "status": "running",
            "pid": 12345,
            "started_at": "2024-01-15T10:30:00Z",
            "restart_count": 2,
        }
        agent = SupervisedAgent(data)
        assert agent.agent_id == "agent-abc"
        assert agent.status == "running"
        assert agent.pid == 12345
        assert agent.started_at == "2024-01-15T10:30:00Z"
        assert agent.restart_count == 2

    def test_init_missing_fields(self):
        data = {}
        agent = SupervisedAgent(data)
        assert agent.agent_id == ""
        assert agent.status == ""
        assert agent.pid is None
        assert agent.started_at is None
        assert agent.restart_count == 0

    def test_repr(self):
        data = {"agent_id": "test-agent", "status": "idle"}
        agent = SupervisedAgent(data)
        r = repr(agent)
        assert "test-agent" in r
        assert "idle" in r


class TestLaunchProfile:
    def test_init_full_data(self):
        data = {
            "name": "prod-agent",
            "command": ["/usr/bin/python", "agent.py"],
            "env_keys": ["API_KEY", "DB_URL"],
            "faramesh_policy": "strict",
        }
        profile = LaunchProfile(data)
        assert profile.name == "prod-agent"
        assert profile.command == ["/usr/bin/python", "agent.py"]
        assert profile.env_keys == ["API_KEY", "DB_URL"]
        assert profile.faram_mesh_policy == "strict"

    def test_init_missing_env_keys(self):
        data = {
            "name": "simple",
            "command": ["echo", "hello"],
        }
        profile = LaunchProfile(data)
        assert profile.env_keys == []


class TestGovernanceSupervision:
    def test_init_sync(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert gs._client is client

    def test_init_async(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert gs._client is client

    def test_require_sync_client_raises_on_async(self):
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.list_agents()

    def test_require_async_client_raises_on_sync(self):
        sync_client = httpx.Client()
        gs = GovernanceSupervision(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gs.alist_agents())

    def test_list_agents_method_exists(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert callable(gs.list_agents)

    def test_alist_agents_method_exists(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert callable(gs.alist_agents)

    def test_list_agents_returns_agents(self):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"agent_id": "a1", "status": "running"},
            {"agent_id": "a2", "status": "stopped"},
        ]
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        result = gs.list_agents()

        assert len(result) == 2
        assert isinstance(result[0], SupervisedAgent)
        assert result[0].agent_id == "a1"
        assert result[1].status == "stopped"

    def test_list_profiles_method_exists(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert callable(gs.list_profiles)

    def test_alist_profiles_method_exists(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert callable(gs.alist_profiles)

    def test_get_agent_method_exists(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert callable(gs.get_agent)

    def test_aget_agent_method_exists(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert callable(gs.aget_agent)

    def test_start_agent_method_exists(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert callable(gs.start_agent)

    def test_astart_agent_method_exists(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert callable(gs.astart_agent)

    def test_start_agent_requires_sync_client(self):
        async_client = httpx.AsyncClient()
        gs = GovernanceSupervision(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            gs.start_agent("agent-1", ["echo", "hello"])

    def test_astart_agent_requires_async_client(self):
        sync_client = httpx.Client()
        gs = GovernanceSupervision(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(gs.astart_agent("agent-1", ["echo", "hello"]))

    def test_stop_agent_method_exists(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert callable(gs.stop_agent)

    def test_astop_agent_method_exists(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert callable(gs.astop_agent)

    def test_restart_agent_method_exists(self):
        client = httpx.Client()
        gs = GovernanceSupervision(client)
        assert callable(gs.restart_agent)

    def test_arestart_agent_method_exists(self):
        client = httpx.AsyncClient()
        gs = GovernanceSupervision(client)
        assert callable(gs.arestart_agent)

    def test_list_profiles_returns_profiles(self):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"name": "profile-1", "command": ["python", "agent.py"]},
        ]
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        result = gs.list_profiles()

        assert len(result) == 1
        assert isinstance(result[0], LaunchProfile)
        assert result[0].name == "profile-1"

    def test_start_agent_with_optional_params(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"agent_id": "a1", "status": "starting"}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        gs = GovernanceSupervision(mock_client)
        result = gs.start_agent(
            agent_id="a1",
            command=["python", "agent.py"],
            profile="prod",
            env={"KEY": "val"},
            faramesh_policy="strict",
        )

        assert isinstance(result, SupervisedAgent)
        mock_client.post.assert_called_once()
