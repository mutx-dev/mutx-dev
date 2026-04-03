"""SDK contract tests for budgets module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

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
        "reset_date": "2026-04-30T00:00:00",
        "usage_percentage": 25.0,
    }
    payload.update(overrides)
    return payload


def _usage_breakdown_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "total_credits_used": 250.0,
        "credits_remaining": 750.0,
        "credits_total": 1000.0,
        "period_start": "2026-03-01T00:00:00",
        "period_end": "2026-03-31T23:59:59",
        "usage_by_agent": [
            {
                "agent_id": str(uuid.uuid4()),
                "agent_name": "test-agent",
                "credits_used": 150.0,
                "event_count": 42,
            }
        ],
        "usage_by_type": [
            {
                "event_type": "api_call",
                "credits_used": 100.0,
                "event_count": 30,
            }
        ],
    }
    payload.update(overrides)
    return payload


def test_budgets_get_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_budget_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budgets.get()

    assert captured["path"] == "/budgets"
    assert captured["method"] == "GET"


def test_budgets_aget_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_budget_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    import asyncio

    asyncio.run(budgets.aget())

    assert captured["path"] == "/budgets"
    assert captured["method"] == "GET"


def test_budgets_get_usage_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budgets.get_usage()

    assert captured["path"] == "/budgets/usage"
    assert captured["method"] == "GET"


def test_budgets_get_usage_with_period_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    budgets.get_usage(period_start="7d", period_end="24h")

    assert captured["query"]["period_start"] == "7d"
    assert captured["query"]["period_end"] == "24h"


def test_budgets_aget_usage_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_usage_breakdown_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    budgets = Budgets(client)

    import asyncio

    asyncio.run(budgets.aget_usage())

    assert captured["path"] == "/budgets/usage"
    assert captured["method"] == "GET"


def test_budget_parses_required_fields() -> None:
    budget = Budget(_budget_payload())

    assert budget.user_id is not None
    assert budget.plan == "pro"
    assert budget.credits_total == 1000.0
    assert budget.credits_used == 250.0
    assert budget.credits_remaining == 750.0
    assert isinstance(budget.reset_date, datetime)
    assert budget.usage_percentage == 25.0


def test_budget_repr() -> None:
    budget = Budget(_budget_payload(plan="free", credits_remaining=500.0, credits_total=1000.0))
    assert "free" in repr(budget)
    assert "500" in repr(budget)


def test_usage_breakdown_parses_required_fields() -> None:
    breakdown = UsageBreakdown(_usage_breakdown_payload())

    assert breakdown.total_credits_used == 250.0
    assert breakdown.credits_remaining == 750.0
    assert breakdown.credits_total == 1000.0
    assert isinstance(breakdown.period_start, datetime)
    assert isinstance(breakdown.period_end, datetime)


def test_usage_breakdown_parses_nested_agent_list() -> None:
    breakdown = UsageBreakdown(_usage_breakdown_payload())

    assert len(breakdown.usage_by_agent) == 1
    agent = breakdown.usage_by_agent[0]
    assert isinstance(agent, UsageByAgent)
    assert agent.agent_name == "test-agent"
    assert agent.credits_used == 150.0
    assert agent.event_count == 42


def test_usage_breakdown_parses_nested_type_list() -> None:
    breakdown = UsageBreakdown(_usage_breakdown_payload())

    assert len(breakdown.usage_by_type) == 1
    usage_type = breakdown.usage_by_type[0]
    assert isinstance(usage_type, UsageByType)
    assert usage_type.event_type == "api_call"
    assert usage_type.credits_used == 100.0
    assert usage_type.event_count == 30


def test_usage_breakdown_handles_empty_nested_lists() -> None:
    breakdown = UsageBreakdown(
        _usage_breakdown_payload(usage_by_agent=[], usage_by_type=[])
    )

    assert breakdown.usage_by_agent == []
    assert breakdown.usage_by_type == []


def test_usage_by_agent_parses_fields() -> None:
    agent = UsageByAgent(
        {
            "agent_id": str(uuid.uuid4()),
            "agent_name": "my-agent",
            "credits_used": 99.5,
            "event_count": 10,
        }
    )

    assert agent.agent_name == "my-agent"
    assert agent.credits_used == 99.5
    assert agent.event_count == 10


def test_usage_by_type_parses_fields() -> None:
    usage_type = UsageByType(
        {
            "event_type": "webhook",
            "credits_used": 55.0,
            "event_count": 7,
        }
    )

    assert usage_type.event_type == "webhook"
    assert usage_type.credits_used == 55.0
    assert usage_type.event_count == 7


def test_budgets_get_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    budgets = Budgets(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        budgets.get()


def test_budgets_get_usage_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    budgets = Budgets(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        budgets.get_usage()


def test_budgets_aget_rejects_sync_client() -> None:
    import asyncio
    client = httpx.Client(base_url="https://api.test")
    budgets = Budgets(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(budgets.aget())


def test_budgets_aget_usage_rejects_sync_client() -> None:
    import asyncio
    client = httpx.Client(base_url="https://api.test")
    budgets = Budgets(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(budgets.aget_usage())
