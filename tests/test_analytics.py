"""Unit tests for the analytics SDK module (sdk/mutx/analytics.py).

Covers:
- AnalyticsSummary data-class parsing
- AgentMetricsSummary data-class parsing
- TimeSeriesPoint and AnalyticsTimeSeries parsing
- Analytics sync get_summary / get_agent_summary / get_timeseries / get_costs / get_budget
- Analytics async aget_summary / aget_agent_summary / aget_timeseries / aget_costs / aget_budget
- Client-type guard errors (sync on async client, async on sync client)
- HTTP error propagation
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.analytics import (
    AgentMetricsSummary,
    Analytics,
    AnalyticsSummary,
    AnalyticsTimeSeries,
    TimeSeriesPoint,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_SUMMARY_PAYLOAD = {
    "total_agents": 5,
    "active_agents": 3,
    "total_deployments": 8,
    "active_deployments": 4,
    "total_runs": 120,
    "successful_runs": 110,
    "failed_runs": 10,
    "total_api_calls": 5000,
    "avg_latency_ms": 142.5,
    "period_start": "2026-03-01T00:00:00+00:00",
    "period_end": "2026-03-31T23:59:59+00:00",
}

_AGENT_PAYLOAD = {
    "agent_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "agent_name": "test-agent",
    "total_runs": 50,
    "successful_runs": 45,
    "failed_runs": 5,
    "avg_cpu": 67.3,
    "avg_memory": 512.4,
    "total_requests": 300,
    "avg_latency_ms": 98.5,
    "period_start": "2026-03-01T00:00:00+00:00",
    "period_end": "2026-03-31T23:59:59+00:00",
}

_TS_PAYLOAD = {
    "metric": "runs",
    "interval": "hour",
    "data": [
        {"timestamp": "2026-03-01T00:00:00+00:00", "value": 10},
        {"timestamp": "2026-03-01T01:00:00+00:00", "value": 15},
    ],
    "period_start": "2026-03-01T00:00:00+00:00",
    "period_end": "2026-03-01T23:59:59+00:00",
}

_COSTS_PAYLOAD = {
    "total_credits_used": 450,
    "credits_remaining": 550,
    "credits_total": 1000,
    "usage_by_event_type": {"api_call": 300, "agent_run": 150},
    "usage_by_agent": {"agent-1": 450},
    "period_start": "2026-03-01T00:00:00+00:00",
    "period_end": "2026-03-31T23:59:59+00:00",
}

_BUDGET_PAYLOAD = {
    "user_id": "11111111-1111-4111-a111-111111111111",
    "plan": "starter",
    "credits_total": 1000,
    "credits_used": 250.0,
    "credits_remaining": 750.0,
    "reset_date": "2026-04-01T00:00:00+00:00",
    "usage_percentage": 25.0,
}

_BASE_URL = "http://test-api.mutx.dev"


def _make_sync_client(response_data, status=200):
    transport = httpx.MockTransport(lambda request: httpx.Response(status, json=response_data))
    return httpx.Client(base_url=_BASE_URL, transport=transport)


def _make_async_client(response_data, status=200):
    async def handler(request):
        return httpx.Response(status, json=response_data)

    return httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(handler))


# ---------------------------------------------------------------------------
# AnalyticsSummary
# ---------------------------------------------------------------------------


class TestAnalyticsSummary:
    def test_parses_all_fields(self):
        summary = AnalyticsSummary(_SUMMARY_PAYLOAD)
        assert summary.total_agents == 5
        assert summary.active_agents == 3
        assert summary.total_deployments == 8
        assert summary.active_deployments == 4
        assert summary.total_runs == 120
        assert summary.successful_runs == 110
        assert summary.failed_runs == 10
        assert summary.total_api_calls == 5000
        assert summary.avg_latency_ms == 142.5

    def test_period_start_is_datetime(self):
        summary = AnalyticsSummary(_SUMMARY_PAYLOAD)
        assert isinstance(summary.period_start, datetime)
        assert summary.period_start.year == 2026
        assert summary.period_start.month == 3
        assert summary.period_start.day == 1

    def test_period_end_is_datetime(self):
        summary = AnalyticsSummary(_SUMMARY_PAYLOAD)
        assert isinstance(summary.period_end, datetime)
        assert summary.period_end.year == 2026
        assert summary.period_end.month == 3
        assert summary.period_end.day == 31

    def test_avg_latency_defaults_to_zero(self):
        payload = {k: v for k, v in _SUMMARY_PAYLOAD.items() if k != "avg_latency_ms"}
        payload["period_start"] = _SUMMARY_PAYLOAD["period_start"]
        payload["period_end"] = _SUMMARY_PAYLOAD["period_end"]
        summary = AnalyticsSummary(payload)
        assert summary.avg_latency_ms == 0.0

    def test_repr_contains_counts(self):
        summary = AnalyticsSummary(_SUMMARY_PAYLOAD)
        r = repr(summary)
        assert "AnalyticsSummary" in r
        assert "5" in r  # total_agents
        assert "120" in r  # total_runs

    def test_raw_data_preserved(self):
        summary = AnalyticsSummary(_SUMMARY_PAYLOAD)
        assert summary._data == _SUMMARY_PAYLOAD


# ---------------------------------------------------------------------------
# AgentMetricsSummary
# ---------------------------------------------------------------------------


class TestAgentMetricsSummary:
    def test_parses_all_fields(self):
        metrics = AgentMetricsSummary(_AGENT_PAYLOAD)
        assert metrics.agent_id == "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
        assert metrics.agent_name == "test-agent"
        assert metrics.total_runs == 50
        assert metrics.successful_runs == 45
        assert metrics.failed_runs == 5
        assert metrics.avg_cpu == 67.3
        assert metrics.avg_memory == 512.4
        assert metrics.total_requests == 300
        assert metrics.avg_latency_ms == 98.5

    def test_optional_fields_default(self):
        payload = {
            "agent_id": "aaa",
            "agent_name": "bare-agent",
            "total_runs": 0,
            "successful_runs": 0,
            "failed_runs": 0,
            "period_start": "2026-03-01T00:00:00+00:00",
            "period_end": "2026-03-31T23:59:59+00:00",
        }
        metrics = AgentMetricsSummary(payload)
        assert metrics.avg_cpu is None
        assert metrics.avg_memory is None
        assert metrics.total_requests == 0
        assert metrics.avg_latency_ms is None

    def test_period_parsed_as_datetime(self):
        metrics = AgentMetricsSummary(_AGENT_PAYLOAD)
        assert isinstance(metrics.period_start, datetime)
        assert isinstance(metrics.period_end, datetime)

    def test_raw_data_preserved(self):
        metrics = AgentMetricsSummary(_AGENT_PAYLOAD)
        assert metrics._data == _AGENT_PAYLOAD


# ---------------------------------------------------------------------------
# TimeSeriesPoint
# ---------------------------------------------------------------------------


class TestTimeSeriesPoint:
    def test_parses_iso_timestamp(self):
        point = TimeSeriesPoint({"timestamp": "2026-03-15T10:30:00+00:00", "value": 42.0})
        assert isinstance(point.timestamp, datetime)
        assert point.timestamp.year == 2026
        assert point.timestamp.month == 3
        assert point.value == 42.0

    def test_parses_z_suffix_timestamp(self):
        point = TimeSeriesPoint({"timestamp": "2026-03-15T10:30:00Z", "value": 7.0})
        assert isinstance(point.timestamp, datetime)
        assert point.value == 7.0

    def test_raw_data_preserved(self):
        data = {"timestamp": "2026-03-15T10:30:00Z", "value": 99.0}
        point = TimeSeriesPoint(data)
        assert point._data == data


# ---------------------------------------------------------------------------
# AnalyticsTimeSeries
# ---------------------------------------------------------------------------


class TestAnalyticsTimeSeries:
    def test_parses_metric_and_interval(self):
        ts = AnalyticsTimeSeries(_TS_PAYLOAD)
        assert ts.metric == "runs"
        assert ts.interval == "hour"

    def test_data_contains_time_series_points(self):
        ts = AnalyticsTimeSeries(_TS_PAYLOAD)
        assert len(ts.data) == 2
        assert all(isinstance(p, TimeSeriesPoint) for p in ts.data)
        assert ts.data[0].value == 10
        assert ts.data[1].value == 15

    def test_empty_data(self):
        payload = {
            "metric": "latency",
            "interval": "day",
            "data": [],
            "period_start": "2026-03-01T00:00:00+00:00",
            "period_end": "2026-03-31T23:59:59+00:00",
        }
        ts = AnalyticsTimeSeries(payload)
        assert ts.data == []

    def test_period_parsed_as_datetime(self):
        ts = AnalyticsTimeSeries(_TS_PAYLOAD)
        assert isinstance(ts.period_start, datetime)
        assert isinstance(ts.period_end, datetime)

    def test_raw_data_preserved(self):
        ts = AnalyticsTimeSeries(_TS_PAYLOAD)
        assert ts._data == _TS_PAYLOAD


# ---------------------------------------------------------------------------
# Analytics — client-type guards
# ---------------------------------------------------------------------------


class TestAnalyticsClientGuards:
    def test_sync_method_raises_on_async_client(self):
        client = httpx.AsyncClient()
        analytics = Analytics(client)
        with pytest.raises(RuntimeError, match="sync"):
            analytics.get_summary()

    def test_async_method_raises_on_sync_client(self):
        client = httpx.Client()
        analytics = Analytics(client)
        # Create a fresh event loop to avoid Python 3.10+ "no current event loop" error
        loop = asyncio.new_event_loop()
        with pytest.raises(RuntimeError, match="async"):
            loop.run_until_complete(analytics.aget_summary())
        loop.close()


# ---------------------------------------------------------------------------
# Analytics — sync get_summary
# ---------------------------------------------------------------------------


class TestAnalyticsSyncGetSummary:
    def test_returns_analytics_summary(self):
        client = _make_sync_client(_SUMMARY_PAYLOAD)
        analytics = Analytics(client)
        result = analytics.get_summary()
        assert isinstance(result, AnalyticsSummary)
        assert result.total_agents == 5

    def test_passes_period_params(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_SUMMARY_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_summary(period_start="7d", period_end="24h")
        assert captured["params"]["period_start"] == "7d"
        assert captured["params"]["period_end"] == "24h"

    def test_no_params_when_omitted(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_SUMMARY_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_summary()
        assert "period_start" not in captured["params"]

    def test_raises_on_http_error(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(500, json={"error": "boom"}))
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            analytics.get_summary()


# ---------------------------------------------------------------------------
# Analytics — sync get_agent_summary
# ---------------------------------------------------------------------------


class TestAnalyticsSyncGetAgentSummary:
    def test_returns_agent_metrics_summary(self):
        client = _make_sync_client(_AGENT_PAYLOAD)
        analytics = Analytics(client)
        result = analytics.get_agent_summary(agent_id="aaa-bbb")
        assert isinstance(result, AgentMetricsSummary)
        assert result.agent_name == "test-agent"

    def test_passes_agent_id_in_path(self):
        captured = {}

        def capture(request):
            captured["url"] = str(request.url)
            return httpx.Response(200, json=_AGENT_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_agent_summary(agent_id="aaa-bbb")
        assert "aaa-bbb" in captured["url"]

    def test_passes_period_params(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_AGENT_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_agent_summary(agent_id="aaa", period_start="30d", period_end="7d")
        assert captured["params"]["period_start"] == "30d"
        assert captured["params"]["period_end"] == "7d"

    def test_raises_on_http_error(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(404, json={"error": "not found"}))
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            analytics.get_agent_summary(agent_id="aaa")


# ---------------------------------------------------------------------------
# Analytics — sync get_timeseries
# ---------------------------------------------------------------------------


class TestAnalyticsSyncGetTimeseries:
    def test_returns_time_series(self):
        client = _make_sync_client(_TS_PAYLOAD)
        analytics = Analytics(client)
        result = analytics.get_timeseries(metric="runs")
        assert isinstance(result, AnalyticsTimeSeries)
        assert result.metric == "runs"

    def test_passes_metric_and_interval(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_TS_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_timeseries(metric="latency", interval="day")
        assert captured["params"]["metric"] == "latency"
        assert captured["params"]["interval"] == "day"

    def test_passes_agent_id_when_provided(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_TS_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_timeseries(metric="runs", agent_id="my-agent-uuid")
        assert captured["params"]["agent_id"] == "my-agent-uuid"

    def test_skips_agent_id_when_none(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_TS_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_timeseries(metric="runs")
        assert "agent_id" not in captured["params"]

    def test_raises_on_http_error(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(500, json={"error": "boom"}))
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            analytics.get_timeseries(metric="runs")


# ---------------------------------------------------------------------------
# Analytics — sync get_costs
# ---------------------------------------------------------------------------


class TestAnalyticsSyncGetCosts:
    def test_returns_dict(self):
        client = _make_sync_client(_COSTS_PAYLOAD)
        analytics = Analytics(client)
        result = analytics.get_costs()
        assert isinstance(result, dict)
        assert result["total_credits_used"] == 450

    def test_passes_period_params(self):
        captured = {}

        def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_COSTS_PAYLOAD)

        transport = httpx.MockTransport(capture)
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        analytics.get_costs(period_start="30d", period_end="7d")
        assert captured["params"]["period_start"] == "30d"
        assert captured["params"]["period_end"] == "7d"

    def test_raises_on_http_error(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(500, json={"error": "boom"}))
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            analytics.get_costs()


# ---------------------------------------------------------------------------
# Analytics — sync get_budget
# ---------------------------------------------------------------------------


class TestAnalyticsSyncGetBudget:
    def test_returns_dict(self):
        client = _make_sync_client(_BUDGET_PAYLOAD)
        analytics = Analytics(client)
        result = analytics.get_budget()
        assert isinstance(result, dict)
        assert result["plan"] == "starter"
        assert result["credits_used"] == 250.0

    def test_raises_on_http_error(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(500, json={"error": "boom"}))
        client = httpx.Client(base_url=_BASE_URL, transport=transport)
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            analytics.get_budget()


# ---------------------------------------------------------------------------
# Analytics — async methods
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestAnalyticsAsyncGetSummary:
    async def test_returns_analytics_summary(self):
        client = _make_async_client(_SUMMARY_PAYLOAD)
        analytics = Analytics(client)
        result = await analytics.aget_summary()
        assert isinstance(result, AnalyticsSummary)
        assert result.total_agents == 5

    async def test_passes_period_params(self):
        captured = {}

        async def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_SUMMARY_PAYLOAD)

        client = httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(capture))
        analytics = Analytics(client)
        await analytics.aget_summary(period_start="7d", period_end="24h")
        assert captured["params"]["period_start"] == "7d"

    async def test_raises_on_http_error(self):
        async def handler(request):
            return httpx.Response(500, json={"error": "boom"})

        client = httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(handler))
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            await analytics.aget_summary()


@pytest.mark.asyncio
class TestAnalyticsAsyncGetAgentSummary:
    async def test_returns_agent_metrics_summary(self):
        client = _make_async_client(_AGENT_PAYLOAD)
        analytics = Analytics(client)
        result = await analytics.aget_agent_summary(agent_id="aaa-bbb")
        assert isinstance(result, AgentMetricsSummary)
        assert result.agent_name == "test-agent"

    async def test_passes_agent_id_in_path(self):
        captured = {}

        async def capture(request):
            captured["url"] = str(request.url)
            return httpx.Response(200, json=_AGENT_PAYLOAD)

        client = httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(capture))
        analytics = Analytics(client)
        await analytics.aget_agent_summary(agent_id="aaa-bbb")
        assert "aaa-bbb" in captured["url"]


@pytest.mark.asyncio
class TestAnalyticsAsyncGetTimeseries:
    async def test_returns_time_series(self):
        client = _make_async_client(_TS_PAYLOAD)
        analytics = Analytics(client)
        result = await analytics.aget_timeseries(metric="runs")
        assert isinstance(result, AnalyticsTimeSeries)
        assert result.metric == "runs"

    async def test_passes_agent_id_when_provided(self):
        captured = {}

        async def capture(request):
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_TS_PAYLOAD)

        client = httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(capture))
        analytics = Analytics(client)
        await analytics.aget_timeseries(metric="runs", agent_id="my-agent-uuid")
        assert captured["params"]["agent_id"] == "my-agent-uuid"


@pytest.mark.asyncio
class TestAnalyticsAsyncGetCosts:
    async def test_returns_dict(self):
        client = _make_async_client(_COSTS_PAYLOAD)
        analytics = Analytics(client)
        result = await analytics.aget_costs()
        assert isinstance(result, dict)
        assert result["total_credits_used"] == 450

    async def test_raises_on_http_error(self):
        async def handler(request):
            return httpx.Response(500, json={"error": "boom"})

        client = httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(handler))
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            await analytics.aget_costs()


@pytest.mark.asyncio
class TestAnalyticsAsyncGetBudget:
    async def test_returns_dict(self):
        client = _make_async_client(_BUDGET_PAYLOAD)
        analytics = Analytics(client)
        result = await analytics.aget_budget()
        assert isinstance(result, dict)
        assert result["plan"] == "starter"

    async def test_raises_on_http_error(self):
        async def handler(request):
            return httpx.Response(500, json={"error": "boom"})

        client = httpx.AsyncClient(base_url=_BASE_URL, transport=httpx.MockTransport(handler))
        analytics = Analytics(client)
        with pytest.raises(httpx.HTTPStatusError):
            await analytics.aget_budget()
