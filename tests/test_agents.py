from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.agents import (
    Agent,
    AgentDetail,
    AgentLog,
    AgentMetric,
    Agents,
    Deployment,
    DeploymentEvent,
)


# ---------------------------------------------------------------------------
# Payload factories
# ---------------------------------------------------------------------------


def _agent_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-agent",
        "description": "A test agent",
        "status": "running",
        "config": '{"model": "gpt-4"}',
        "created_at": "2026-03-01T10:00:00",
        "updated_at": "2026-03-01T12:00:00",
        "user_id": str(uuid.uuid4()),
    }
    payload.update(overrides)
    return payload


def _deployment_payload(deployment_id: uuid.UUID | None = None, **overrides: Any) -> dict[str, Any]:
    deployment_id = deployment_id or uuid.uuid4()
    payload = {
        "id": str(deployment_id),
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "replicas": 1,
        "node_id": "node-1",
        "started_at": "2026-03-01T10:00:00",
        "ended_at": None,
        "error_message": None,
        "events": [],
    }
    payload.update(overrides)
    return payload


def _event_payload(deployment_id: uuid.UUID | None = None, **overrides: Any) -> dict[str, Any]:
    deployment_id = deployment_id or uuid.uuid4()
    payload = {
        "id": str(uuid.uuid4()),
        "deployment_id": str(deployment_id),
        "event_type": "scale",
        "status": "running",
        "node_id": "node-1",
        "error_message": None,
        "created_at": "2026-03-01T10:00:00",
    }
    payload.update(overrides)
    return payload


def _agent_detail_payload(agent_id: uuid.UUID | None = None, **overrides: Any) -> dict[str, Any]:
    deployment_id = uuid.uuid4()
    resolved_id = overrides.pop("id", None) or (str(agent_id) if agent_id else str(uuid.uuid4()))
    # Rebuild overrides without "id"; "deployments" is handled separately
    filtered = {k: v for k, v in overrides.items() if k != "deployments"}
    payload = _agent_payload(id=resolved_id, config='{"model": "gpt-4"}', **filtered)
    if "deployments" in overrides:
        payload["deployments"] = overrides["deployments"]
    else:
        payload["deployments"] = [_deployment_payload(deployment_id, agent_id=resolved_id)]
    return payload


def _log_payload(log_id: uuid.UUID | None = None, agent_id: uuid.UUID | None = None, **overrides: Any) -> dict[str, Any]:
    log_id = log_id or uuid.uuid4()
    agent_id = agent_id or uuid.uuid4()
    payload = {
        "id": str(log_id),
        "agent_id": str(agent_id),
        "level": "INFO",
        "message": "Agent started successfully",
        "timestamp": "2026-03-01T10:00:00",
        "extra_data": {"key": "value"},
        "metadata": {"key": "value"},
    }
    payload.update(overrides)
    return payload


def _metric_payload(metric_id: uuid.UUID | None = None, agent_id: uuid.UUID | None = None, **overrides: Any) -> dict[str, Any]:
    metric_id = metric_id or uuid.uuid4()
    agent_id = agent_id or uuid.uuid4()
    payload = {
        "id": str(metric_id),
        "agent_id": str(agent_id),
        "cpu_usage": 0.45,
        "memory_usage": 0.62,
        "timestamp": "2026-03-01T10:00:00",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Data-model unit tests
# ---------------------------------------------------------------------------


def test_agent_parser_maps_all_fields() -> None:
    agent_id = uuid.uuid4()
    user_id = uuid.uuid4()
    payload = _agent_payload(
        id=str(agent_id),
        user_id=str(user_id),
        description="My agent",
        status="idle",
        config='{"temperature": 0.7}',
    )

    agent = Agent(payload)

    assert agent.id == agent_id
    assert agent.name == "test-agent"
    assert agent.description == "My agent"
    assert agent.status == "idle"
    assert agent.config == {"temperature": 0.7}
    assert agent.user_id == str(user_id)
    assert agent.created_at == datetime(2026, 3, 1, 10, 0, 0)


def test_agent_parser_handles_missing_optional_fields() -> None:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "minimal-agent",
        "status": "running",
        "created_at": "2026-03-01T10:00:00",
        "updated_at": "2026-03-01T12:00:00",
    }

    agent = Agent(payload)

    assert agent.description is None
    assert agent.config_json is None
    assert agent.config is None
    assert agent.user_id is None


