"""Contract tests for mutx.observability SDK module."""

from __future__ import annotations

import json
import uuid
import warnings
from typing import Any

import httpx
import pytest

from mutx.observability import Observability, _build_run_from_steps


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _run_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "agent_id": str(uuid.uuid4()),
        "status": "completed",
        "started_at": "2026-03-12T09:00:00Z",
        "ended_at": "2026-03-12T09:05:00Z",
        "steps": [
            {
                "type": "reasoning",
                "started_at": "2026-03-12T09:00:00Z",
                "ended_at": "2026-03-12T09:00:01Z",
                "content": "Thinking...",
            },
        ],
        "cost": {"input_tokens": 100, "output_tokens": 200},
        "provenance": {"run_hash": "abc123"},
        "runtime": "mutx",
        "trigger": "manual",
    }
    payload.update(overrides)
    return payload


def _eval_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "run_id": str(uuid.uuid4()),
        "pass": True,
        "score": 95.0,
        "task_type": "code_generation",
        "eval_layer": "unit",
        "expected_outcome": "function returns correct output",
        "actual_outcome": "function returns correct output",
        "metrics": {"cost_usd": 0.02, "duration_s": 12.5, "tool_calls": 3},
        "benchmark_id": "math-500",
    }
    payload.update(overrides)
    return payload


def _steps_payload(**overrides: Any) -> list[dict[str, Any]]:
    return [
        {
            "type": "tool_call",
            "started_at": "2026-03-12T09:00:02Z",
            "ended_at": "2026-03-12T09:00:03Z",
            "tool": "browser_navigate",
            "input": {"url": "https://example.com"},
        },
        {
            "type": "tool_result",
            "started_at": "2026-03-12T09:00:03Z",
            "ended_at": "2026-03-12T09:00:04Z",
            "tool": "browser_navigate",
            "output": "Navigated successfully",
        },
    ]


# ---------------------------------------------------------------------------
# Sync method contract tests
# ---------------------------------------------------------------------------

def test_report_run_posts_to_runs_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_run_payload(id=captured["json"]["id"]))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        run = obs.report_run(_run_payload())

    assert captured["path"] == "/v1/observability/runs"
    assert captured["json"]["agent_id"] == _run_payload()["agent_id"]
    assert run["status"] == "completed"


def test_report_run_raises_on_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "server error"})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        with pytest.raises(httpx.HTTPStatusError):
            obs.report_run(_run_payload())


def test_list_runs_without_filters() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(
            200,
            json={
                "items": [_run_payload()],
                "total": 1,
                "skip": 0,
                "limit": 50,
            },
        )

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.list_runs()

    assert captured["path"] == "/v1/observability/runs"
    assert captured["params"]["skip"] == "0"
    assert captured["params"]["limit"] == "50"
    assert result["total"] == 1
    assert len(result["items"]) == 1


def test_list_runs_with_all_filters() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json={"items": [], "total": 0, "skip": 10, "limit": 20})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.list_runs(
            skip=10,
            limit=20,
            agent_id="agent-123",
            status="completed",
            runtime="mutx",
            trigger="cron",
        )

    assert captured["params"]["skip"] == "10"
    assert captured["params"]["limit"] == "20"
    assert captured["params"]["agent_id"] == "agent-123"
    assert captured["params"]["status"] == "completed"
    assert captured["params"]["runtime"] == "mutx"
    assert captured["params"]["trigger"] == "cron"
    assert result["skip"] == 10
    assert result["limit"] == 20


def test_get_run_returns_run_detail() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_run_payload(id=run_id))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        run = obs.get_run(run_id)

    assert captured["path"] == f"/v1/observability/runs/{run_id}"
    assert run["id"] == run_id


def test_add_steps_posts_to_run_steps_endpoint() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())
    steps = _steps_payload()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"added": len(steps)})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.add_steps(run_id, steps)

    assert captured["path"] == f"/v1/observability/runs/{run_id}/steps"
    assert captured["json"] == steps
    assert result["added"] == 2


def test_get_eval_returns_eval_dict() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())
    eval_data = _eval_payload(run_id=run_id)

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=eval_data)

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.get_eval(run_id)

    assert captured["path"] == f"/v1/observability/runs/{run_id}/eval"
    assert result is not None
    assert result["pass"] is True
    assert result["score"] == 95.0


