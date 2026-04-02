# SDK contract tests for analytics module

from __future__ import annotations

import json
import uuid

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
# Payload helpers
# ---------------------------------------------------------------------------

def _summary_payload(**overrides):
    payload = {
        "total_agents": 10,
        "active_agents": 7,
        "total_deployments": 25,
        "active_deployments": 12,
        "total_runs": 5000,
        "successful_runs": 4800,
        "failed_runs": 200,
        "total_api_calls": 150000,
        "avg_latency_ms": 234.5,
        "period_start": "2026-03-01T00:00:00",
        "period_end": "2026-03-31T23:59:59",
    }
    payload.update(overrides)
    return payload


def _agent_summary_payload(agent_id=None, **overrides):
    payload = {
        "agent_id": agent_id or str(uuid.uuid4()),
        "agent_name": "test-agent",
        "total_runs": 100,
        "successful_runs": 95,
        "failed_runs": 5,
        "avg_cpu": 45.2,
        "avg_memory": 512.0,
        "total_requests": 500,
        "avg_latency_ms": 120.5,
        "period_start": "2026-03-01T00:00:00",
        "period_end": "2026-03-31T23:59:59",
    }
    payload.update(overrides)
    return payload


def _timeseries_payload(**overrides):
    payload = {
        "metric": "runs",
        "interval": "hour",
        "data": [
            {"timestamp": "2026-03-01T00:00:00Z", "value": 10.0},
            {"timestamp": "2026-03-01T01:00:00Z", "value": 15.0},
            {"timestamp": "2026-03-01T02:00:00Z", "value": 8.0},
        ],
        "period_start": "2026-03-01T00:00:00",
        "period_end": "2026-03-01T23:59:59",
    }
    payload.update(overrides)
    return payload


def _costs_payload(**overrides):
    payload = {
        "total_cost": 1234.56,
        "breakdown": {"api_calls": 800.0, "compute": 434.56},
        "currency": "USD",
        "period_start": "2026-03-01T00:00:00",
        "period_end": "2026-03-31T23:59:59",
    }
    payload.update(overrides)
    return payload


