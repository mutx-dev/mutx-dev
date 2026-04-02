from __future__ import annotations

import sys
import types
from typing import Any

if "tenacity" not in sys.modules:
    tenacity = types.ModuleType("tenacity")

    def _identity_retry(*args, **kwargs):
        def decorator(fn):
            return fn

        return decorator

    tenacity.retry = _identity_retry
    tenacity.stop_after_attempt = lambda *args, **kwargs: None
    tenacity.wait_exponential = lambda *args, **kwargs: None
    sys.modules["tenacity"] = tenacity

from src.api.integrations.openclaw import OpenClawObservability


class DummyResponse:
    def raise_for_status(self) -> None:
        return None


class RecordingClient:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def post(
        self, url: str, json: Any = None, headers: dict[str, str] | None = None
    ) -> DummyResponse:
        self.calls.append({"method": "POST", "url": url, "json": json, "headers": headers or {}})
        return DummyResponse()

    def patch(
        self, url: str, json: Any = None, headers: dict[str, str] | None = None
    ) -> DummyResponse:
        self.calls.append({"method": "PATCH", "url": url, "json": json, "headers": headers or {}})
        return DummyResponse()

    def close(self) -> None:
        return None


def test_report_run_start_emits_valid_provenance_hash() -> None:
    client = RecordingClient()
    observability = OpenClawObservability("https://api.example.test", api_key="token")
    observability._client = client

    run_id = observability.report_run_start(
        agent_id="agent-123",
        agent_name="Personal Assistant",
        model="openai/gpt-5",
        tools=["bash", "web"],
        trigger="agent",
    )

    assert run_id
    assert len(client.calls) == 1
    payload = client.calls[0]["json"]
    assert client.calls[0]["url"] == "https://api.example.test/v1/observability/runs"
    assert payload["id"] == run_id
    assert len(payload["provenance"]["run_hash"]) == 64
    assert payload["provenance"]["run_hash"].isalnum()


def test_report_step_posts_step_list() -> None:
    client = RecordingClient()
    observability = OpenClawObservability("https://api.example.test")
    observability._client = client

    observability.report_step(
        run_id="run-123",
        step_type="tool_call",
        tool_name="bash",
        input_preview="ls",
        output_preview="ok",
        success=True,
        duration_ms=12,
    )

    assert len(client.calls) == 1
    assert client.calls[0]["url"] == "https://api.example.test/v1/observability/runs/run-123/steps"
    assert isinstance(client.calls[0]["json"], list)
    assert client.calls[0]["json"][0]["tool_name"] == "bash"


def test_report_run_end_includes_cost_totals_and_end_time() -> None:
    client = RecordingClient()
    observability = OpenClawObservability("https://api.example.test")
    observability._client = client

    observability.report_run_end(
        run_id="run-123",
        status="completed",
        outcome="success",
        input_tokens=120,
        output_tokens=80,
        cost_usd=0.42,
    )

    assert len(client.calls) == 1
    payload = client.calls[0]["json"]
    assert client.calls[0]["url"] == "https://api.example.test/v1/observability/runs/run-123/status"
    assert payload["total_tokens"] == 200
    assert payload["cost_usd"] == 0.42
    assert "ended_at" in payload
