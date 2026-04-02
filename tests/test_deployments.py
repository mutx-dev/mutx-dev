"""Pytest coverage for sdk/mutx/deployments.py."""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path
from typing import Any

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.deployments import (
    Deployment,
    DeploymentEvent,
    DeploymentEventHistory,
    Deployments,
    _parse_datetime,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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
        "events": [],
    }
    payload.update(overrides)
    return payload


def _event_payload(deployment_id: uuid.UUID, **overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "deployment_id": str(deployment_id),
        "event_type": "scale",
        "status": "running",
        "node_id": "node-1",
        "error_message": None,
        "created_at": "2026-03-12T10:00:00Z",
    }
    payload.update(overrides)
    return payload


def _event_history_payload(deployment_id: uuid.UUID, **overrides: Any) -> dict[str, Any]:
    payload = {
        "deployment_id": str(deployment_id),
        "deployment_status": "running",
        "items": [_event_payload(deployment_id)],
        "total": 1,
        "skip": 0,
        "limit": 100,
        "event_type": None,
        "status": None,
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# _parse_datetime
# ---------------------------------------------------------------------------


class TestParseDatetime:
    def test_none_returns_none(self) -> None:
        assert _parse_datetime(None) is None

    def test_naive_iso_string(self) -> None:
        dt = _parse_datetime("2026-03-12T09:05:00")
        assert dt is not None
        assert dt.year == 2026
        assert dt.month == 3
        assert dt.day == 12
        assert dt.hour == 9
        assert dt.minute == 5
        assert dt.second == 0

    def test_z_suffix_parsed_as_utc(self) -> None:
        dt = _parse_datetime("2026-03-12T09:05:00Z")
        assert dt is not None
        assert dt.tzinfo is not None  # UTC

    def test_iso_with_offset(self) -> None:
        dt = _parse_datetime("2026-03-12T09:05:00+05:00")
        assert dt is not None
        assert dt.tzinfo is not None


# ---------------------------------------------------------------------------
# DeploymentEvent
# ---------------------------------------------------------------------------


class TestDeploymentEvent:
    def test_parses_all_fields(self) -> None:
        dep_id = uuid.uuid4()
        event_id = uuid.uuid4()
        data = _event_payload(dep_id, id=str(event_id))

        event = DeploymentEvent(data)

        assert event.id == event_id
        assert event.deployment_id == dep_id
        assert event.event_type == "scale"
        assert event.status == "running"
        assert event.node_id == "node-1"
        assert event.error_message is None
        assert event.created_at is not None
        assert event._data == data

    def test_optional_fields_missing(self) -> None:
        dep_id = uuid.uuid4()
        data = {
            "id": str(uuid.uuid4()),
            "deployment_id": str(dep_id),
            "event_type": "restart",
            "status": "pending",
            "created_at": "2026-03-12T10:00:00",
        }

        event = DeploymentEvent(data)

        assert event.node_id is None
        assert event.error_message is None


# ---------------------------------------------------------------------------
# DeploymentEventHistory
# ---------------------------------------------------------------------------


class TestDeploymentEventHistory:
    def test_parses_items_and_pagination(self) -> None:
        dep_id = uuid.uuid4()
        payload = _event_history_payload(
            dep_id,
            total=42,
            skip=10,
            limit=25,
            event_type="restart",
            status="failed",
        )

        history = DeploymentEventHistory(payload)

        assert history.deployment_id == dep_id
        assert history.deployment_status == "running"
        assert history.total == 42
        assert history.skip == 10
        assert history.limit == 25
        assert history.event_type == "restart"
        assert history.status == "failed"
        assert len(history.items) == 1
        assert isinstance(history.items[0].id, uuid.UUID)

    def test_empty_items_list(self) -> None:
        dep_id = uuid.uuid4()
        payload = _event_history_payload(dep_id, items=[], total=0)

        history = DeploymentEventHistory(payload)

        assert history.items == []
        assert history.total == 0


# ---------------------------------------------------------------------------
# Deployment
# ---------------------------------------------------------------------------


class TestDeployment:
    def test_repr(self) -> None:
        dep_id = uuid.uuid4()
        agent_id = uuid.uuid4()
        payload = _deployment_payload(id=str(dep_id), agent_id=str(agent_id), status="running")

        deployment = Deployment(payload)

        assert repr(deployment) == f"Deployment(id={dep_id}, agent_id={agent_id}, status=running)"

    def test_parses_nested_events(self) -> None:
        dep_id = uuid.uuid4()
        event_id = uuid.uuid4()
        payload = _deployment_payload(
            id=str(dep_id),
            events=[
                _event_payload(dep_id, id=str(event_id), event_type="create"),
            ],
        )

        deployment = Deployment(payload)

        assert len(deployment.events) == 1
        assert deployment.events[0].event_type == "create"
        assert deployment.events[0].id == event_id

    def test_optional_fields_missing(self) -> None:
        dep_id = uuid.uuid4()
        payload = {
            "id": str(dep_id),
            "agent_id": str(uuid.uuid4()),
            "status": "pending",
            "replicas": 2,
        }

        deployment = Deployment(payload)

        assert deployment.node_id is None
        assert deployment.started_at is None
        assert deployment.ended_at is None
        assert deployment.error_message is None
        assert deployment.events == []

    def test_ended_at_with_z_suffix(self) -> None:
        dep_id = uuid.uuid4()
        payload = _deployment_payload(
            id=str(dep_id),
            started_at="2026-03-12T09:00:00Z",
            ended_at="2026-03-12T09:30:00Z",
        )

        deployment = Deployment(payload)

        assert deployment.started_at is not None
        assert deployment.started_at.tzinfo is not None
        assert deployment.ended_at is not None
        assert deployment.ended_at.tzinfo is not None

    def test_data_preserved(self) -> None:
        payload = _deployment_payload()
        deployment = Deployment(payload)
        assert deployment._data == payload


# ---------------------------------------------------------------------------
# Deployments – client-type guards
# ---------------------------------------------------------------------------


class TestDeploymentsClientTypeGuards:
    def test_sync_create_raises_on_async_client(self) -> None:
        # AsyncClient doesn't support sync __enter__/__exit__, so instantiate without ctx manager.
        client = httpx.AsyncClient(base_url="https://api.test")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            Deployments(client).create(uuid.uuid4())

    @pytest.mark.asyncio
    async def test_async_acreate_raises_on_sync_client(self) -> None:
        with httpx.Client(base_url="https://api.test") as client:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await Deployments(client).acreate(uuid.uuid4())

    def test_sync_create_for_agent_raises_on_async_client(self) -> None:
        client = httpx.AsyncClient(base_url="https://api.test")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            Deployments(client).create_for_agent(uuid.uuid4())

    @pytest.mark.asyncio
    async def test_async_acreate_for_agent_raises_on_sync_client(self) -> None:
        with httpx.Client(base_url="https://api.test") as client:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await Deployments(client).acreate_for_agent(uuid.uuid4())

    def test_sync_list_raises_on_async_client(self) -> None:
        client = httpx.AsyncClient(base_url="https://api.test")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            Deployments(client).list()

    @pytest.mark.asyncio
    async def test_async_alist_raises_on_sync_client(self) -> None:
        with httpx.Client(base_url="https://api.test") as client:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await Deployments(client).alist()

    def test_sync_get_raises_on_async_client(self) -> None:
        client = httpx.AsyncClient(base_url="https://api.test")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            Deployments(client).get(uuid.uuid4())

    @pytest.mark.asyncio
    async def test_async_aget_raises_on_sync_client(self) -> None:
        with httpx.Client(base_url="https://api.test") as client:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await Deployments(client).aget(uuid.uuid4())

    def test_sync_scale_raises_on_async_client(self) -> None:
        client = httpx.AsyncClient(base_url="https://api.test")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            Deployments(client).scale(uuid.uuid4(), replicas=2)

    @pytest.mark.asyncio
    async def test_async_ascale_raises_on_sync_client(self) -> None:
        with httpx.Client(base_url="https://api.test") as client:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await Deployments(client).ascale(uuid.uuid4(), replicas=2)

    def test_sync_delete_raises_on_async_client(self) -> None:
        client = httpx.AsyncClient(base_url="https://api.test")
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            Deployments(client).delete(uuid.uuid4())

    @pytest.mark.asyncio
    async def test_async_adelete_raises_on_sync_client(self) -> None:
        with httpx.Client(base_url="https://api.test") as client:
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                await Deployments(client).adelete(uuid.uuid4())


# ---------------------------------------------------------------------------
# Deployments – create_for_agent / acreate_for_agent
# ---------------------------------------------------------------------------


def test_create_for_agent_hits_legacy_route() -> None:
    agent_id = uuid.uuid4()
    deployment_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json={"deployment_id": deployment_id, "status": "pending"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Deployments(client).create_for_agent(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}/deploy"
    assert result["deployment_id"] == deployment_id
    assert result["status"] == "pending"


@pytest.mark.asyncio
async def test_acreate_for_agent_hits_legacy_route() -> None:
    agent_id = uuid.uuid4()
    deployment_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json={"deployment_id": deployment_id, "status": "running"})

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Deployments(client).acreate_for_agent(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}/deploy"
    assert result["deployment_id"] == deployment_id
    assert result["status"] == "running"


# ---------------------------------------------------------------------------
# Deployments – list / alist
# ---------------------------------------------------------------------------


def test_list_without_filters() -> None:
    dep_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_deployment_payload(id=str(dep_id))])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        results = Deployments(client).list()

    assert captured["path"] == "/v1/deployments"
    assert captured["query"] == {"skip": "0", "limit": "50"}
    assert len(results) == 1
    assert results[0].id == dep_id


