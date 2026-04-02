"""
SDK contract tests for analytics module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import pytest

from mutx.analytics import (
    AgentMetricsSummary,
    Analytics,
    AnalyticsSummary,
    AnalyticsTimeSeries,
    TimeSeriesPoint,
)


def _analytics_summary_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "total_agents": 5,
        "active_agents": 3,
        "total_deployments": 12,
        "active_deployments": 4,
        "total_runs": 1000,
        "successful_runs": 950,
        "failed_runs": 50,
        "total_api_calls": 50000,
        "avg_latency_ms": 120.5,
        "period_start": now,
        "period_end": now,
    }
    payload.update(overrides)
    return payload


def _agent_metrics_summary_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "agent_id": str(uuid.uuid4()),
        "agent_name": "test-agent",
        "total_runs": 200,
        "successful_runs": 190,
        "failed_runs": 10,
        "avg_cpu": 35.5,
        "avg_memory": 256.0,
        "total_requests": 5000,
        "avg_latency_ms": 95.0,
        "period_start": now,
        "period_end": now,
    }
    payload.update(overrides)
    return payload


def _timeseries_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "metric": "runs",
        "interval": "hour",
        "data": [
            {"timestamp": now, "value": 100.0},
            {"timestamp": now, "value": 150.0},
        ],
        "period_start": now,
        "period_end": now,
    }
    payload.update(overrides)
    return payload


# ------------------------------------------------------------------
# Data-model tests
# ------------------------------------------------------------------

def test_analytics_summary_parses_fields() -> None:
    payload = _analytics_summary_payload()
    summary = AnalyticsSummary(payload)

    assert summary.total_agents == 5
    assert summary.active_agents == 3
    assert summary.total_runs == 1000
    assert summary.successful_runs == 950
    assert summary.failed_runs == 50
    assert summary.total_api_calls == 50000
    assert summary.avg_latency_ms == 120.5


def test_analytics_summary_repr() -> None:
    payload = _analytics_summary_payload()
    summary = AnalyticsSummary(payload)

    repr_str = repr(summary)
    assert "5" in repr_str
    assert "1000" in repr_str


def test_agent_metrics_summary_parses_fields() -> None:
    payload = _agent_metrics_summary_payload()
    summary = AgentMetricsSummary(payload)

    assert summary.total_runs == 200
    assert summary.successful_runs == 190
    assert summary.avg_cpu == 35.5
    assert summary.avg_memory == 256.0


def test_timeseries_point_parses_fields() -> None:
    now = datetime.now(timezone.utc).isoformat()
    point = TimeSeriesPoint({"timestamp": now, "value": 42.5})

    assert point.value == 42.5
    assert point.timestamp is not None


def test_analytics_timeseries_parses_data_points() -> None:
    payload = _timeseries_payload()
    ts = AnalyticsTimeSeries(payload)

    assert ts.metric == "runs"
    assert ts.interval == "hour"
    assert len(ts.data) == 2
    assert ts.data[0].value == 100.0


# ------------------------------------------------------------------
# Sync client tests
# ------------------------------------------------------------------

def test_analytics_get_summary_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_analytics_summary_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    analytics.get_summary(period_start="7d", period_end="now")

    assert captured["path"] == "/analytics/summary"
    assert captured["params"]["period_start"] == "7d"
    assert captured["params"]["period_end"] == "now"


def test_analytics_get_agent_summary_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_agent_metrics_summary_payload(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    analytics.get_agent_summary(agent_id, period_start="24h")

    assert captured["path"] == f"/analytics/agents/{agent_id}/summary"
    assert captured["params"]["period_start"] == "24h"


def test_analytics_get_timeseries_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    analytics.get_timeseries(metric="runs", interval="day", period_start="30d")

    assert captured["path"] == "/analytics/timeseries"
    assert captured["params"]["metric"] == "runs"
    assert captured["params"]["interval"] == "day"
    assert captured["params"]["period_start"] == "30d"


def test_analytics_get_timeseries_with_agent_filter() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    analytics.get_timeseries(metric="api_calls", agent_id=agent_id)

    assert captured["params"]["agent_id"] == agent_id


def test_analytics_get_costs_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"total_cost": 12.50, "currency": "USD"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    result = analytics.get_costs(period_start="7d")

    assert captured["path"] == "/analytics/costs"
    assert result["total_cost"] == 12.50


def test_analytics_get_budget_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json={"budget_limit": 1000.0, "credits_used": 250.0})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    result = analytics.get_budget()

    assert captured["path"] == "/analytics/budget"
    assert result["budget_limit"] == 1000.0


# ------------------------------------------------------------------
# Async client tests
# ------------------------------------------------------------------

def test_analytics_aget_summary_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_analytics_summary_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    import asyncio
    asyncio.run(analytics.aget_summary(period_start="24h"))

    assert captured["path"] == "/analytics/summary"


def test_analytics_aget_agent_summary_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_metrics_summary_payload(agent_id=agent_id))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    import asyncio
    asyncio.run(analytics.aget_agent_summary(agent_id))

    assert captured["path"] == f"/analytics/agents/{agent_id}/summary"


def test_analytics_aget_timeseries_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_timeseries_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    import asyncio
    asyncio.run(analytics.aget_timeseries(metric="latency"))

    assert captured["path"] == "/analytics/timeseries"


def test_analytics_aget_costs_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json={"total_cost": 5.0})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    import asyncio
    asyncio.run(analytics.aget_costs())

    assert captured["path"] == "/analytics/costs"


def test_analytics_aget_budget_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json={"budget_limit": 500.0})

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)

    import asyncio
    asyncio.run(analytics.aget_budget())

    assert captured["path"] == "/analytics/budget"


# ------------------------------------------------------------------
# Client type guard tests
# ------------------------------------------------------------------

def test_analytics_sync_methods_reject_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    analytics = Analytics(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        analytics.get_summary()


def test_analytics_async_methods_reject_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    analytics = Analytics(client)

    import asyncio
    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(analytics.aget_summary())
