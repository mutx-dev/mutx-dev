"""
SDK contract tests for ingest module.
Tests verify that the SDK correctly maps to the backend /ingest API contract.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import httpx
import pytest

from mutx.ingest import Ingest


# ------------------------------------------------------------------
# report_agent_status — sync
# ------------------------------------------------------------------

def test_report_agent_status_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "updated"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_agent_status(agent_id="agent-123", status="running")

    assert captured["path"] == "/ingest/agent-status"
    assert captured["method"] == "POST"
    assert captured["json"]["agent_id"] == "agent-123"
    assert captured["json"]["status"] == "running"
    assert "node_id" not in captured["json"]
    assert "error_message" not in captured["json"]


def test_report_agent_status_includes_optional_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "updated"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_agent_status(
        agent_id="agent-456",
        status="error",
        node_id="node-1",
        error_message="OOM killed",
    )

    assert captured["json"]["agent_id"] == "agent-456"
    assert captured["json"]["status"] == "error"
    assert captured["json"]["node_id"] == "node-1"
    assert captured["json"]["error_message"] == "OOM killed"


def test_report_agent_status_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        ingest.report_agent_status(agent_id="agent-123", status="running")


# ------------------------------------------------------------------
# areport_agent_status — async
# ------------------------------------------------------------------

def test_areport_agent_status_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "updated"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    asyncio.run(ingest.areport_agent_status(agent_id="agent-789", status="idle"))

    assert captured["path"] == "/ingest/agent-status"
    assert captured["method"] == "POST"
    assert captured["json"]["agent_id"] == "agent-789"
    assert captured["json"]["status"] == "idle"


def test_areport_agent_status_includes_optional_fields() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "updated"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    asyncio.run(
        ingest.areport_agent_status(
            agent_id="agent-abc",
            status="stopped",
            node_id="node-2",
            error_message="SIGTERM",
        )
    )

    assert captured["json"]["agent_id"] == "agent-abc"
    assert captured["json"]["status"] == "stopped"
    assert captured["json"]["node_id"] == "node-2"
    assert captured["json"]["error_message"] == "SIGTERM"


def test_areport_agent_status_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(ingest.areport_agent_status(agent_id="agent-123", status="running"))


# ------------------------------------------------------------------
# report_deployment_event — sync
# ------------------------------------------------------------------

def test_report_deployment_event_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "processed"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_deployment_event(deployment_id="deploy-123", event="created")

    assert captured["path"] == "/ingest/deployment"
    assert captured["method"] == "POST"
    assert captured["json"]["deployment_id"] == "deploy-123"
    assert captured["json"]["event"] == "created"
    assert "status" not in captured["json"]
    assert "node_id" not in captured["json"]
    assert "error_message" not in captured["json"]


def test_report_deployment_event_includes_all_optional_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "processed"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_deployment_event(
        deployment_id="deploy-456",
        event="failed",
        status="error",
        node_id="node-3",
        error_message="container exited",
    )

    assert captured["json"]["deployment_id"] == "deploy-456"
    assert captured["json"]["event"] == "failed"
    assert captured["json"]["status"] == "error"
    assert captured["json"]["node_id"] == "node-3"
    assert captured["json"]["error_message"] == "container exited"


def test_report_deployment_event_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        ingest.report_deployment_event(deployment_id="deploy-123", event="healthy")


# ------------------------------------------------------------------
# areport_deployment_event — async
# ------------------------------------------------------------------

def test_areport_deployment_event_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "processed"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    asyncio.run(ingest.areport_deployment_event(deployment_id="deploy-789", event="starting"))

    assert captured["path"] == "/ingest/deployment"
    assert captured["method"] == "POST"
    assert captured["json"]["deployment_id"] == "deploy-789"
    assert captured["json"]["event"] == "starting"


def test_areport_deployment_event_includes_all_optional_fields() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "processed"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    asyncio.run(
        ingest.areport_deployment_event(
            deployment_id="deploy-abc",
            event="healthy",
            status="running",
            node_id="node-4",
            error_message=None,
        )
    )

    assert captured["json"]["deployment_id"] == "deploy-abc"
    assert captured["json"]["event"] == "healthy"
    assert captured["json"]["status"] == "running"
    assert captured["json"]["node_id"] == "node-4"


def test_areport_deployment_event_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(ingest.areport_deployment_event(deployment_id="deploy-123", event="stopped"))


# ------------------------------------------------------------------
# report_metrics — sync
# ------------------------------------------------------------------

def test_report_metrics_hits_contract_route_with_all_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "recorded"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_metrics(agent_id="agent-metrics-1", cpu_usage=45.5, memory_usage=1024.0)

    assert captured["path"] == "/ingest/metrics"
    assert captured["method"] == "POST"
    assert captured["json"]["agent_id"] == "agent-metrics-1"
    assert captured["json"]["cpu_usage"] == 45.5
    assert captured["json"]["memory_usage"] == 1024.0


def test_report_metrics_omits_optional_fields_when_none() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "recorded"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_metrics(agent_id="agent-metrics-2")

    assert captured["json"]["agent_id"] == "agent-metrics-2"
    assert "cpu_usage" not in captured["json"]
    assert "memory_usage" not in captured["json"]


def test_report_metrics_omits_cpu_when_not_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "recorded"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_metrics(agent_id="agent-metrics-3", memory_usage=512.0)

    assert captured["json"]["agent_id"] == "agent-metrics-3"
    assert "cpu_usage" not in captured["json"]
    assert captured["json"]["memory_usage"] == 512.0


def test_report_metrics_omits_memory_when_not_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "recorded"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_metrics(agent_id="agent-metrics-4", cpu_usage=99.9)

    assert captured["json"]["agent_id"] == "agent-metrics-4"
    assert captured["json"]["cpu_usage"] == 99.9
    assert "memory_usage" not in captured["json"]


def test_report_metrics_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        ingest.report_metrics(agent_id="agent-123")


# ------------------------------------------------------------------
# areport_metrics — async
# ------------------------------------------------------------------

def test_areport_metrics_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "recorded"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    asyncio.run(ingest.areport_metrics(agent_id="agent-metrics-5", cpu_usage=10.0, memory_usage=256.0))

    assert captured["path"] == "/ingest/metrics"
    assert captured["method"] == "POST"
    assert captured["json"]["agent_id"] == "agent-metrics-5"
    assert captured["json"]["cpu_usage"] == 10.0
    assert captured["json"]["memory_usage"] == 256.0


def test_areport_metrics_omits_optional_fields_when_none() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"status": "recorded"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    asyncio.run(ingest.areport_metrics(agent_id="agent-metrics-6"))

    assert captured["json"]["agent_id"] == "agent-metrics-6"
    assert "cpu_usage" not in captured["json"]
    assert "memory_usage" not in captured["json"]


def test_areport_metrics_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(ingest.areport_metrics(agent_id="agent-123"))