def test_list_with_agent_id_and_status_filters() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        results = Deployments(client).list(skip=5, limit=20, agent_id=agent_id, status="running")

    assert captured["path"] == "/v1/deployments"
    assert captured["query"] == {
        "skip": "5",
        "limit": "20",
        "agent_id": str(agent_id),
        "status": "running",
    }
    assert results == []


@pytest.mark.asyncio
async def test_alist_without_filters() -> None:
    dep_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_deployment_payload(id=str(dep_id), status="stopped")])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        results = await Deployments(client).alist()

    assert captured["path"] == "/v1/deployments"
    assert captured["query"] == {"skip": "0", "limit": "50"}
    assert len(results) == 1
    assert results[0].status == "stopped"


# ---------------------------------------------------------------------------
# Deployments – get / aget
# ---------------------------------------------------------------------------


def test_get_hits_correct_route() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_deployment_payload(id=str(deployment_id), status="running"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        deployment = Deployments(client).get(deployment_id)

    assert captured["path"] == f"/v1/deployments/{deployment_id}"
    assert deployment.id == deployment_id
    assert deployment.status == "running"


@pytest.mark.asyncio
async def test_aget_hits_correct_route() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_deployment_payload(id=str(deployment_id), status="stopped"))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        deployment = await Deployments(client).aget(deployment_id)

    assert captured["path"] == f"/v1/deployments/{deployment_id}"
    assert deployment.id == deployment_id
    assert deployment.status == "stopped"


