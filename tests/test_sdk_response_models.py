"""
Tests for typed Pydantic response models in the MUTX SDK.

Covers:
- Model parsing from raw API payloads
- ``.dict()`` backward-compatibility method on response models
- ``.dict()`` backward-compatibility method on SDK wrapper classes
- SDK methods returning the correct typed objects
"""

from __future__ import annotations

import sys
import uuid
from pathlib import Path
from typing import Any

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.agents import Agent, AgentDetail, AgentLog, AgentMetric, Agents
from mutx.api_keys import APIKey, APIKeyWithSecret
from mutx.deployments import Deployment, DeploymentEvent, DeploymentEventHistory, Deployments
from mutx.models import AgentActionResponse, DeploymentLog, DeploymentMetric, WebhookTestResult
from mutx.webhooks import Webhook, WebhookDelivery, Webhooks

# ---------------------------------------------------------------------------
# Helpers – canonical payload factories
# ---------------------------------------------------------------------------

_NOW = "2026-03-16T12:00:00"
_NOW_Z = "2026-03-16T12:00:00Z"


def _agent_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "name": "my-agent",
        "description": "test agent",
        "status": "running",
        "type": "openai",
        "config": None,
        "config_version": 1,
        "created_at": _NOW,
        "updated_at": _NOW,
        "user_id": str(uuid.uuid4()),
    }
    base.update(overrides)
    return base


def _deployment_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "status": "running",
        "replicas": 1,
        "node_id": "node-1",
        "started_at": _NOW,
        "ended_at": None,
        "error_message": None,
        "events": [],
    }
    base.update(overrides)
    return base


def _deployment_log_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "level": "INFO",
        "message": "Agent started",
        "extra_data": None,
        "timestamp": _NOW,
    }
    base.update(overrides)
    return base


def _deployment_metric_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "cpu_usage": 0.42,
        "memory_usage": 0.31,
        "timestamp": _NOW,
    }
    base.update(overrides)
    return base


def _webhook_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "url": "https://example.com/hook",
        "events": ["agent.status"],
        "secret": None,
        "is_active": True,
        "created_at": _NOW,
    }
    base.update(overrides)
    return base


def _delivery_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "webhook_id": str(uuid.uuid4()),
        "event": "agent.status",
        "payload": '{"status":"running"}',
        "status_code": 200,
        "success": True,
        "error_message": None,
        "attempts": 1,
        "created_at": _NOW,
        "delivered_at": _NOW,
    }
    base.update(overrides)
    return base


def _api_key_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": str(uuid.uuid4()),
        "name": "my-key",
        "is_active": True,
        "last_used": None,
        "created_at": _NOW,
        "expires_at": None,
    }
    base.update(overrides)
    return base


def _api_key_with_secret_payload(**overrides: Any) -> dict[str, Any]:
    base = _api_key_payload()
    base["key"] = "mutx_sk_" + uuid.uuid4().hex
    base.update(overrides)
    return base


# ===========================================================================
# AgentActionResponse
# ===========================================================================


class TestAgentActionResponse:
    def test_parses_deploy_response(self) -> None:
        resp = AgentActionResponse.model_validate(
            {"deployment_id": str(uuid.uuid4()), "status": "deploying"}
        )
        assert resp.status == "deploying"
        assert resp.deployment_id is not None

    def test_parses_stop_response(self) -> None:
        resp = AgentActionResponse.model_validate({"status": "stopped"})
        assert resp.status == "stopped"
        assert resp.deployment_id is None

    def test_dict_returns_plain_dict(self) -> None:
        resp = AgentActionResponse.model_validate({"status": "deploying"})
        result = resp.dict()
        assert isinstance(result, dict)
        assert result["status"] == "deploying"

    def test_extra_fields_are_preserved(self) -> None:
        resp = AgentActionResponse.model_validate(
            {"status": "deploying", "message": "ok", "custom_field": "x"}
        )
        result = resp.dict()
        assert result.get("custom_field") == "x"


# ===========================================================================
# DeploymentLog
# ===========================================================================


class TestDeploymentLog:
    def test_parses_required_fields(self) -> None:
        log = DeploymentLog.model_validate(_deployment_log_payload())
        assert log.level == "INFO"
        assert log.message == "Agent started"
        assert log.extra_data is None

    def test_parses_optional_extra_data(self) -> None:
        log = DeploymentLog.model_validate(
            _deployment_log_payload(extra_data='{"key": "value"}')
        )
        assert log.extra_data == '{"key": "value"}'

    def test_dict_returns_plain_dict(self) -> None:
        log = DeploymentLog.model_validate(_deployment_log_payload())
        result = log.dict()
        assert isinstance(result, dict)
        assert result["level"] == "INFO"


