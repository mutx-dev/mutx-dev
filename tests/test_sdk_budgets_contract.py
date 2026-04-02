"""
SDK contract tests for budgets module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import pytest

from mutx.budgets import Budget, Budgets, UsageBreakdown, UsageByAgent, UsageByType


def _budget_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "user_id": str(uuid.uuid4()),
        "plan": "pro",
        "credits_total": 1000.0,
        "credits_used": 250.0,
        "credits_remaining": 750.0,
        "reset_date": now,
        "usage_percentage": 25.0,
    }
    payload.update(overrides)
    return payload


def _usage_by_agent_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "agent_id": str(uuid.uuid4()),
        "agent_name": "test-agent",
        "credits_used": 50.0,
        "event_count": 120,
    }
    payload.update(overrides)
    return payload


def _usage_by_type_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "event_type": "api_call",
        "credits_used": 30.0,
        "event_count": 80,
    }
    payload.update(overrides)
    return payload


def _usage_breakdown_payload(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "total_credits_used": 250.0,
        "credits_remaining": 750.0,
        "credits_total": 1000.0,
        "period_start": now,
        "period_end": now,
        "usage_by_agent": [_usage_by_agent_payload(), _usage_by_agent_payload(agent_name="other-agent")],
        "usage_by_type": [_usage_by_type_payload(), _usage_by_type_payload(event_type="deployment")],
    }
    payload.update(overrides)
    return payload


# ------------------------------------------------------------------
# Data-model tests
# ------------------------------------------------------------------

def test_budget_parses_fields() -> None:
    payload = _budget_payload()
    budget = Budget(payload)

    assert budget.user_id is not None
    assert budget.plan == "pro"
    assert budget.credits_total == 1000.0
    assert budget.credits_used == 250.0
    assert budget.credits_remaining == 750.0
    assert budget.usage_percentage == 25.0


def test_budget_repr() -> None:
    payload = _budget_payload(plan="enterprise", credits_total=5000.0, credits_remaining=3500.0)
    budget = Budget(payload)

    repr_str = repr(budget)
    assert "enterprise" in repr_str
    assert "3500" in repr_str


def test_usage_by_agent_parses_fields() -> None:
    payload = _usage_by_agent_payload()
    usage = UsageByAgent(payload)

    assert usage.agent_id is not None
    assert usage.agent_name == "test-agent"
    assert usage.credits_used == 50.0
    assert usage.event_count == 120


def test_usage_by_type_parses_fields() -> None:
    payload = _usage_by_type_payload(event_type="webhook", credits_used=15.0, event_count=45)
    usage = UsageByType(payload)

    assert usage.event_type == "webhook"
    assert usage.credits_used == 15.0
    assert usage.event_count == 45


def test_usage_breakdown_parses_nested_usage() -> None:
    payload = _usage_breakdown_payload()
    breakdown = UsageBreakdown(payload)

    assert breakdown.total_credits_used == 250.0
    assert breakdown.credits_total == 1000.0
    assert len(breakdown.usage_by_agent) == 2
    assert len(breakdown.usage_by_type) == 2
    assert breakdown.usage_by_agent[0].agent_name == "test-agent"
    assert breakdown.usage_by_type[0].event_type == "api_call"


# ------------------------------------------------------------------
# Sync client tests
# ------------------------------------------------------------------

def test_budgets_get_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_budget_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    result = budgets.get()

    assert captured["path"] == "/budgets"
    assert captured["method"] == "GET"
    assert isinstance(result, Budget)
    assert result.plan == "pro"


def test_budgets_get_usage_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    result = budgets.get_usage(period_start="7d", period_end="now")

    assert captured["path"] == "/budgets/usage"
    assert captured["params"]["period_start"] == "7d"
    assert captured["params"]["period_end"] == "now"
    assert isinstance(result, UsageBreakdown)
    assert result.total_credits_used == 250.0


def test_budgets_get_usage_without_period_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budgets.get_usage()

    assert "period_start" not in captured["params"]
    assert "period_end" not in captured["params"]


# ------------------------------------------------------------------
# Async client tests
# ------------------------------------------------------------------

def test_budgets_aget_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_budget_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    import asyncio
    result = asyncio.run(budgets.aget())

    assert captured["path"] == "/budgets"
    assert captured["method"] == "GET"
    assert isinstance(result, Budget)


def test_budgets_aget_usage_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    import asyncio
    result = asyncio.run(budgets.aget_usage(period_start="30d"))

    assert captured["path"] == "/budgets/usage"
    assert captured["params"]["period_start"] == "30d"
    assert isinstance(result, UsageBreakdown)


def test_budgets_aget_usage_without_params() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    import asyncio
    asyncio.run(budgets.aget_usage())

    assert "period_start" not in captured["params"]


# ------------------------------------------------------------------
# Client type guard tests
# ------------------------------------------------------------------

def test_budgets_sync_methods_reject_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    budgets = Budgets(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        budgets.get()


def test_budgets_async_methods_reject_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    budgets = Budgets(client)

    import asyncio
    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(budgets.aget())