# ---------------------------------------------------------------------------
# Deployments – scale / ascale
# ---------------------------------------------------------------------------


def test_scale_hits_correct_route_and_body() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(200, json=_deployment_payload(id=str(deployment_id), replicas=5))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        deployment = Deployments(client).scale(deployment_id, replicas=5)

    assert captured["path"] == f"/v1/deployments/{deployment_id}/scale"
    assert json.loads(captured["body"]) == {"replicas": 5}
    assert deployment.replicas == 5


@pytest.mark.asyncio
async def test_ascale_hits_correct_route_and_body() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(200, json=_deployment_payload(id=str(deployment_id), replicas=3))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        deployment = await Deployments(client).ascale(deployment_id, replicas=3)

    assert captured["path"] == f"/v1/deployments/{deployment_id}/scale"
    assert json.loads(captured["body"]) == {"replicas": 3}
    assert deployment.replicas == 3


# ---------------------------------------------------------------------------
# Deployments – delete / adelete
# ---------------------------------------------------------------------------


def test_delete_hits_correct_route() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Deployments(client).delete(deployment_id)

    assert captured["path"] == f"/v1/deployments/{deployment_id}"
    assert captured["method"] == "DELETE"


@pytest.mark.asyncio
async def test_adelete_hits_correct_route() -> None:
    deployment_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        await Deployments(client).adelete(deployment_id)

    assert captured["path"] == f"/v1/deployments/{deployment_id}"
    assert captured["method"] == "DELETE"


# ---------------------------------------------------------------------------
# Deployments – raise_for_status coverage
# ---------------------------------------------------------------------------


def test_create_raises_on_error_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"detail": "Unauthorized"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(httpx.HTTPStatusError):
            Deployments(client).create(uuid.uuid4())


def test_list_raises_on_error_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "Internal error"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(httpx.HTTPStatusError):
            Deployments(client).list()


def test_delete_raises_on_error_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "Not found"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(httpx.HTTPStatusError):
            Deployments(client).delete(uuid.uuid4())


def test_logs_raises_on_error_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"detail": "Forbidden"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(httpx.HTTPStatusError):
            Deployments(client).logs(uuid.uuid4())


def test_metrics_raises_on_error_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"detail": "Forbidden"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(httpx.HTTPStatusError):
            Deployments(client).metrics(uuid.uuid4())