def test_agent_parse_config_returns_raw_when_not_a_string() -> None:
    agent = Agent(_agent_payload(config={"model": "gpt-4o"}))
    assert agent.config == {"model": "gpt-4o"}

    agent2 = Agent(_agent_payload(config=None))
    assert agent2.config is None

    agent3 = Agent(_agent_payload(config=123))
    assert agent3.config == 123


def test_agent_parse_config_falls_back_on_invalid_json() -> None:
    agent = Agent(_agent_payload(config="not valid json{"))
    assert agent.config == "not valid json{"


def test_agent_repr() -> None:
    agent = Agent(_agent_payload(name="repro-agent", status="stopped"))
    assert "repro-agent" in repr(agent)
    assert "stopped" in repr(agent)


def test_deployment_event_parser_maps_all_fields() -> None:
    deployment_id = uuid.uuid4()
    event_id = uuid.uuid4()
    payload = _event_payload(
        id=str(event_id),
        deployment_id=str(deployment_id),
        event_type="restart",
        status="failed",
        node_id="node-2",
        error_message="OOM",
    )

    event = DeploymentEvent(payload)

    assert event.id == event_id
    assert event.deployment_id == deployment_id
    assert event.event_type == "restart"
    assert event.status == "failed"
    assert event.node_id == "node-2"
    assert event.error_message == "OOM"


def test_deployment_parser_maps_all_fields() -> None:
    deployment_id = uuid.uuid4()
    agent_id = uuid.uuid4()
    event_id = uuid.uuid4()
    payload = _deployment_payload(
        id=str(deployment_id),
        agent_id=str(agent_id),
        status="stopped",
        replicas=3,
        node_id="node-5",
        started_at="2026-03-01T09:00:00",
        ended_at="2026-03-01T10:00:00",
        error_message="crash",
        events=[_event_payload(id=str(event_id), deployment_id=deployment_id)],
    )

    deployment = Deployment(payload)

    assert deployment.id == deployment_id
    assert deployment.agent_id == agent_id
    assert deployment.status == "stopped"
    assert deployment.replicas == 3
    assert deployment.node_id == "node-5"
    assert deployment.started_at == datetime(2026, 3, 1, 9, 0, 0)
    assert deployment.ended_at == datetime(2026, 3, 1, 10, 0, 0)
    assert deployment.error_message == "crash"
    assert len(deployment.events) == 1
    assert deployment.events[0].id == event_id


def test_deployment_parser_handles_nullable_timestamps() -> None:
    payload = _deployment_payload(started_at=None, ended_at=None)

    deployment = Deployment(payload)

    assert deployment.started_at is None
    assert deployment.ended_at is None


def test_agent_detail_inherits_from_agent() -> None:
    agent_id = uuid.uuid4()
    payload = _agent_detail_payload(id=str(agent_id))

    detail = AgentDetail(payload)

    assert detail.id == agent_id
    assert detail.name == "test-agent"
    assert isinstance(detail.deployments, list)


def test_agent_detail_aggregates_deployments() -> None:
    agent_id = uuid.uuid4()
    deployment_id = uuid.uuid4()
    payload = _agent_detail_payload(
        id=str(agent_id),
        deployments=[_deployment_payload(deployment_id, agent_id=str(agent_id))],
    )

    detail = AgentDetail(payload)

    assert len(detail.deployments) == 1
    assert detail.deployments[0].id == deployment_id


def test_agent_log_parser_maps_all_fields() -> None:
    log_id = uuid.uuid4()
    agent_id = uuid.uuid4()
    payload = _log_payload(
        id=str(log_id),
        agent_id=str(agent_id),
        level="ERROR",
        message="Out of memory",
        extra_data={"bytes": 1024},
        metadata={"trace": "abc"},
    )

    log = AgentLog(payload)

    assert log.id == log_id
    assert log.agent_id == agent_id
    assert log.level == "ERROR"
    assert log.message == "Out of memory"
    assert log.extra_data == {"bytes": 1024}
    assert log.metadata == {"trace": "abc"}


def test_agent_log_metadata_defaults_to_extra_data_when_missing() -> None:
    payload = _log_payload()
    del payload["metadata"]

    log = AgentLog(payload)

    assert log.metadata == log.extra_data


def test_agent_metric_parser_maps_all_fields() -> None:
    metric_id = uuid.uuid4()
    agent_id = uuid.uuid4()
    payload = _metric_payload(
        id=str(metric_id),
        agent_id=str(agent_id),
        cpu_usage=0.88,
        memory_usage=0.75,
    )

    metric = AgentMetric(payload)

    assert metric.id == metric_id
    assert metric.agent_id == agent_id
    assert metric.cpu_usage == 0.88
    assert metric.memory_usage == 0.75


