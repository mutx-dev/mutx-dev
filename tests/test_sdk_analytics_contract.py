"""Contract tests for sdk/mutx/analytics.py."""

from __future__ import annotations

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


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

PERIOD_START = "2026-03-12T00:00:00"
PERIOD_END = "2026-03-13T00:00:00"


def _summary_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "total_agents": 5,
        "active_agents": 3,
        "total_deployments": 12,
        "active_deployments": 4,
        "total_runs": 1000,
        "successful_runs": 950,
        "failed_runs": 50,
        "total_api_calls": 50_000,
        "avg_latency_ms": 123.4,
        "period_start": PERIOD_START,
        "period_end": PERIOD_END,
    }
    payload.update(overrides)
    return payload


def _agent_summary_payload(agent_id: str | None = None, **overrides: Any) -> dict[str, Any]:
    payload = {
        "agent_id": agent_id or str(uuid.uuid4()),
        "agent_name": "test-agent",
        "total_runs": 200,
        "successful_runs": 190,
        "failed_runs": 10,
        "avg_cpu": 45.5,
        "avg_memory": 512.0,
        "total_requests": 5000,
        "avg_latency_ms": 98.7,
        "period_start": PERIOD_START,
        "period_end": PERIOD_END,
    }
    payload.update(overrides)
    return payload


def _timeseries_payload(
    metric: str = "runs",
    interval: str = "hour",
    **overrides: Any,
) -> dict[str, Any]:
    payload = {
        "metric": metric,
        "interval": interval,
        "data": [
            {"timestamp": "2026-03-12T01:00:00+00:00", "value": 10.0},
            {"timestamp": "2026-03-12T02:00:00+00:00", "value": 25.0},
            {"timestamp": "2026-03-12T03:00:00+00:00", "value": 15.0},
        ],
        "period_start": PERIOD_START,
        "period_end": PERIOD_END,
    }
    payload.update(overrides)
    return payload


def _costs_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "total_cost_usd": 42.50,
        "breakdown": {
            "api_calls": 30.00,
            "compute": 10.50,
            "storage": 2.00,
        },
        "period_start": PERIOD_START,
        "period_end": PERIOD_END,
    }
    payload.update(overrides)
    return payload


def _budget_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "budget_limit_usd": 1000.00,
        "spent_usd": 42.50,
        "remaining_usd": 957.50,
        "reset_at": "2026-04-01T00:00:00Z",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# AnalyticsSummary
# ---------------------------------------------------------------------------

def test_analytics_summary_parses_all_fields() -> None:
    payload = _summary_payload()
    summary = AnalyticsSummary(payload)

    assert summary.total_agents == 5
    assert summary.active_agents == 3
    assert summary.total_deployments == 12
    assert summary.active_deployments == 4
    assert summary.total_runs == 1000
    assert summary.successful_runs == 950
    assert summary.failed_runs == 50
    assert summary.total_api_calls == 50_000
    assert summary.avg_latency_ms == 123.4
    assert summary.period_start == datetime.fromisoformat(PERIOD_START)
    assert summary.period_end == datetime.fromisoformat(PERIOD_END)
    assert summary._data == payload


def test_analytics_summary_repr_does_not_raise() -> None:
    summary = AnalyticsSummary(_summary_payload())
    repr_str = repr(summary)
    assert "AnalyticsSummary" in repr_str
    assert "total_agents" in repr_str or "1000" in repr_str or "12" in repr_str


# ---------------------------------------------------------------------------
# AgentMetricsSummary
# ---------------------------------------------------------------------------

def test_agent_metrics_summary_parses_all_fields() -> None:
    agent_id = str(uuid.uuid4())
    payload = _agent_summary_payload(agent_id=agent_id)
    summary = AgentMetricsSummary(payload)

    assert summary.agent_id == agent_id
    assert summary.agent_name == "test-agent"
    assert summary.total_runs == 200
    assert summary.successful_runs == 190
    assert summary.failed_runs == 10
    assert summary.avg_cpu == 45.5
    assert summary.avg_memory == 512.0
    assert summary.total_requests == 5000
    assert summary.avg_latency_ms == 98.7
    assert summary.period_start == datetime.fromisoformat(PERIOD_START)
    assert summary.period_end == datetime.fromisoformat(PERIOD_END)


def test_agent_metrics_summary_optional_fields_may_be_none() -> None:
    payload = _agent_summary_payload(
        agent_id=str(uuid.uuid4()),
        avg_cpu=None,
        avg_memory=None,
        avg_latency_ms=None,
    )
    summary = AgentMetricsSummary(payload)
    assert summary.avg_cpu is None
    assert summary.avg_memory is None
    assert summary.avg_latency_ms is None


# ---------------------------------------------------------------------------
# TimeSeriesPoint
# ---------------------------------------------------------------------------

def test_timeseries_point_parses_iso_timestamp() -> None:
    point = TimeSeriesPoint({"timestamp": "2026-03-12T05:30:00+00:00", "value": 42.0})
    assert point.timestamp == datetime.fromisoformat("2026-03-12T05:30:00+00:00")
    assert point.value == 42.0


def test_timeseries_point_parses_z_suffix_timestamp() -> None:
    point = TimeSeriesPoint({"timestamp": "2026-03-12T05:30:00Z", "value": 99.9})
    assert abs((point.timestamp.replace(tzinfo=None) - datetime(2026, 3, 12, 5, 30, 0)).total_seconds()) < 1
    assert point.value == 99.9