def _budget_payload(**overrides):
    payload = {
        "monthly_budget": 5000.0,
        "spent": 1234.56,
        "remaining": 3765.44,
        "currency": "USD",
        "reset_date": "2026-04-01T00:00:00",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# AnalyticsSummary tests
# ---------------------------------------------------------------------------

def test_analytics_summary_parses_all_fields():
    payload = _summary_payload()
    summary = AnalyticsSummary(payload)

    assert summary.total_agents == 10
    assert summary.active_agents == 7
    assert summary.total_deployments == 25
    assert summary.active_deployments == 12
    assert summary.total_runs == 5000
    assert summary.successful_runs == 4800
    assert summary.failed_runs == 200
    assert summary.total_api_calls == 150000
    assert summary.avg_latency_ms == 234.5
    assert summary.period_start.isoformat() == "2026-03-01T00:00:00"
    assert summary.period_end.isoformat() == "2026-03-31T23:59:59"
    assert summary._data == payload


def test_analytics_summary_avg_latency_defaults_to_zero():
    payload = _summary_payload()
    del payload["avg_latency_ms"]
    summary = AnalyticsSummary(payload)
    assert summary.avg_latency_ms == 0.0


def test_analytics_summary_repr():
    payload = _summary_payload()
    summary = AnalyticsSummary(payload)
    r = repr(summary)
    assert "AnalyticsSummary" in r
    assert "10" in r
    assert "5000" in r


# ---------------------------------------------------------------------------
# AgentMetricsSummary tests
# ---------------------------------------------------------------------------

def test_agent_metrics_summary_parses_all_fields():
    agent_id = str(uuid.uuid4())
    payload = _agent_summary_payload(agent_id=agent_id)
    summary = AgentMetricsSummary(payload)

    assert summary.agent_id == agent_id
    assert summary.agent_name == "test-agent"
    assert summary.total_runs == 100
    assert summary.successful_runs == 95
    assert summary.failed_runs == 5
    assert summary.avg_cpu == 45.2
    assert summary.avg_memory == 512.0
    assert summary.total_requests == 500
    assert summary.avg_latency_ms == 120.5
    assert summary._data == payload


def test_agent_metrics_summary_optional_fields_can_be_none():
    payload = _agent_summary_payload(avg_cpu=None, avg_memory=None, avg_latency_ms=None, total_requests=None)
    summary = AgentMetricsSummary(payload)
    assert summary.avg_cpu is None
    assert summary.avg_memory is None
    assert summary.avg_latency_ms is None
    # When explicitly None in payload, value is None (not the default)
    assert summary.total_requests is None


# ---------------------------------------------------------------------------
# TimeSeriesPoint tests
# ---------------------------------------------------------------------------

def test_timeseries_point_parses_iso_timestamp():
    payload = {"timestamp": "2026-03-01T12:30:00Z", "value": 42.5}
    point = TimeSeriesPoint(payload)
    assert point.timestamp.year == 2026
    assert point.timestamp.month == 3
    assert point.timestamp.day == 1
    assert point.value == 42.5


def test_timeseries_point_parses_timestamp_with_z_suffix():
    payload = {"timestamp": "2026-03-01T12:30:00Z", "value": 99.0}
    point = TimeSeriesPoint(payload)
    assert point.timestamp.tzinfo is not None


def test_timeseries_point_rejects_datetime_objects():
    """TimeSeriesPoint calls fromisoformat unconditionally and raises for datetime inputs."""
    from datetime import datetime, timezone
    dt = datetime(2026, 3, 1, 12, 30, 0, tzinfo=timezone.utc)
    payload = {"timestamp": dt, "value": 7.0}
    with pytest.raises(TypeError):
        TimeSeriesPoint(payload)


# ---------------------------------------------------------------------------
# AnalyticsTimeSeries tests
# ---------------------------------------------------------------------------

def test_analytics_timeseries_parses_metric_and_interval():
    payload = _timeseries_payload(metric="api_calls", interval="day")
    ts = AnalyticsTimeSeries(payload)
    assert ts.metric == "api_calls"
    assert ts.interval == "day"
    assert len(ts.data) == 3
    assert all(isinstance(p, TimeSeriesPoint) for p in ts.data)
    assert ts.data[0].value == 10.0
    assert ts.data[1].value == 15.0
    assert ts.data[2].value == 8.0


def test_analytics_timeseries_empty_data():
    payload = _timeseries_payload(data=[])
    ts = AnalyticsTimeSeries(payload)
    assert ts.data == []


# ---------------------------------------------------------------------------
# Analytics sync method tests
# ---------------------------------------------------------------------------

def test_get_summary_makes_correct_request():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_summary_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        result = analytics.get_summary(period_start="7d", period_end="now")

    assert captured["path"] == "/analytics/summary"
    assert captured["params"]["period_start"] == "7d"
    assert captured["params"]["period_end"] == "now"
    assert isinstance(result, AnalyticsSummary)
    assert result.total_agents == 10


def test_get_summary_without_period_params():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_summary_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        result = analytics.get_summary()

    assert captured["path"] == "/analytics/summary"
    assert captured["params"] == {}


def test_get_summary_raises_on_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "internal error"})

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            analytics.get_summary()


def test_get_agent_summary_makes_correct_request():
    captured = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_agent_summary_payload(agent_id=agent_id))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        result = analytics.get_agent_summary(agent_id, period_start="30d")

    assert captured["path"] == f"/analytics/agents/{agent_id}/summary"
    assert captured["params"]["period_start"] == "30d"
    assert isinstance(result, AgentMetricsSummary)
    assert result.agent_id == agent_id


