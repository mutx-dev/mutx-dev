"""Contract tests for sdk/mutx/onboarding.py."""

from __future__ import annotations

import json
import uuid
from typing import Any

import httpx
import pytest

from mutx.onboarding import Onboarding, OnboardingState, OnboardingStep


def _step_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": "step-profile",
        "name": "Profile Setup",
        "status": "completed",
        "completed_at": "2026-03-12T08:00:00",
    }
    payload.update(overrides)
    return payload


def _onboarding_state_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "user_id": str(uuid.uuid4()),
        "provider": "openclaw",
        "current_step": "step-profile",
        "status": "active",
        "steps": [
            _step_payload(id="step-profile", name="Profile Setup", status="completed", completed_at="2026-03-12T08:00:00"),
            _step_payload(id="step-keys", name="API Keys", status="pending", completed_at=None),
        ],
        "created_at": "2026-03-12T07:00:00",
        "updated_at": "2026-03-12T08:01:00",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# OnboardingStep
# ---------------------------------------------------------------------------

def test_onboarding_step_parses_required_fields() -> None:
    step = OnboardingStep({"id": "step-1", "name": "Setup", "status": "done"})

    assert step.id == "step-1"
    assert step.name == "Setup"
    assert step.status == "done"
    assert step.completed_at is None


def test_onboarding_step_parses_completed_at_when_present() -> None:
    step = OnboardingStep({"id": "step-1", "name": "Setup", "status": "done", "completed_at": "2026-03-12T10:30:00"})

    assert step.completed_at is not None
    assert step.completed_at.year == 2026
    assert step.completed_at.month == 3
    assert step.completed_at.day == 12


def test_onboarding_step_stores_raw_data() -> None:
    step = OnboardingStep({"id": "raw", "name": "Raw", "status": "pending", "extra": "value"})
    assert step._data["extra"] == "value"


# ---------------------------------------------------------------------------
# OnboardingState
# ---------------------------------------------------------------------------

def test_onboarding_state_parses_required_fields() -> None:
    state = OnboardingState({
        "user_id": "uid-123",
        "provider": "custom",
    })

    assert state.user_id == "uid-123"
    assert state.provider == "custom"
    assert state.current_step == ""
    assert state.status == "active"
    assert state.steps == []


def test_onboarding_state_parses_full_payload() -> None:
    payload = _onboarding_state_payload()
    state = OnboardingState(payload)

    assert state.user_id == payload["user_id"]
    assert state.provider == "openclaw"
    assert state.current_step == "step-profile"
    assert state.status == "active"
    assert len(state.steps) == 2
    assert state.steps[0].id == "step-profile"
    assert state.steps[1].id == "step-keys"
    assert state.created_at is not None
    assert state.updated_at is not None


def test_onboarding_state_repr() -> None:
    state = OnboardingState({"user_id": "u1", "provider": "test", "current_step": "step-x"})
    assert "test" in repr(state)
    assert "step-x" in repr(state)


# ---------------------------------------------------------------------------
# Onboarding.get_state  (sync)
# ---------------------------------------------------------------------------

def test_get_state_calls_correct_endpoint_with_provider_param() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_onboarding_state_payload(provider="github"))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    state = onboarding.get_state(provider="github")

    assert captured["path"] == "/onboarding"
    assert captured["params"] == {"provider": "github"}
    assert state.provider == "github"


def test_get_state_uses_default_openclaw_provider() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_onboarding_state_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    state = onboarding.get_state()

    assert captured["params"] == {"provider": "openclaw"}
    assert state.provider == "openclaw"


# ---------------------------------------------------------------------------
# Onboarding.update  (sync)
# ---------------------------------------------------------------------------

def test_update_sends_action_and_provider_by_default() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_onboarding_state_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    state = onboarding.update(action="complete_step")

    assert captured["path"] == "/onboarding"
    assert captured["json"]["action"] == "complete_step"
    assert captured["json"]["provider"] == "openclaw"
    assert "step" not in captured["json"]
    assert "payload" not in captured["json"]
    assert state.provider == "openclaw"


def test_update_includes_step_when_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_onboarding_state_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    onboarding.update(action="skip_step", step="step-profile")

    assert captured["json"]["step"] == "step-profile"


def test_update_includes_payload_when_provided() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_onboarding_state_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    onboarding.update(action="complete_step", payload={"note": "done"})

    assert captured["json"]["payload"] == {"note": "done"}


def test_update_respects_custom_provider() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_onboarding_state_payload(provider="github"))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    state = onboarding.update(action="complete_step", provider="github")

    assert captured["json"]["provider"] == "github"
    assert state.provider == "github"


# ---------------------------------------------------------------------------
# Onboarding.sync_methods_require_sync_client
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_state_sync_method_rejects_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_onboarding_state_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        onboarding = Onboarding(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            onboarding.get_state()


@pytest.mark.asyncio
async def test_update_sync_method_rejects_async_client() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_onboarding_state_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        onboarding = Onboarding(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            onboarding.update(action="complete_step")


# ---------------------------------------------------------------------------
# Onboarding.async_methods_require_async_client
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aget_state_async_method_rejects_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_onboarding_state_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await onboarding.aget_state(provider="openclaw")  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_aupdate_async_method_rejects_sync_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_onboarding_state_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    onboarding = Onboarding(client)
    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await onboarding.aupdate(action="complete_step")  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# Onboarding.aget_state  (async)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aget_state_calls_correct_endpoint() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_onboarding_state_payload(provider="github"))

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        onboarding = Onboarding(client)
        state = await onboarding.aget_state(provider="github")

    assert captured["path"] == "/onboarding"
    assert captured["params"] == {"provider": "github"}
    assert state.provider == "github"


@pytest.mark.asyncio
async def test_aget_state_uses_default_provider() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_onboarding_state_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        onboarding = Onboarding(client)
        state = await onboarding.aget_state()

    assert captured["params"] == {"provider": "openclaw"}
    assert state.provider == "openclaw"


# ---------------------------------------------------------------------------
# Onboarding.aupdate  (async)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aupdate_sends_action_and_provider() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_onboarding_state_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        onboarding = Onboarding(client)
        state = await onboarding.aupdate(action="skip_step", provider="openclaw")

    assert captured["path"] == "/onboarding"
    assert captured["json"]["action"] == "skip_step"
    assert captured["json"]["provider"] == "openclaw"
    assert state.provider == "openclaw"


@pytest.mark.asyncio
async def test_aupdate_includes_step_and_payload() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_onboarding_state_payload())

    async with httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    ) as client:
        onboarding = Onboarding(client)
        await onboarding.aupdate(
            action="complete_step",
            step="step-keys",
            payload={"key": "value"},
        )

    assert captured["json"]["step"] == "step-keys"
    assert captured["json"]["payload"] == {"key": "value"}