# ===========================================================================
# DeploymentMetric
# ===========================================================================


class TestDeploymentMetric:
    def test_parses_numeric_fields(self) -> None:
        metric = DeploymentMetric.model_validate(_deployment_metric_payload())
        assert metric.cpu_usage == 0.42
        assert metric.memory_usage == 0.31

    def test_parses_nullable_fields(self) -> None:
        metric = DeploymentMetric.model_validate(
            _deployment_metric_payload(cpu_usage=None, memory_usage=None)
        )
        assert metric.cpu_usage is None
        assert metric.memory_usage is None

    def test_dict_returns_plain_dict(self) -> None:
        metric = DeploymentMetric.model_validate(_deployment_metric_payload())
        result = metric.dict()
        assert isinstance(result, dict)
        assert result["cpu_usage"] == 0.42


# ===========================================================================
# WebhookTestResult
# ===========================================================================


class TestWebhookTestResult:
    def test_parses_success_response(self) -> None:
        result = WebhookTestResult.model_validate(
            {"status": "test_delivered", "message": "Test event delivered successfully"}
        )
        assert result.status == "test_delivered"
        assert result.message == "Test event delivered successfully"

    def test_parses_minimal_response(self) -> None:
        result = WebhookTestResult.model_validate({"status": "test_delivered"})
        assert result.status == "test_delivered"
        assert result.message is None

    def test_dict_returns_plain_dict(self) -> None:
        result = WebhookTestResult.model_validate({"status": "test_delivered"})
        d = result.dict()
        assert isinstance(d, dict)
        assert d["status"] == "test_delivered"


# ===========================================================================
# .dict() on existing SDK wrapper classes
# ===========================================================================


class TestAgentDictMethod:
    def test_agent_dict(self) -> None:
        payload = _agent_payload()
        agent = Agent(payload)
        assert agent.dict() == payload

    def test_agent_detail_dict(self) -> None:
        payload = _agent_payload(deployments=[])
        detail = AgentDetail(payload)
        assert detail.dict() == payload

    def test_agent_log_dict(self) -> None:
        data = {
            "id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "level": "ERROR",
            "message": "boom",
            "extra_data": None,
            "timestamp": _NOW,
        }
        log = AgentLog(data)
        assert log.dict() == data

    def test_agent_metric_dict(self) -> None:
        data = {
            "id": str(uuid.uuid4()),
            "agent_id": str(uuid.uuid4()),
            "cpu_usage": 0.5,
            "memory_usage": 0.3,
            "timestamp": _NOW,
        }
        metric = AgentMetric(data)
        assert metric.dict() == data


class TestDeploymentDictMethod:
    def test_deployment_dict(self) -> None:
        payload = _deployment_payload()
        dep = Deployment(payload)
        assert dep.dict() == payload

    def test_deployment_event_dict(self) -> None:
        data = {
            "id": str(uuid.uuid4()),
            "deployment_id": str(uuid.uuid4()),
            "event_type": "create",
            "status": "pending",
            "node_id": None,
            "error_message": None,
            "created_at": _NOW,
        }
        event = DeploymentEvent(data)
        assert event.dict() == data

    def test_deployment_event_history_dict(self) -> None:
        dep_id = uuid.uuid4()
        data = {
            "deployment_id": str(dep_id),
            "deployment_status": "running",
            "items": [],
            "total": 0,
            "skip": 0,
            "limit": 100,
            "event_type": None,
            "status": None,
        }
        history = DeploymentEventHistory(data)
        assert history.dict() == data


class TestWebhookDictMethod:
    def test_webhook_dict(self) -> None:
        payload = _webhook_payload()
        webhook = Webhook(payload)
        assert webhook.dict() == payload

    def test_webhook_delivery_dict(self) -> None:
        payload = _delivery_payload()
        delivery = WebhookDelivery(payload)
        assert delivery.dict() == payload


class TestAPIKeyDictMethod:
    def test_api_key_dict(self) -> None:
        payload = _api_key_payload()
        key = APIKey(payload)
        assert key.dict() == payload

    def test_api_key_with_secret_dict(self) -> None:
        payload = _api_key_with_secret_payload()
        key = APIKeyWithSecret(payload)
        assert key.dict() == payload


