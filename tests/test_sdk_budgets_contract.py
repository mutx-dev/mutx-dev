"""Contract tests for sdk/mutx/budgets.py."""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

import httpx
import pytest

from mutx.budgets import Budget, Budgets, UsageBreakdown, UsageByAgent, UsageByType


def _budget_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "user_id": str(uuid.uuid4()),
        "plan": "pro",
        "credits_total": 1000.0,
        "credits_used": 250.0,
        "credits_remaining": 750.0,
        "reset_date": "2026-04-01T00:00:00",
        "usage_percentage": 25.0,
    }
    payload.update(overrides)
    return payload


def _usage_breakdown_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "total_credits_used": 300.0,
        "credits_remaining": 700.0,
        "credits_total": 1000.0,
        "period_start": "2026-03-01T00:00:00",
        "period_end": "2026-03-31T23:59:59",
        "usage_by_agent": [
            {
                "agent_id": str(uuid.uuid4()),
                "agent_name": "coding-agent",
                "credits_used": 200.0,
                "event_count": 50,
            },
            {
                "agent_id": str(uuid.uuid4()),
                "agent_name": "research-agent",
                "credits_used": 100.0,
                "event_count": 25,
            },
        ],
        "usage_by_type": [
            {
                "event_type": "agent.run",
                "credits_used": 250.0,
                "event_count": 60,
            },
            {
                "event_type": "agent.complete",
                "credits_used": 50.0,
                "event_count": 15,
            },
        ],
    }
    payload.update(overrides)
    return payload


# ------------------------------------------------------------------
# Model unit tests
# ------------------------------------------------------------------

def test_budget_parses_all_fields() -> None:
    payload = _budget_payload()
    budget = Budget(payload)

    assert budget.user_id == payload["user_id"]
    assert budget.plan == "pro"
    assert budget.credits_total == 1000.0
    assert budget.credits_used == 250.0
    assert budget.credits_remaining == 750.0
    assert budget.reset_date == datetime(2026, 4, 1, 0, 0, 0)
    assert budget.usage_percentage == 25.0
    assert budget._data == payload


def test_budget_repr() -> None:
    budget = Budget(_budget_payload(plan="enterprise", credits_remaining=500.0, credits_total=2000.0))
    assert "plan=enterprise" in repr(budget)
    assert "remaining=500.0" in repr(budget)


def test_usage_by_agent_parses_all_fields() -> None:
    agent_id = str(uuid.uuid4())
    payload = {
        "agent_id": agent_id,
        "agent_name": "test-agent",
        "credits_used": 42.5,
        "event_count": 10,
    }
    agent = UsageByAgent(payload)

    assert agent.agent_id == agent_id
    assert agent.agent_name == "test-agent"
    assert agent.credits_used == 42.5
    assert agent.event_count == 10
    assert agent._data == payload


def test_usage_by_type_parses_all_fields() -> None:
    payload = {
        "event_type": "agent.started",
        "credits_used": 5.0,
        "event_count": 2,
    }
    usage_type = UsageByType(payload)

    assert usage_type.event_type == "agent.started"
    assert usage_type.credits_used == 5.0
    assert usage_type.event_count == 2
    assert usage_type._data == payload


def test_usage_breakdown_parses_all_fields() -> None:
    payload = _usage_breakdown_payload()
    breakdown = UsageBreakdown(payload)

    assert breakdown.total_credits_used == 300.0
    assert breakdown.credits_remaining == 700.0
    assert breakdown.credits_total == 1000.0
    assert breakdown.period_start == datetime(2026, 3, 1, 0, 0, 0)
    assert breakdown.period_end == datetime(2026, 3, 31, 23, 59, 59)
    assert len(breakdown.usage_by_agent) == 2
    assert breakdown.usage_by_agent[0].agent_name == "coding-agent"
    assert len(breakdown.usage_by_type) == 2
    assert breakdown.usage_by_type[0].event_type == "agent.run"


def test_usage_breakdown_handles_empty_usage_lists() -> None:
    payload = _usage_breakdown_payload(usage_by_agent=[], usage_by_type=[])
    breakdown = UsageBreakdown(payload)

    assert breakdown.usage_by_agent == []
    assert breakdown.usage_by_type == []


# ------------------------------------------------------------------
# Sync Budgets resource tests
# ------------------------------------------------------------------

def test_budgets_get_calls_budgets_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_budget_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budget = budgets.get()

    assert captured["path"] == "/budgets"
    assert isinstance(budget, Budget)
    assert budget.plan == "pro"


def test_budgets_get_usage_calls_usage_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    breakdown = budgets.get_usage()

    assert captured["path"] == "/budgets/usage"
    assert isinstance(breakdown, UsageBreakdown)
    assert len(breakdown.usage_by_agent) == 2


def test_budgets_get_usage_passes_period_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budgets.get_usage(period_start="24h", period_end="7d")

    assert captured["params"]["period_start"] == "24h"
    assert captured["params"]["period_end"] == "7d"


def test_budgets_get_usage_omits_absent_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budgets.get_usage()

    assert "period_start" not in captured["params"]
    assert "period_end" not in captured["params"]


@pytest.mark.asyncio
async def test_budgets_sync_methods_reject_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_budget_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        budgets = Budgets(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            budgets.get()


# ------------------------------------------------------------------
# Async Budgets resource tests
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_budgets_aget_calls_budgets_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_budget_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        budgets = Budgets(client)
        budget = await budgets.aget()

    assert captured["path"] == "/budgets"
    assert isinstance(budget, Budget)
    assert budget.plan == "pro"


@pytest.mark.asyncio
async def test_budgets_aget_usage_calls_usage_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        budgets = Budgets(client)
        breakdown = await budgets.aget_usage(period_start="30d")

    assert captured["path"] == "/budgets/usage"
    assert captured["params"]["period_start"] == "30d"
    assert isinstance(breakdown, UsageBreakdown)
    assert len(breakdown.usage_by_agent) == 2


@pytest.mark.asyncio
async def test_budgets_async_methods_reject_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_budget_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await budgets.aget()
