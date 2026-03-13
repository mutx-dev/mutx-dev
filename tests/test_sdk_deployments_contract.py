from __future__ import annotations

import sys
import uuid
from pathlib import Path
from typing import Any

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.deployments import Deployment, Deployments


def _deployment_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "replicas": 1,
        "node_id": "node-1",
        "started_at": "2026-03-12T09:05:00",
        "ended_at": None,
        "error_message": None,
    }
    payload.update(overrides)
    return payload


def _event_history_payload(deployment_id: uuid.UUID, **overrides: Any) -> dict[str, Any]:
    payload = {
        "deployment_id": str(deployment_id),
        "deployment_status": "running",
        "items": [
            {
                "id": str(uuid.uuid4()),
                "deployment_id": str(deployment_id),
                "event_type": "scale",
                "status": "running",
                "node_id": "node-1",
                "error_message": None,
                "created_at": "2026-03-12T10:00:00",
            }
        ],
        "total": 1,
        "skip": 0,
        "limit": 100,
        "event_type": None,
        "status": None,
    }
    payload.update(overrides)
    return payload


def test_deployments_events_hits_contract_route_and_maps_payload() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(
            200,
            json=_event_history_payload(
                deployment_id,
                deployment_status="failed",
                event_type="restart",
                status="failed",
            ),
        )

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        history = Deployments(client).events(
            deployment_id,
            skip=3,
            limit=25,
            event_type="restart",
            status="failed",
        )

    assert captured["path"] == f"/deployments/{deployment_id}/events"
    assert captured["query"] == {
        "skip": "3",
        "limit": "25",
        "event_type": "restart",
        "status": "failed",
    }
    assert history.deployment_id == deployment_id
    assert history.deployment_status == "failed"
    assert history.total == 1
    assert history.items[0].event_type == "scale"


@pytest.mark.asyncio
async def test_deployments_aevents_hits_contract_route_and_maps_payload() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=_event_history_payload(deployment_id))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        history = await Deployments(client).aevents(deployment_id, skip=1, limit=10)

    assert captured["path"] == f"/deployments/{deployment_id}/events"
    assert captured["query"] == {"skip": "1", "limit": "10"}
    assert history.deployment_id == deployment_id
    assert history.items[0].status == "running"


def test_deployment_parser_accepts_nullable_started_at_and_nested_events() -> None:
    deployment_id = uuid.uuid4()
    payload = _deployment_payload(
        id=str(deployment_id),
        started_at=None,
        events=[
            {
                "id": str(uuid.uuid4()),
                "deployment_id": str(deployment_id),
                "event_type": "create",
                "status": "pending",
                "node_id": None,
                "error_message": None,
                "created_at": "2026-03-12T09:00:00",
            }
        ],
    )

    deployment = Deployment(payload)

    assert deployment.started_at is None
    assert len(deployment.events) == 1
    assert deployment.events[0].event_type == "create"


def test_deployments_logs_support_level_filter_param() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        payload = Deployments(client).logs(deployment_id, skip=2, limit=50, level="ERROR")

    assert payload == []
    assert captured["path"] == f"/deployments/{deployment_id}/logs"
    assert captured["query"] == {"skip": "2", "limit": "50", "level": "ERROR"}


@pytest.mark.asyncio
async def test_deployments_alogs_support_level_filter_param() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        payload = await Deployments(client).alogs(deployment_id, skip=4, limit=75, level="INFO")

    assert payload == []
    assert captured["path"] == f"/deployments/{deployment_id}/logs"
    assert captured["query"] == {"skip": "4", "limit": "75", "level": "INFO"}
