"""
SDK contract tests for ingest module.
Tests verify that the SDK correctly maps to the backend /ingest API contract.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

import httpx
import pytest

from mutx.ingest import Ingest


def _agent_status_response(**overrides: Any) -> dict[str, Any]:
    return {
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "node_id": None,
        "error_message": None,
        "timestamp": "2026-04-03T00:00:00",
        **overrides,
    }


def _deployment_response(**overrides: Any) -> dict[str, Any]:
    return {
        "deployment_id": str(uuid.uuid4()),
        "event": "created",
        "status": "pending",
        "node_id": None,
        "error_message": None,
        "timestamp": "2026-04-03T00:00:00",
        **overrides,
    }


def _metrics_response(**overrides: Any) -> dict[str, Any]:
    return {
        "agent_id": str(uuid.uuid4()),
        "cpu_usage": 0.45,
        "memory_usage": 1024.0,
        "timestamp": "2026-04-03T00:00:00",
        **overrides,
    }


# ─── report_agent_status ───────────────────────────────────────────────────────


def test_report_agent_status_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_agent_status(agent_id=agent_id, status="running")

    assert captured["path"] == "/ingest/agent-status"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["status"] == "running"
    assert isinstance(result, dict)


def test_report_agent_status_includes_optional_node_id() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_agent_status(agent_id=agent_id, status="error", node_id="node-42")

    assert captured["json"]["node_id"] == "node-42"


def test_report_agent_status_includes_optional_error_message() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_agent_status(agent_id=agent_id, status="error", error_message="OOM killed")

    assert captured["json"]["error_message"] == "OOM killed"


def test_report_agent_status_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        ingest.report_agent_status(agent_id=str(uuid.uuid4()), status="running")


# ─── areport_agent_status ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_areport_agent_status_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_status_response(agent_id=agent_id))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        result = await Ingest(client).areport_agent_status(agent_id=agent_id, status="idle")

    assert captured["path"] == "/ingest/agent-status"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["status"] == "idle"
    assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_areport_agent_status_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        await ingest.areport_agent_status(agent_id=str(uuid.uuid4()), status="running")


# ─── report_deployment_event ──────────────────────────────────────────────────


def test_report_deployment_event_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    deployment_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_response(deployment_id=deployment_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_deployment_event(deployment_id=deployment_id, event="created")

    assert captured["path"] == "/ingest/deployment"
    assert captured["json"]["deployment_id"] == deployment_id
    assert captured["json"]["event"] == "created"
    assert isinstance(result, dict)


def test_report_deployment_event_includes_optional_status() -> None:
    captured: dict[str, Any] = {}
    deployment_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_response(deployment_id=deployment_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_deployment_event(
        deployment_id=deployment_id, event="healthy", status="running"
    )

    assert captured["json"]["status"] == "running"


def test_report_deployment_event_includes_optional_node_id_and_error_message() -> None:
    captured: dict[str, Any] = {}
    deployment_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_response(deployment_id=deployment_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_deployment_event(
        deployment_id=deployment_id,
        event="failed",
        node_id="node-7",
        error_message="health check timeout",
    )

    assert captured["json"]["node_id"] == "node-7"
    assert captured["json"]["error_message"] == "health check timeout"


def test_report_deployment_event_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        ingest.report_deployment_event(deployment_id=str(uuid.uuid4()), event="created")


# ─── areport_deployment_event ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_areport_deployment_event_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    deployment_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_deployment_response(deployment_id=deployment_id))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        result = await Ingest(client).areport_deployment_event(
            deployment_id=deployment_id, event="starting"
        )

    assert captured["path"] == "/ingest/deployment"
    assert captured["json"]["deployment_id"] == deployment_id
    assert captured["json"]["event"] == "starting"
    assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_areport_deployment_event_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        await ingest.areport_deployment_event(
            deployment_id=str(uuid.uuid4()), event="created"
        )


# ─── report_metrics ───────────────────────────────────────────────────────────


def test_report_metrics_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    result = ingest.report_metrics(agent_id=agent_id, cpu_usage=0.75, memory_usage=2048.0)

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["cpu_usage"] == 0.75
    assert captured["json"]["memory_usage"] == 2048.0
    assert isinstance(result, dict)


def test_report_metrics_omits_null_optional_fields() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    ingest = Ingest(client)

    ingest.report_metrics(agent_id=agent_id)

    assert "cpu_usage" not in captured["json"]
    assert "memory_usage" not in captured["json"]


def test_report_metrics_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        ingest.report_metrics(agent_id=str(uuid.uuid4()))


# ─── areport_metrics ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_areport_metrics_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_metrics_response(agent_id=agent_id))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        result = await Ingest(client).areport_metrics(
            agent_id=agent_id, cpu_usage=0.33, memory_usage=512.0
        )

    assert captured["path"] == "/ingest/metrics"
    assert captured["json"]["agent_id"] == agent_id
    assert captured["json"]["cpu_usage"] == 0.33
    assert captured["json"]["memory_usage"] == 512.0
    assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_areport_metrics_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        await ingest.areport_metrics(agent_id=str(uuid.uuid4()))


# ─── Ingest class ──────────────────────────────────────────────────────────────


def test_ingest_init_accepts_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    ingest = Ingest(client)
    assert ingest._client is client


def test_ingest_init_accepts_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    ingest = Ingest(client)
    assert ingest._client is client