def test_agent_metric_handles_missing_usage_fields() -> None:
    payload = _metric_payload(cpu_usage=None, memory_usage=None)

    metric = AgentMetric(payload)

    assert metric.cpu_usage is None
    assert metric.memory_usage is None


# ---------------------------------------------------------------------------
# Agents client – sync
# ---------------------------------------------------------------------------


def test_agents_create_hits_correct_route_and_payload() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(201, json=_agent_payload(name="my-agent"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        agent = Agents(client).create(
            name="my-agent",
            description="desc",
            type="anthropic",
            config={"model": "claude-3"},
        )

    assert captured["path"] == "/v1/agents"
    body = json.loads(captured["body"])
    assert body["name"] == "my-agent"
    assert body["description"] == "desc"
    assert body["type"] == "anthropic"
    assert body["config"] == {"model": "claude-3"}
    assert agent.name == "my-agent"


def test_agents_create_sends_config_as_string_when_passed_as_string() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.content.decode()
        return httpx.Response(201, json=_agent_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Agents(client).create(name="a", config='{"key": "val"}')

    body = json.loads(captured["body"])
    assert body["config"] == '{"key": "val"}'


def test_agents_list_hits_correct_route_and_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_agent_payload(), _agent_payload(name="agent-2")])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        agents = Agents(client).list(skip=5, limit=25)

    assert captured["path"] == "/v1/agents"
    assert captured["query"] == {"skip": "5", "limit": "25"}
    assert len(agents) == 2
    assert agents[1].name == "agent-2"


def test_agents_get_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_detail_payload(id=str(agent_id)))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        detail = Agents(client).get(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert detail.id == agent_id


def test_agents_get_accepts_string_id() -> None:
    agent_id = str(uuid.uuid4())
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(200, json=_agent_detail_payload(id=agent_id))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Agents(client).get(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}"


def test_agents_delete_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(204)

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Agents(client).delete(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}"


def test_agents_deploy_hits_correct_route_and_returns_json() -> None:
    agent_id = uuid.uuid4()
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(200, json={"deployment_id": str(uuid.uuid4()), "status": "deploying"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Agents(client).deploy(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}/deploy"
    assert result["status"] == "deploying"


def test_agents_stop_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(200, json={"status": "stopping"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Agents(client).stop(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}/stop"
    assert result["status"] == "stopping"


def test_agents_logs_hits_correct_route_and_params() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_log_payload(), _log_payload(level="WARN")])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        logs = Agents(client).logs(agent_id, skip=3, limit=50, level="INFO")

    assert captured["path"] == f"/v1/agents/{agent_id}/logs"
    assert captured["query"] == {"skip": "3", "limit": "50", "level": "INFO"}
    assert len(logs) == 2
    assert logs[0].level == "INFO"
    assert logs[1].level == "WARN"


def test_agents_metrics_hits_correct_route_and_params() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_metric_payload()])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        metrics = Agents(client).metrics(agent_id, skip=1, limit=10)

    assert captured["path"] == f"/v1/agents/{agent_id}/metrics"
    assert captured["query"] == {"skip": "1", "limit": "10"}
    assert len(metrics) == 1
    assert metrics[0].cpu_usage == 0.45


def test_agents_update_config_sends_dict_as_json_string() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(200, json=_agent_detail_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Agents(client).update_config(agent_id, config={"key": "val"})

    assert captured["path"] == f"/v1/agents/{agent_id}/config"
    body = json.loads(captured["body"])
    assert body["config"] == '{"key": "val"}'


def test_agents_update_config_passes_through_string_config() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.content.decode()
        return httpx.Response(200, json=_agent_detail_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Agents(client).update_config(agent_id, config='{"already": "string"}')

    body = json.loads(captured["body"])
    assert body["config"] == '{"already": "string"}'


def test_agents_stream_logs_calls_callback_and_yields() -> None:
    agent_id = uuid.uuid4()
    callback_calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[_log_payload(message="line-1"), _log_payload(message="line-2")])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        logs = list(
            Agents(client).stream_logs(
                agent_id, callback=lambda log: callback_calls.append(log.message), level="DEBUG"
            )
        )

    assert len(logs) == 2
    assert callback_calls == ["line-1", "line-2"]


def test_agents_sync_methods_raise_when_client_is_async() -> None:
    async def _make_async_client():
        return httpx.AsyncClient(base_url="https://api.test")

    import asyncio

    async def run():
        async with httpx.AsyncClient(base_url="https://api.test") as client:
            agents = Agents(client)
            with pytest.raises(RuntimeError, match="sync"):
                agents.create(name="x")

    asyncio.run(run())


# ---------------------------------------------------------------------------
# Agents client – async
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agents_acreate_hits_correct_route_and_payload() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(201, json=_agent_payload(name="async-agent"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        agent = await Agents(client).acreate(
            name="async-agent",
            description="async desc",
            type="openai",
            config={"model": "gpt-4"},
        )

    assert captured["path"] == "/v1/agents"
    body = json.loads(captured["body"])
    assert body["name"] == "async-agent"
    assert body["description"] == "async desc"
    assert agent.name == "async-agent"


@pytest.mark.asyncio
async def test_agents_alist_hits_correct_route_and_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_agent_payload(name="a1"), _agent_payload(name="a2")])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        agents = await Agents(client).alist(skip=2, limit=10)

    assert captured["path"] == "/v1/agents"
    assert captured["query"] == {"skip": "2", "limit": "10"}
    assert len(agents) == 2


@pytest.mark.asyncio
async def test_agents_aget_hits_correct_route() -> None:
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_agent_detail_payload(id=str(agent_id)))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        detail = await Agents(client).aget(agent_id)

    assert detail.id == agent_id


@pytest.mark.asyncio
async def test_agents_adelete_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(204)

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        await Agents(client).adelete(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}"


@pytest.mark.asyncio
async def test_agents_adeploy_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(200, json={"status": "deploying"})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        result = await Agents(client).adeploy(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}/deploy"
    assert result["status"] == "deploying"


@pytest.mark.asyncio
async def test_agents_astop_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_path
        captured_path = request.url.path
        return httpx.Response(200, json={"status": "stopping"})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        result = await Agents(client).astop(agent_id)

    assert captured_path == f"/v1/agents/{agent_id}/stop"
    assert result["status"] == "stopping"


@pytest.mark.asyncio
async def test_agents_alogs_hits_correct_route_and_params() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_log_payload()])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        logs = await Agents(client).alogs(agent_id, skip=1, limit=20, level="ERROR")

    assert captured["path"] == f"/v1/agents/{agent_id}/logs"
    assert captured["query"] == {"skip": "1", "limit": "20", "level": "ERROR"}
    assert len(logs) == 1