def test_get_eval_returns_none_on_404() -> None:
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "not found"})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.get_eval(run_id)

    assert result is None


def test_submit_eval_posts_eval_data() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())
    eval_data = {
        "id": str(uuid.uuid4()),
        "run_id": run_id,
        "pass": False,
        "score": 60.0,
        "task_type": "code_generation",
        "eval_layer": "unit",
        "expected_outcome": "function returns correct output",
        "actual_outcome": "function returns wrong output",
        "metrics": {"cost_usd": 0.01, "duration_s": 5.0, "tool_calls": 1},
        "benchmark_id": "math-500",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        response_payload = dict(captured["json"])
        response_payload["id"] = str(uuid.uuid4())
        return httpx.Response(201, json=response_payload)

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.submit_eval(run_id, eval_data)

    assert captured["path"] == f"/v1/observability/runs/{run_id}/eval"
    assert captured["json"]["pass"] is False
    assert captured["json"]["score"] == 60.0
    assert result["run_id"] == run_id


def test_get_provenance_returns_provenance_dict() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())
    provenance = {"run_hash": "abc123", "runtime": "mutx", "trigger": "cron"}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=provenance)

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.get_provenance(run_id)

    assert captured["path"] == f"/v1/observability/runs/{run_id}/provenance"
    assert result is not None
    assert result["run_hash"] == "abc123"


def test_get_provenance_returns_none_on_404() -> None:
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "not found"})

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.get_provenance(run_id)

    assert result is None


def test_update_status_with_all_fields() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_run_payload(id=run_id, status="completed"))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = obs.update_status(
            run_id,
            status="completed",
            outcome="success",
            ended_at="2026-03-12T09:05:00Z",
            duration_ms=300000,
            error=None,
        )

    assert captured["path"] == f"/v1/observability/runs/{run_id}/status"
    assert captured["json"]["status"] == "completed"
    assert captured["json"]["outcome"] == "success"
    assert captured["json"]["ended_at"] == "2026-03-12T09:05:00Z"
    assert captured["json"]["duration_ms"] == 300000


def test_update_status_with_partial_fields() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_run_payload(id=run_id))

    with httpx.Client(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        obs.update_status(run_id, status="failed", error="step timed out")

    assert captured["json"] == {"status": "failed", "error": "step timed out"}


# ---------------------------------------------------------------------------
# Async method contract tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_areport_run_posts_to_runs_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_run_payload(id=captured["json"]["id"]))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        run = await obs.areport_run(_run_payload())

    assert captured["path"] == "/v1/observability/runs"
    assert run["status"] == "completed"


@pytest.mark.asyncio
async def test_alist_runs_with_filters() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json={"items": [], "total": 0, "skip": 5, "limit": 25})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.alist_runs(skip=5, limit=25, agent_id="agent-456", status="running")

    assert captured["params"]["skip"] == "5"
    assert captured["params"]["limit"] == "25"
    assert captured["params"]["agent_id"] == "agent-456"
    assert captured["params"]["status"] == "running"
    assert result["skip"] == 5


@pytest.mark.asyncio
async def test_aget_run_returns_run_detail() -> None:
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_run_payload(id=run_id))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        run = await obs.aget_run(run_id)

    assert run["id"] == run_id


@pytest.mark.asyncio
async def test_aadd_steps_posts_to_run_steps_endpoint() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())
    steps = _steps_payload()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"added": len(steps)})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.aadd_steps(run_id, steps)

    assert captured["json"] == steps
    assert result["added"] == 2


@pytest.mark.asyncio
async def test_aget_eval_returns_eval_dict() -> None:
    run_id = str(uuid.uuid4())
    eval_data = _eval_payload(run_id=run_id)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=eval_data)

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.aget_eval(run_id)

    assert result is not None
    assert result["pass"] is True


@pytest.mark.asyncio
async def test_aget_eval_returns_none_on_404() -> None:
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "not found"})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.aget_eval(run_id)

    assert result is None


@pytest.mark.asyncio
async def test_asubmit_eval_posts_eval_data() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())
    eval_data = _eval_payload(score=80.0)

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_eval_payload(run_id=run_id, **captured["json"]))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.asubmit_eval(run_id, eval_data)

    assert captured["json"]["score"] == 80.0
    assert result["run_id"] == run_id


