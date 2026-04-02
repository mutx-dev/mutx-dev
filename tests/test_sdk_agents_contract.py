"""
SDK contract tests for agents module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import pytest

from mutx.agents import Agent, AgentDetail, AgentLog, AgentMetric, Agents


def _agent_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-agent",
        "description": "A test agent",
        "status": "running",
        "config": '{"model": "gpt-4"}',
        "created_at": now,
        "updated_at": now,
        "user_id": str(uuid.uuid4()),
    }
    payload.update(overrides)
    return payload


def _deployment_event_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "deployment_id": str(uuid.uuid4()),
        "event_type": "start",
        "status": "success",
        "node_id": "node-1",
        "error_message": None,
        "created_at": now,
        **overrides,
    }


def _deployment_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "replicas": 1,
        "node_id": "node-1",
        "started_at": now,
        "ended_at": None,
        "error_message": None,
        "events": [_deployment_event_payload()],
        **overrides,
    }


def _agent_log_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "level": "info",
        "message": "Agent started",
        "timestamp": now,
        "extra_data": {"host": "server1"},
        **overrides,
    }


def _agent_metric_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "cpu_usage": 45.0,
        "memory_usage": 512.0,
        "timestamp": now,
        **overrides,
    }


# ------------------------------------------------------------------
# Data-model tests
# ------------------------------------------------------------------

def test_agent_parses_required_fields() -> None:
    payload = _agent_payload()
    agent = Agent(payload)

    assert agent.id is not None
    assert agent.name == "test-agent"
    assert agent.status == "running"
    assert agent.description == "A test agent"


def test_agent_parses_config_json_string() -> None:
    payload = _agent_payload(config='{"model":"gpt-4","temperature":0.7}')
    agent = Agent(payload)

    assert agent.config == {"model": "gpt-4", "temperature": 0.7}


def test_agent_parses_config_non_string() -> None:
    payload = _agent_payload(config={"model": "gpt-4"})
    agent = Agent(payload)

    assert agent.config == {"model": "gpt-4"}


def test_agent_repr() -> None:
    payload = _agent_payload(name="my-agent", status="idle")
    agent = Agent(payload)

    assert "my-agent" in repr(agent)
    assert "idle" in repr(agent)


def test_agent_detail_includes_deployments() -> None:
    now = datetime.now(timezone.utc).isoformat()
    payload = _agent_payload(deployments=[_deployment_payload()])
    detail = AgentDetail(payload)

    assert len(detail.deployments) == 1
    assert detail.deployments[0].status == "running"


def test_agent_log_parses_fields() -> None:
    payload = _agent_log_payload(level="error", message="Something failed")
    log = AgentLog(payload)

    assert log.level == "error"
    assert log.message == "Something failed"
    assert log.metadata["host"] == "server1"


def test_agent_metric_parses_fields() -> None:
    payload = _agent_metric_payload(cpu_usage=75.5, memory_usage=1024.0)
    metric = AgentMetric(payload)

    assert metric.cpu_usage == 75.5
    assert metric.memory_usage == 1024.0


# ------------------------------------------------------------------
# Sync client tests
# ------------------------------------------------------------------

def test_agents_create_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_agent_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.create(name="new-agent", description="A new agent", type="openai")

    assert captured["path"] == "/v1/agents"
    assert captured["method"] == "POST"
    assert captured["json"]["name"] == "new-agent"
    assert captured["json"]["description"] == "A new agent"


def test_agents_list_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=[_agent_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.list(skip=10, limit=25)

    assert captured["path"] == "/v1/agents"
    assert captured["params"]["skip"] == "10"
    assert captured["params"]["limit"] == "25"


def test_agents_get_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_agent_payload(id=str(agent_id), deployments=[_deployment_payload()]))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    result = agents.get(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert captured["method"] == "GET"
    assert isinstance(result, AgentDetail)


def test_agents_delete_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.delete(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert captured["method"] == "DELETE"


def test_agents_deploy_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "deploying", "deployment_id": str(uuid.uuid4())})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    result = agents.deploy(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}/deploy"
    assert captured["method"] == "POST"
    assert result["status"] == "deploying"


def test_agents_stop_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"status": "stopped"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    result = agents.stop(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}/stop"
    assert captured["method"] == "POST"


def test_agents_logs_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=[_agent_log_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.logs(agent_id, level="error")

    assert captured["path"] == f"/v1/agents/{agent_id}/logs"
    assert captured["params"]["level"] == "error"


def test_agents_metrics_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_agent_metric_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.metrics(agent_id)

    assert captured["path"] == f"/v1/agents/{agent_id}/metrics"


def test_agents_update_config_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_agent_payload(config='{"temperature":0.9}'))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.update_config(agent_id, config={"temperature": 0.9})

    assert captured["path"] == f"/v1/agents/{agent_id}/config"
    assert captured["method"] == "PATCH"
    assert "temperature" in captured["json"]["config"]


# ------------------------------------------------------------------
# Async client tests
# ------------------------------------------------------------------

def test_agents_acreate_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_agent_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.acreate(name="async-agent"))

    assert captured["path"] == "/v1/agents"
    assert captured["method"] == "POST"


def test_agents_alist_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.alist())

    assert captured["path"] == "/v1/agents"


def test_agents_aget_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_payload(id=str(agent_id)))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    result = asyncio.run(agents.aget(agent_id))

    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert isinstance(result, AgentDetail)


def test_agents_adelete_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.adelete(agent_id))

    assert captured["path"] == f"/v1/agents/{agent_id}"
    assert captured["method"] == "DELETE"


def test_agents_adeploy_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json={"status": "deploying"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.adeploy(agent_id))

    assert captured["path"] == f"/v1/agents/{agent_id}/deploy"


def test_agents_astop_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json={"status": "stopped"})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.astop(agent_id))

    assert captured["path"] == f"/v1/agents/{agent_id}/stop"


def test_agents_alogs_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_agent_log_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.alogs(agent_id))

    assert captured["path"] == f"/v1/agents/{agent_id}/logs"


def test_agents_ametrics_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_agent_metric_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.ametrics(agent_id))

    assert captured["path"] == f"/v1/agents/{agent_id}/metrics"


def test_agents_aupdate_config_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_agent_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    import asyncio
    asyncio.run(agents.aupdate_config(agent_id, config={"key": "value"}))

    assert captured["path"] == f"/v1/agents/{agent_id}/config"
    assert captured["method"] == "PATCH"


# ------------------------------------------------------------------
# Client type guard tests
# ------------------------------------------------------------------

def test_agents_sync_methods_reject_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    agents = Agents(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        agents.create(name="x")


def test_agents_async_methods_reject_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    agents = Agents(client)

    import asyncio
    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(agents.acreate(name="x"))