# ---------------------------------------------------------------------------
# AnalyticsTimeSeries
# ---------------------------------------------------------------------------

def test_analytics_timeseries_parses_metric_interval_and_data_points() -> None:
    payload = _timeseries_payload(metric="latency", interval="minute")
    ts = AnalyticsTimeSeries(payload)

    assert ts.metric == "latency"
    assert ts.interval == "minute"
    assert len(ts.data) == 3
    assert isinstance(ts.data[0], TimeSeriesPoint)
    assert ts.data[0].value == 10.0
    assert ts.period_start == datetime.fromisoformat(PERIOD_START)
    assert ts.period_end == datetime.fromisoformat(PERIOD_END)


def test_analytics_timeseries_empty_data() -> None:
    payload = _timeseries_payload(data=[])
    ts = AnalyticsTimeSeries(payload)
    assert ts.data == []


# ---------------------------------------------------------------------------
# Analytics — sync methods
# ---------------------------------------------------------------------------

def test_get_summary_calls_correct_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_summary_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    analytics = Analytics(client)
    result = analytics.get_summary(period_start="24h", period_end="now")

    assert captured["path"] == "/analytics/summary"
    assert captured["params"]["period_start"] == "24h"
    assert isinstance(result, AnalyticsSummary)
    assert result.total_agents == 5


def test_get_summary_without_period_params() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_summary_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    result = Analytics(client).get_summary()
    assert isinstance(result, AnalyticsSummary)


def test_get_agent_summary_calls_correct_endpoint() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_summary_payload(agent_id=agent_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    result = Analytics(client).get_agent_summary(agent_id, period_start="7d")

    assert captured["path"] == f"/analytics/agents/{agent_id}/summary"
    assert isinstance(result, AgentMetricsSummary)
    assert result.agent_id == agent_id


def test_get_timeseries_calls_correct_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload(metric="api_calls", interval="day"))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    result = Analytics(client).get_timeseries(
        metric="api_calls",
        interval="day",
        period_start="30d",
        agent_id=str(uuid.uuid4()),
    )

    assert captured["path"] == "/analytics/timeseries"
    assert captured["params"]["metric"] == "api_calls"
    assert captured["params"]["interval"] == "day"
    assert isinstance(result, AnalyticsTimeSeries)


def test_get_timeseries_optional_agent_id_filter() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    Analytics(client).get_timeseries(metric="runs", agent_id="agent-123")

    assert "agent_id" in captured["params"]
    assert captured["params"]["agent_id"] == "agent-123"


def test_get_costs_calls_correct_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_costs_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    result = Analytics(client).get_costs(period_start="7d", period_end="now")

    assert captured["path"] == "/analytics/costs"
    assert isinstance(result, dict)
    assert result["total_cost_usd"] == 42.50


def test_get_budget_calls_correct_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_budget_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    result = Analytics(client).get_budget()

    assert captured["path"] == "/analytics/budget"
    assert isinstance(result, dict)
    assert result["budget_limit_usd"] == 1000.00
    assert result["remaining_usd"] == 957.50


# ---------------------------------------------------------------------------
# Analytics — async methods require async client (verified via @pytest.mark.asyncio)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aget_summary_raises_on_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    analytics = Analytics(client)
    with pytest.raises(RuntimeError, match="sync|async"):
        await analytics.aget_summary()


@pytest.mark.asyncio
async def test_aget_agent_summary_raises_on_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    with pytest.raises(RuntimeError, match="sync|async"):
        await Analytics(client).aget_agent_summary(str(uuid.uuid4()))


@pytest.mark.asyncio
async def test_aget_timeseries_raises_on_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    with pytest.raises(RuntimeError, match="sync|async"):
        await Analytics(client).aget_timeseries(metric="runs")


@pytest.mark.asyncio
async def test_aget_costs_raises_on_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    with pytest.raises(RuntimeError, match="sync|async"):
        await Analytics(client).aget_costs()


@pytest.mark.asyncio
async def test_aget_budget_raises_on_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    with pytest.raises(RuntimeError, match="sync|async"):
        await Analytics(client).aget_budget()


# ---------------------------------------------------------------------------
# Analytics — get_* sync methods raise on async client
# ---------------------------------------------------------------------------

def test_get_summary_raises_on_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    try:
        Analytics(client).get_summary()
        assert False, "Expected RuntimeError"
    except RuntimeError as e:
        assert "sync" in str(e).lower()


def test_get_agent_summary_raises_on_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    try:
        Analytics(client).get_agent_summary(str(uuid.uuid4()))
        assert False, "Expected RuntimeError"
    except RuntimeError as e:
        assert "sync" in str(e).lower()


def test_get_timeseries_raises_on_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    try:
        Analytics(client).get_timeseries(metric="runs")
        assert False, "Expected RuntimeError"
    except RuntimeError as e:
        assert "sync" in str(e).lower()


def test_get_costs_raises_on_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    try:
        Analytics(client).get_costs()
        assert False, "Expected RuntimeError"
    except RuntimeError as e:
        assert "sync" in str(e).lower()


def test_get_budget_raises_on_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    try:
        Analytics(client).get_budget()
        assert False, "Expected RuntimeError"
    except RuntimeError as e:
        assert "sync" in str(e).lower()