@pytest.mark.asyncio
async def test_aget_provenance_returns_provenance_dict() -> None:
    run_id = str(uuid.uuid4())
    provenance = {"run_hash": "xyz789", "runtime": "mutx", "trigger": "agent"}

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=provenance)

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.aget_provenance(run_id)

    assert result is not None
    assert result["run_hash"] == "xyz789"


@pytest.mark.asyncio
async def test_aget_provenance_returns_none_on_404() -> None:
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "not found"})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        result = await obs.aget_provenance(run_id)

    assert result is None


@pytest.mark.asyncio
async def test_aupdate_status_posts_status_update() -> None:
    captured: dict[str, Any] = {}
    run_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_run_payload(id=run_id, status="completed"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        await obs.aupdate_status(
            run_id,
            status="completed",
            outcome="success",
            duration_ms=60000,
        )

    assert captured["json"]["status"] == "completed"
    assert captured["json"]["outcome"] == "success"
    assert captured["json"]["duration_ms"] == 60000


# ---------------------------------------------------------------------------
# Client-type guard tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sync_method_raises_on_async_client() -> None:
    """Sync methods raise TypeError when called with an async httpx client."""

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={})

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        obs = Observability(client)
        with pytest.raises(TypeError, match="only available on MutxClient"):
            obs.report_run(_run_payload())


def test_async_method_warns_on_sync_client() -> None:
    """Async methods emit DeprecationWarning when called with a sync httpx client."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(201, json=_run_payload())

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        with httpx.Client(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            obs = Observability(client)
            # Suppress the DeprecationWarning raised as an error — we just want to
            # verify the warning is emitted, not that it crashes.
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", DeprecationWarning)
                try:
                    import asyncio
                    asyncio.run(obs.areport_run(_run_payload()))
                except DeprecationWarning:
                    pass  # expected

        deprecation_warnings = [
            w for w in caught if issubclass(w.category, DeprecationWarning)
            and "async" in str(w.message).lower()
        ]
        assert len(deprecation_warnings) >= 1


# ---------------------------------------------------------------------------
# _build_run_from_steps helper tests
# ---------------------------------------------------------------------------

def test_build_run_from_steps_returns_valid_run_dict() -> None:
    steps = _steps_payload()
    cost = {"input_tokens": 50, "output_tokens": 150}
    agent_id = "agent-test-123"

    run = _build_run_from_steps(
        agent_id=agent_id,
        steps=steps,
        cost=cost,
        status="running",
        runtime="test-runtime",
        trigger="webhook",
        metadata={"env": "ci"},
    )

    assert run["agent_id"] == agent_id
    assert run["status"] == "running"
    assert run["runtime"] == "test-runtime"
    assert run["trigger"] == "webhook"
    assert run["steps"] == steps
    assert run["cost"] == cost
    assert run["metadata"] == {"env": "ci"}
    assert "id" in run
    assert "started_at" in run
    assert "provenance" in run
    assert "run_hash" in run["provenance"]


def test_build_run_from_steps_generates_uuid7_id() -> None:
    run1 = _build_run_from_steps("agent-1", [], {"input_tokens": 0, "output_tokens": 0})
    run2 = _build_run_from_steps("agent-1", [], {"input_tokens": 0, "output_tokens": 0})

    # UUIDs should be unique
    assert run1["id"] != run2["id"]
    # Should be valid UUID format (36 chars with hyphens)
    assert len(run1["id"]) == 36
    assert run1["id"].count("-") == 4


def test_build_run_from_steps_default_values() -> None:
    run = _build_run_from_steps(
        agent_id="agent-x",
        steps=[],
        cost={"input_tokens": 10, "output_tokens": 20},
    )

    assert run["status"] == "completed"
    assert run["runtime"] == "mutx"
    assert run["trigger"] == "manual"
    assert "metadata" not in run


def test_build_run_from_steps_computes_run_hash() -> None:
    run = _build_run_from_steps(
        agent_id="agent-y",
        steps=[],
        cost={"input_tokens": 1, "output_tokens": 1},
        runtime="runtime-a",
        trigger="queue",
    )

    import hashlib

    expected_hash = hashlib.sha256(b"agent-y|runtime-a|queue").hexdigest()
    assert run["provenance"]["run_hash"] == expected_hash
