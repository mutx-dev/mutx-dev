"""Tests for deployments module."""

from __future__ import annotations

import asyncio
from datetime import datetime
from unittest.mock import MagicMock
from uuid import UUID, uuid4

import httpx
import pytest

from mutx.deployments import (
    Deployment,
    DeploymentEvent,
    DeploymentEventHistory,
    Deployments,
    _parse_datetime,
)


FIXTURE_DEP_ID = UUID("00000000-0000-0000-0000-000000000001")
FIXTURE_AGENT_ID = UUID("00000000-0000-0000-0000-000000000002")


class TestParseDatetime:
    def test_parse_datetime_returns_none_for_none(self):
        assert _parse_datetime(None) is None

    def test_parse_datetime_strips_z_suffix(self):
        result = _parse_datetime("2024-01-15T10:30:00Z")
        assert result is not None
        assert result.year == 2024
        assert result.month == 1
        assert result.day == 15

    def test_parse_datetime_regular_iso(self):
        result = _parse_datetime("2024-01-15T10:30:00+00:00")
        assert result is not None
        assert result.year == 2024


class TestDeploymentEvent:
    def test_init(self):
        data = {
            "id": str(FIXTURE_DEP_ID),
            "deployment_id": str(FIXTURE_AGENT_ID),
            "event_type": "started",
            "status": "ok",
            "node_id": "node-1",
            "error_message": None,
            "created_at": "2024-01-15T10:30:00Z",
        }
        event = DeploymentEvent(data)
        assert event.id == FIXTURE_DEP_ID
        assert event.deployment_id == FIXTURE_AGENT_ID
        assert event.event_type == "started"
        assert event.status == "ok"
        assert event.node_id == "node-1"


class TestDeploymentEventHistory:
    def test_init_empty_items(self):
        data = {
            "deployment_id": str(FIXTURE_DEP_ID),
            "deployment_status": "running",
            "items": [],
            "total": 0,
            "skip": 0,
            "limit": 50,
        }
        history = DeploymentEventHistory(data)
        assert history.deployment_id == FIXTURE_DEP_ID
        assert history.deployment_status == "running"
        assert history.items == []
        assert history.total == 0


class TestDeployment:
    def test_init(self):
        data = {
            "id": str(FIXTURE_DEP_ID),
            "agent_id": str(FIXTURE_AGENT_ID),
            "status": "running",
            "replicas": 2,
            "node_id": "node-1",
            "started_at": "2024-01-15T10:30:00Z",
            "ended_at": None,
            "error_message": None,
            "events": [],
        }
        dep = Deployment(data)
        assert dep.id == FIXTURE_DEP_ID
        assert dep.agent_id == FIXTURE_AGENT_ID
        assert dep.status == "running"
        assert dep.replicas == 2

    def test_repr(self):
        data = {
            "id": str(FIXTURE_DEP_ID),
            "agent_id": str(FIXTURE_AGENT_ID),
            "status": "running",
            "replicas": 1,
        }
        dep = Deployment(data)
        r = repr(dep)
        assert str(FIXTURE_DEP_ID) in r
        assert str(FIXTURE_AGENT_ID) in r
        assert "running" in r


class TestDeployments:
    def test_init_sync(self):
        client = httpx.Client()
        d = Deployments(client)
        assert d._client is client

    def test_init_async(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert d._client is client

    def test_require_sync_client_raises_on_async(self):
        async_client = httpx.AsyncClient()
        d = Deployments(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            d.create("agent-1")

    def test_require_async_client_raises_on_sync(self):
        sync_client = httpx.Client()
        d = Deployments(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(d.acreate("agent-1"))

    def test_create_returns_deployment(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": str(FIXTURE_DEP_ID),
            "agent_id": "00000000-0000-0000-0000-000000000099",
            "status": "starting",
            "replicas": 1,
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        d = Deployments(mock_client)
        result = d.create("agent-1")

        assert isinstance(result, Deployment)
        mock_client.post.assert_called_once()

    def test_create_for_agent_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.create_for_agent)

    def test_acreate_for_agent_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.acreate_for_agent)

    def test_list_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.list)

    def test_alist_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.alist)

    def test_get_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.get)

    def test_aget_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.aget)

    def test_events_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.events)

    def test_aevents_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.aevents)

    def test_scale_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.scale)

    def test_ascale_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.ascale)

    def test_restart_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.restart)

    def test_arestart_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.arestart)

    def test_delete_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.delete)

    def test_adelete_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.adelete)

    def test_logs_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.logs)

    def test_alogs_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.alogs)

    def test_metrics_method_exists(self):
        client = httpx.Client()
        d = Deployments(client)
        assert callable(d.metrics)

    def test_ametrics_method_exists(self):
        client = httpx.AsyncClient()
        d = Deployments(client)
        assert callable(d.ametrics)