def test_get_timeseries_makes_correct_request():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        result = analytics.get_timeseries(
            metric="runs",
            interval="hour",
            period_start="24h",
            period_end="now",
            agent_id="agent-123",
        )

    assert captured["path"] == "/analytics/timeseries"
    assert captured["params"]["metric"] == "runs"
    assert captured["params"]["interval"] == "hour"
    assert captured["params"]["period_start"] == "24h"
    assert captured["params"]["period_end"] == "now"
    assert captured["params"]["agent_id"] == "agent-123"
    assert isinstance(result, AnalyticsTimeSeries)


def test_get_timeseries_agent_id_is_optional():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        analytics.get_timeseries(metric="latency", interval="minute")

    assert "agent_id" not in captured["params"]


def test_get_costs_makes_correct_request():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_costs_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        result = analytics.get_costs(period_start="30d")

    assert captured["path"] == "/analytics/costs"
    assert captured["params"]["period_start"] == "30d"
    assert isinstance(result, dict)
    assert result["total_cost"] == 1234.56


def test_get_budget_makes_correct_request():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_budget_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)
        result = analytics.get_budget()

    assert captured["path"] == "/analytics/budget"
    assert isinstance(result, dict)
    assert result["monthly_budget"] == 5000.0


# ---------------------------------------------------------------------------
# Analytics sync methods reject async client
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sync_methods_reject_async_client():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_summary_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        analytics = Analytics(client)

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            analytics.get_summary()

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            analytics.get_agent_summary(str(uuid.uuid4()))

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            analytics.get_timeseries("runs")

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            analytics.get_costs()

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            analytics.get_budget()


# ---------------------------------------------------------------------------
# Analytics async method tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aget_summary_makes_correct_request():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_summary_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        analytics = Analytics(client)
        result = await analytics.aget_summary(period_start="7d", period_end="now")

    assert captured["path"] == "/analytics/summary"
    assert captured["params"]["period_start"] == "7d"
    assert isinstance(result, AnalyticsSummary)
    assert result.total_agents == 10


@pytest.mark.asyncio
async def test_aget_agent_summary_makes_correct_request():
    captured = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_agent_summary_payload(agent_id=agent_id))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        analytics = Analytics(client)
        result = await analytics.aget_agent_summary(agent_id, period_start="30d")

    assert captured["path"] == f"/analytics/agents/{agent_id}/summary"
    assert isinstance(result, AgentMetricsSummary)
    assert result.agent_id == agent_id


@pytest.mark.asyncio
async def test_aget_timeseries_makes_correct_request():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_timeseries_payload(metric="latency"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        analytics = Analytics(client)
        result = await analytics.aget_timeseries(
            metric="latency",
            interval="minute",
            period_start="24h",
            agent_id="agent-456",
        )

    assert captured["path"] == "/analytics/timeseries"
    assert captured["params"]["metric"] == "latency"
    assert captured["params"]["agent_id"] == "agent-456"
    assert isinstance(result, AnalyticsTimeSeries)


@pytest.mark.asyncio
async def test_aget_costs_makes_correct_request():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_costs_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        analytics = Analytics(client)
        result = await analytics.aget_costs(period_start="7d")

    assert captured["path"] == "/analytics/costs"
    assert result["total_cost"] == 1234.56


@pytest.mark.asyncio
async def test_aget_budget_makes_correct_request():
    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_budget_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        analytics = Analytics(client)
        result = await analytics.aget_budget()

    assert captured["path"] == "/analytics/budget"
    assert result["remaining"] == 3765.44


# ---------------------------------------------------------------------------
# Analytics async methods reject sync client
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_async_methods_reject_sync_client():
    """Async methods raise RuntimeError when called with a sync httpx.Client."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_summary_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        analytics = Analytics(client)

        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await analytics.aget_summary()

        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await analytics.aget_agent_summary(str(uuid.uuid4()))

        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await analytics.aget_timeseries("runs")

        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await analytics.aget_costs()

        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await analytics.aget_budget()
