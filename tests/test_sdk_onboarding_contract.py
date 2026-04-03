"""Contract tests for sdk.mutx.onboarding module."""

from __future__ import annotations

import uuid
from typing import Any

import httpx
import pytest

from mutx.onboarding import Onboarding, OnboardingState, OnboardingStep


# ---------------------------------------------------------------------------
# Payload helpers
# ---------------------------------------------------------------------------

def _step_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-step",
        "status": "pending",
        "completed_at": None,
    }
    payload.update(overrides)
    return payload


def _state_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "user_id": str(uuid.uuid4()),
        "provider": "openclaw",
        "current_step": "step-1",
        "status": "active",
        "steps": [_step_payload(id="step-1", name="Setup", status="completed", completed_at="2026-04-01T10:00:00"), _step_payload(id="step-2", name="Configure", status="pending")],  # noqa: E501
        "created_at": "2026-04-01T09:00:00",
        "updated_at": "2026-04-01T10:00:00",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Parser tests
# ---------------------------------------------------------------------------

def test_onboarding_step_parser_maps_all_fields() -> None:
    step = OnboardingStep(
        {
            "id": "step-abc",
            "name": "Setup",
            "status": "completed",
            "completed_at": "2026-04-01T10:00:00",
        }
    )
    assert step.id == "step-abc"
    assert step.name == "Setup"
    assert step.status == "completed"
    assert step.completed_at is not None
    assert step._data is not None


def test_onboarding_step_parser_defaults_status_and_completed_at() -> None:
    step = OnboardingStep({"id": "step-xyz", "name": "Test"})
    assert step.name == "Test"
    assert step.status == "pending"
    assert step.completed_at is None


def test_onboarding_state_parser_maps_all_fields() -> None:
    state = OnboardingState(
        {
            "user_id": "user-123",
            "provider": "github",
            "current_step": "step-2",
            "status": "active",
            "steps": [_step_payload(id="step-1"), _step_payload(id="step-2")],
            "created_at": "2026-04-01T09:00:00",
            "updated_at": "2026-04-02T08:00:00",
        }
    )
    assert state.user_id == "user-123"
    assert state.provider == "github"
    assert state.current_step == "step-2"
    assert state.status == "active"
    assert len(state.steps) == 2
    assert all(isinstance(s, OnboardingStep) for s in state.steps)
    assert state.created_at is not None
    assert state.updated_at is not None
    assert state._data is not None


def test_onboarding_state_parser_defaults_when_fields_missing() -> None:
    state = OnboardingState({"user_id": "user-456", "provider": "openclaw"})
    assert state.current_step == ""
    assert state.status == "active"
    assert state.steps == []
    assert state.created_at is None
    assert state.updated_at is None


def test_onboarding_state_repr() -> None:
    state = OnboardingState({"user_id": "user-789", "provider": "openclaw", "current_step": "step-1"})
    assert "openclaw" in repr(state)
    assert "step-1" in repr(state)


# ---------------------------------------------------------------------------
# Sync method contract tests
# ---------------------------------------------------------------------------

def test_get_state_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_state_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Onboarding(client).get_state()

    assert captured["path"] == "/onboarding"
    assert captured["params"] == {"provider": "openclaw"}
    assert isinstance(result, OnboardingState)
    assert result.provider == "openclaw"
    assert len(result.steps) == 2


def test_get_state_accepts_provider_param() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_state_payload(provider="github"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Onboarding(client).get_state(provider="github")

    assert captured["path"] == "/onboarding"
    assert captured["params"] == {"provider": "github"}
    assert result.provider == "github"


def test_update_hits_post_route_with_action() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = dict(httpx.URL(request.url).path if False else request.content and __import__("json").loads(request.content))
        return httpx.Response(200, json=_state_payload(current_step="step-2", status="updated"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Onboarding(client).update(action="complete_step", step="step-1")

    assert captured["path"] == "/onboarding"
    assert captured["method"] == "POST"
    assert captured["json"]["action"] == "complete_step"
    assert captured["json"]["step"] == "step-1"
    assert captured["json"]["provider"] == "openclaw"
    assert isinstance(result, OnboardingState)
    assert result.current_step == "step-2"


def test_update_accepts_payload() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_state_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        Onboarding(client).update(action="skip_step", step="step-2", payload={"reason": "testing"})

    assert captured["json"]["payload"] == {"reason": "testing"}


def test_update_accepts_provider_override() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_state_payload(provider="discord"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Onboarding(client).update(action="complete_step", provider="discord")

    assert captured["json"]["provider"] == "discord"
    assert result.provider == "discord"


def test_sync_methods_raise_when_client_is_async() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    onboarding = Onboarding(client)
    for method_name, args in [
        ("get_state", ()),
        ("update", ("complete_step",)),
    ]:
        with pytest.raises(RuntimeError, match="sync.*httpx"):
            getattr(onboarding, method_name)(*args)


# ---------------------------------------------------------------------------
# Async method contract tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aget_state_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_state_payload(provider="github"))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Onboarding(client).aget_state(provider="github")

    assert captured["path"] == "/onboarding"
    assert captured["params"] == {"provider": "github"}
    assert isinstance(result, OnboardingState)
    assert result.provider == "github"


@pytest.mark.asyncio
async def test_aupdate_hits_post_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        import json
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_state_payload(current_step="step-3"))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Onboarding(client).aupdate(action="skip_step", step="step-2", payload={"note": "skipping"})

    assert captured["path"] == "/onboarding"
    assert captured["method"] == "POST"
    assert captured["json"]["action"] == "skip_step"
    assert captured["json"]["step"] == "step-2"
    assert captured["json"]["payload"] == {"note": "skipping"}
    assert result.current_step == "step-3"


@pytest.mark.asyncio
async def test_async_methods_raise_when_client_is_sync() -> None:
    with httpx.Client(base_url="https://api.test") as client:
        onboarding = Onboarding(client)
        for method_name, args in [
            ("aget_state", ()),
            ("aupdate", ("complete_step",)),
        ]:
            with pytest.raises(RuntimeError, match="async.*httpx"):
                await getattr(onboarding, method_name)(*args)
