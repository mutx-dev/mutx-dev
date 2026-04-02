"""Contract tests for sdk/mutx/ingest.py."""

from __future__ import annotations

import json
import uuid
from typing import Any

import httpx
import pytest

from mutx.ingest import Ingest


def _agent_status_response(agent_id: str | None = None, **overrides: Any) -> dict[str, Any]:
    payload = {
        "agent_id": agent_id or str(uuid.uuid4()),
        "status": "running",
        "recorded_at": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _deployment_event_response(deployment_id: str | None = None, **overrides: Any) -> dict[str, Any]:
    payload = {
        "deployment_id": deployment_id or str(uuid.uuid4()),
        "event": "started",
        "recorded_at": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _metrics_response(agent_id: str | None = None, **overrides: Any) -> dict[str, Any]:
    payload = {
        "agent_id": agent_id or str(uuid.uuid4()),
        "recorded_at": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


# -------------------------------------------------------------------------- #
# Sync method tests
# -------------------------------------------------------------------------- #

def test_report_agent_status_minimal() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_agent_status(agent_id="agent-123", status="running")

    assert captured["path"] == "/ingest/agent-status"
    assert captured["json"]["agent_id"] == "agent-123"
    assert captured["json"]["status"] == "running"
    assert "node_id" not in captured["json"]
    assert "error_message" not in captured["json"]
    assert result["agent_id"] == captured["json"]["agent_id"]


def test_report_agent_status_with_optional_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_agent_status(
        agent_id="agent-456",
        status="error",
        node_id="node-x",
        error_message="out of memory",
    )

    assert captured["path"] == "/ingest/agent-status"
    assert captured["json"]["agent_id"] == "agent-456"
    assert captured["json"]["status"] == "error"
    assert captured["json"]["node_id"] == "node-x"
    assert captured["json"]["error_message"] == "out of memory"
    assert result["status"] == "running"


def test_report_deployment_event_minimal() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_event_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_deployment_event(deployment_id="deploy-789", event="started")

    assert captured["path"] == "/ingest/deployment"
    assert captured["json"]["deployment_id"] == "deploy-789"
    assert captured["json"]["event"] == "started"
    assert "status" not in captured["json"]
    assert "node_id" not in captured["json"]
    assert "error_message" not in captured["json"]
    assert result["deployment_id"] == captured["json"]["deployment_id"]


def test_report_deployment_event_with_optional_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_event_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_deployment_event(
        deployment_id="deploy-abc",
        event="failed",
        status="stopped",
        node_id="node-y",
        error_message="crashed",
    )

    assert captured["path"] == "/ingest/deployment"
    assert captured["json"]["deployment_id"] == "deploy-abc"
    assert captured["json"]["event"] == "failed"
    assert captured["json"]["status"] == "stopped"
    assert captured["json"]["node_id"] == "node-y"
    assert captured["json"]["error_message"] == "crashed"
    assert result["event"] == "started"


def test_report_metrics_minimal() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_metrics(agent_id="agent-metrics-1")

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["agent_id"] == "agent-metrics-1"
    assert "cpu_usage" not in captured["json"]
    assert "memory_usage" not in captured["json"]
    assert result["agent_id"] == captured["json"]["agent_id"]


def test_report_metrics_with_cpu_and_memory() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_metrics(
        agent_id="agent-metrics-2",
        cpu_usage=45.5,
        memory_usage=1024.0,
    )

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["agent_id"] == "agent-metrics-2"
    assert captured["json"]["cpu_usage"] == 45.5
    assert captured["json"]["memory_usage"] == 1024.0
    assert result["agent_id"] == "agent-metrics-2"


def test_report_metrics_cpu_only() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_metrics(agent_id="agent-cpu", cpu_usage=80.0)

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["cpu_usage"] == 80.0
    assert "memory_usage" not in captured["json"]
    assert result["agent_id"] == "agent-cpu"


def test_report_metrics_memory_only() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_metrics(agent_id="agent-mem", memory_usage=512.0)

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["memory_usage"] == 512.0
    assert "cpu_usage" not in captured["json"]
    assert result["agent_id"] == "agent-mem"


# -------------------------------------------------------------------------- #
# Async method tests
# -------------------------------------------------------------------------- #

@pytest.mark.asyncio
async def test_areport_agent_status_minimal() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)
        result = await ingest.areport_agent_status(agent_id="async-agent-1", status="idle")

    assert captured["path"] == "/ingest/agent-status"
    assert captured["json"]["agent_id"] == "async-agent-1"
    assert captured["json"]["status"] == "idle"


@pytest.mark.asyncio
async def test_areport_agent_status_with_optional_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)
        result = await ingest.areport_agent_status(
            agent_id="async-agent-2",
            status="stopped",
            node_id="async-node",
            error_message="killed",
        )

    assert captured["path"] == "/ingest/agent-status"
    assert captured["json"]["node_id"] == "async-node"
    assert captured["json"]["error_message"] == "killed"
    assert result["status"] == "running"


@pytest.mark.asyncio
async def test_areport_deployment_event_minimal() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_event_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)
        result = await ingest.areport_deployment_event(deployment_id="async-deploy-1", event="healthy")

    assert captured["path"] == "/ingest/deployment"
    assert captured["json"]["deployment_id"] == "async-deploy-1"
    assert captured["json"]["event"] == "healthy"


@pytest.mark.asyncio
async def test_areport_deployment_event_with_optional_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_event_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)
        result = await ingest.areport_deployment_event(
            deployment_id="async-deploy-2",
            event="failed",
            status="dead",
            node_id="async-node-2",
            error_message="oom",
        )

    assert captured["path"] == "/ingest/deployment"
    assert captured["json"]["status"] == "dead"
    assert captured["json"]["node_id"] == "async-node-2"
    assert captured["json"]["error_message"] == "oom"
    assert result["event"] == "started"


@pytest.mark.asyncio
async def test_areport_metrics_minimal() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)
        result = await ingest.areport_metrics(agent_id="async-metrics-1")

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["agent_id"] == "async-metrics-1"
    assert "cpu_usage" not in captured["json"]
    assert "memory_usage" not in captured["json"]


@pytest.mark.asyncio
async def test_areport_metrics_with_both_values() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)
        result = await ingest.areport_metrics(
            agent_id="async-metrics-2",
            cpu_usage=99.9,
            memory_usage=2048.5,
        )

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["cpu_usage"] == 99.9
    assert captured["json"]["memory_usage"] == 2048.5
    assert result["agent_id"] == "async-metrics-2"


# -------------------------------------------------------------------------- #
# Client-type validation tests
# -------------------------------------------------------------------------- #

@pytest.mark.asyncio
async def test_sync_methods_reject_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_status_response())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        ingest = Ingest(client)

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_agent_status(agent_id="test", status="running")

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_deployment_event(deployment_id="test", event="started")

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            ingest.report_metrics(agent_id="test")


@pytest.mark.asyncio
async def test_async_methods_reject_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_status_response())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await ingest.areport_agent_status(agent_id="test", status="running")

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await ingest.areport_deployment_event(deployment_id="test", event="started")

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await ingest.areport_metrics(agent_id="test")