@pytest.mark.asyncio
async def test_agents_ametrics_hits_correct_route_and_params() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[_metric_payload()])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        metrics = await Agents(client).ametrics(agent_id, skip=0, limit=50)

    assert captured["path"] == f"/v1/agents/{agent_id}/metrics"
    assert captured["query"] == {"skip": "0", "limit": "50"}
    assert len(metrics) == 1


@pytest.mark.asyncio
async def test_agents_aupdate_config_hits_correct_route() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["body"] = request.content.decode()
        return httpx.Response(200, json=_agent_detail_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        await Agents(client).aupdate_config(agent_id, config={"key": "val"})

    assert captured["path"] == f"/v1/agents/{agent_id}/config"
    body = json.loads(captured["body"])
    assert body["config"] == '{"key": "val"}'


@pytest.mark.asyncio
async def test_agents_aupdate_config_passes_through_string_config() -> None:
    agent_id = uuid.uuid4()
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.content.decode()
        return httpx.Response(200, json=_agent_detail_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        await Agents(client).aupdate_config(agent_id, config='{"raw": "str"}')

    body = json.loads(captured["body"])
    assert body["config"] == '{"raw": "str"}'


@pytest.mark.asyncio
async def test_agents_astream_logs_calls_callback_and_yields() -> None:
    agent_id = uuid.uuid4()
    callback_calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[_log_payload(message="a"), _log_payload(message="b")])

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        logs = [
            log
            async for log in Agents(client).astream_logs(
                agent_id, callback=lambda log: callback_calls.append(log.message)
            )
        ]

    assert len(logs) == 2
    assert callback_calls == ["a", "b"]


def test_agents_async_methods_raise_when_client_is_sync() -> None:
    with httpx.Client(base_url="https://api.test") as client:
        agents = Agents(client)
        with pytest.raises(RuntimeError, match="async"):
            import asyncio

            async def run():
                await agents.acreate(name="x")

            asyncio.run(run())