# ===========================================================================
# SDK methods now return typed objects (not raw dicts)
# ===========================================================================


class TestAgentsTypedReturns:
    def test_deploy_returns_agent_action_response(self) -> None:
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200, json={"deployment_id": str(uuid.uuid4()), "status": "deploying"}
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        result = Agents(client).deploy(agent_id)
        assert isinstance(result, AgentActionResponse)
        assert result.status == "deploying"

    def test_stop_returns_agent_action_response(self) -> None:
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"status": "stopped"})

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        result = Agents(client).stop(agent_id)
        assert isinstance(result, AgentActionResponse)
        assert result.status == "stopped"

    @pytest.mark.asyncio
    async def test_adeploy_returns_agent_action_response(self) -> None:
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200, json={"deployment_id": str(uuid.uuid4()), "status": "deploying"}
            )

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            result = await Agents(client).adeploy(agent_id)
        assert isinstance(result, AgentActionResponse)
        assert result.status == "deploying"

    @pytest.mark.asyncio
    async def test_astop_returns_agent_action_response(self) -> None:
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"status": "stopped"})

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            result = await Agents(client).astop(agent_id)
        assert isinstance(result, AgentActionResponse)
        assert result.status == "stopped"


class TestDeploymentsTypedReturns:
    def test_create_for_agent_returns_agent_action_response(self) -> None:
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200, json={"deployment_id": str(uuid.uuid4()), "status": "deploying"}
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        result = Deployments(client).create_for_agent(agent_id)
        assert isinstance(result, AgentActionResponse)
        assert result.status == "deploying"

    def test_logs_returns_deployment_log_list(self) -> None:
        dep_id = uuid.uuid4()
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=[_deployment_log_payload(agent_id=str(agent_id), level="WARNING")],
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        logs = Deployments(client).logs(dep_id)
        assert len(logs) == 1
        assert isinstance(logs[0], DeploymentLog)
        assert logs[0].level == "WARNING"

    def test_metrics_returns_deployment_metric_list(self) -> None:
        dep_id = uuid.uuid4()
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=[_deployment_metric_payload(agent_id=str(agent_id), cpu_usage=0.9)],
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        metrics = Deployments(client).metrics(dep_id)
        assert len(metrics) == 1
        assert isinstance(metrics[0], DeploymentMetric)
        assert metrics[0].cpu_usage == 0.9

    def test_deployment_metric_dict_method(self) -> None:
        dep_id = uuid.uuid4()
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=[_deployment_metric_payload(agent_id=str(agent_id))],
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        metrics = Deployments(client).metrics(dep_id)
        d = metrics[0].dict()
        assert isinstance(d, dict)
        assert "cpu_usage" in d

    @pytest.mark.asyncio
    async def test_ametrics_returns_deployment_metric_list(self) -> None:
        dep_id = uuid.uuid4()
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=[_deployment_metric_payload(agent_id=str(agent_id))],
            )

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            metrics = await Deployments(client).ametrics(dep_id)
        assert isinstance(metrics[0], DeploymentMetric)

    @pytest.mark.asyncio
    async def test_alogs_returns_deployment_log_list(self) -> None:
        dep_id = uuid.uuid4()
        agent_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=[_deployment_log_payload(agent_id=str(agent_id))],
            )

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            logs = await Deployments(client).alogs(dep_id)
        assert isinstance(logs[0], DeploymentLog)


class TestWebhooksTypedReturns:
    def test_test_returns_webhook_test_result(self) -> None:
        webhook_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={"status": "test_delivered", "message": "Test event delivered successfully"},
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        result = Webhooks(client).test(webhook_id)
        assert isinstance(result, WebhookTestResult)
        assert result.status == "test_delivered"

    @pytest.mark.asyncio
    async def test_atest_returns_webhook_test_result(self) -> None:
        webhook_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={"status": "test_delivered", "message": "Test event delivered successfully"},
            )

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            result = await Webhooks(client).atest(webhook_id)
        assert isinstance(result, WebhookTestResult)
        assert result.status == "test_delivered"

    def test_webhook_test_result_dict(self) -> None:
        webhook_id = uuid.uuid4()

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={"status": "test_delivered", "message": "ok"},
            )

        client = httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        )
        result = Webhooks(client).test(webhook_id)
        d = result.dict()
        assert isinstance(d, dict)
        assert d["status"] == "test_delivered"
