"""Tests for ingest module."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.ingest import Ingest


class TestIngest:
    def test_init_sync(self):
        client = httpx.Client()
        ingest = Ingest(client)
        assert ingest._client is client

    def test_init_async(self):
        client = httpx.AsyncClient()
        ingest = Ingest(client)
        assert ingest._client is client

    def test_require_sync_client_raises_on_async(self):
        async_client = httpx.AsyncClient()
        ingest = Ingest(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_agent_status("agent-1", "running")

    def test_require_async_client_raises_on_sync(self):
        sync_client = httpx.Client()
        ingest = Ingest(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ingest.areport_agent_status("agent-1", "running"))

    def test_report_agent_status_method_exists(self):
        client = httpx.Client()
        ingest = Ingest(client)
        assert callable(ingest.report_agent_status)

    def test_areport_agent_status_method_exists(self):
        client = httpx.AsyncClient()
        ingest = Ingest(client)
        assert callable(ingest.areport_agent_status)

    def test_report_agent_status_sync(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ingest = Ingest(mock_client)
        result = ingest.report_agent_status("agent-1", "running", node_id="node-1")

        assert result == {"ok": True}
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[0][0] == "/ingest/agent-status"
        assert call_args[1]["json"]["agent_id"] == "agent-1"
        assert call_args[1]["json"]["status"] == "running"

    def test_report_agent_status_with_error_message(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ingest = Ingest(mock_client)
        ingest.report_agent_status("agent-1", "error", error_message="crashed")

        call_args = mock_client.post.call_args
        assert call_args[1]["json"]["error_message"] == "crashed"

    def test_report_deployment_event_method_exists(self):
        client = httpx.Client()
        ingest = Ingest(client)
        assert callable(ingest.report_deployment_event)

    def test_areport_deployment_event_method_exists(self):
        client = httpx.AsyncClient()
        ingest = Ingest(client)
        assert callable(ingest.areport_deployment_event)

    def test_report_deployment_event_sync(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ingest = Ingest(mock_client)
        result = ingest.report_deployment_event("dep-1", "healthy")

        assert result == {"ok": True}
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[0][0] == "/ingest/deployment"
        assert call_args[1]["json"]["deployment_id"] == "dep-1"
        assert call_args[1]["json"]["event"] == "healthy"

    def test_report_metrics_method_exists(self):
        client = httpx.Client()
        ingest = Ingest(client)
        assert callable(ingest.report_metrics)

    def test_areport_metrics_method_exists(self):
        client = httpx.AsyncClient()
        ingest = Ingest(client)
        assert callable(ingest.areport_metrics)

    def test_report_metrics_sync(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ingest = Ingest(mock_client)
        result = ingest.report_metrics("agent-1", cpu_usage=45.5, memory_usage=1024.0)

        assert result == {"ok": True}
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[0][0] == "/ingest/metrics"
        assert call_args[1]["json"]["cpu_usage"] == 45.5
        assert call_args[1]["json"]["memory_usage"] == 1024.0

    def test_report_metrics_partial(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        ingest = Ingest(mock_client)
        ingest.report_metrics("agent-1", cpu_usage=50.0)

        call_args = mock_client.post.call_args
        assert "cpu_usage" in call_args[1]["json"]
        assert "memory_usage" not in call_args[1]["json"]

    def test_async_methods_require_async_client(self):
        sync_client = httpx.Client()
        ingest = Ingest(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ingest.areport_agent_status("agent-1", "running"))
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ingest.areport_deployment_event("dep-1", "started"))
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(ingest.areport_metrics("agent-1"))

    def test_sync_methods_require_sync_client(self):
        async_client = httpx.AsyncClient()
        ingest = Ingest(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_agent_status("agent-1", "running")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_deployment_event("dep-1", "started")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_metrics("agent-1")
