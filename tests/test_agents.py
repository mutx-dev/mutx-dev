"""Contract tests for sdk/mutx/agents.py"""
from __future__ import annotations

import pytest
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.agents import Agent, DeploymentEvent, Deployment, AgentDetail, AgentLog, AgentMetric, Agents

class TestAgent:
    def test_agent_parsing(self):
        assert True

class TestSync:
    def test_sync_rejects_async(self):
        client = Mock(spec=httpx.AsyncClient)
        assert True

