"""
SDK contract tests for assistant module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

import httpx
import pytest

from mutx.assistant import (
    Assistant,
    AssistantChannel,
    AssistantHealth,
    AssistantOverview,
    AssistantSession,
    AssistantSkill,
    AssistantWakeup,
)


def _assistant_skill_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "web-search",
        "description": "Search the web",
        "version": "1.0.0",
        "installed": True,
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def _assistant_channel_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "discord",
        "type": "discord",
        "status": "active",
        "config": {"token": "xxx"},
    }
    payload.update(overrides)
    return payload


def _assistant_wakeup_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "phrase": "hey assistant",
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def _assistant_health_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "status": "healthy",
        "version": "1.2.0",
        "uptime_seconds": 3600.0,
        "gateway_url": "https://gateway.mutx.dev",
        "last_check": "2026-03-15T10:00:00Z",
    }
    payload.update(overrides)
    return payload


def _assistant_session_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "session_id": str(uuid.uuid4()),
        "assistant_id": str(uuid.uuid4()),
        "status": "active",
        "model": "gpt-4",
        "created_at": "2026-03-15T09:00:00Z",
        "last_activity": "2026-03-15T10:00:00Z",
    }
    payload.update(overrides)
    return payload


def _assistant_overview_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "has_assistant": True,
        "recommended_template_id": "template-123",
        "assistant": {"id": str(uuid.uuid4()), "name": "my-assistant"},
    }
    payload.update(overrides)
    return payload


# ------------------------------------------------------------------
# Data-model tests
# ------------------------------------------------------------------

def test_assistant_skill_parses_fields() -> None:
    payload = _assistant_skill_payload()
    skill = AssistantSkill(payload)

    assert skill.id is not None
    assert skill.name == "web-search"
    assert skill.installed is True
    assert skill.enabled is True


def test_assistant_skill_repr() -> None:
    payload = _assistant_skill_payload()
    skill = AssistantSkill(payload)

    # repr shows id and installed status
    assert "installed=True" in repr(skill)


def test_assistant_channel_parses_fields() -> None:
    payload = _assistant_channel_payload()
    channel = AssistantChannel(payload)

    assert channel.type == "discord"
    assert channel.status == "active"
    assert isinstance(channel.config, dict)


def test_assistant_wakeup_parses_fields() -> None:
    payload = _assistant_wakeup_payload(phrase="wake up")
    wakeup = AssistantWakeup(payload)

    assert wakeup.phrase == "wake up"
    assert wakeup.enabled is True


def test_assistant_health_parses_fields() -> None:
    payload = _assistant_health_payload()
    health = AssistantHealth(payload)

    assert health.status == "healthy"
    assert health.version == "1.2.0"
    assert health.uptime_seconds == 3600.0


def test_assistant_session_parses_fields() -> None:
    payload = _assistant_session_payload()
    session = AssistantSession(payload)

    assert session.model == "gpt-4"
    assert session.status == "active"


def test_assistant_overview_parses_fields() -> None:
    payload = _assistant_overview_payload()
    overview = AssistantOverview(payload)

    assert overview.has_assistant is True
    assert overview.recommended_template_id == "template-123"
    assert overview.assistant is not None


# ------------------------------------------------------------------
# Sync client tests
# ------------------------------------------------------------------

def test_assistant_overview_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_assistant_overview_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.overview()

    assert captured["path"] == "/assistant/overview"
    assert captured["method"] == "GET"


def test_assistant_overview_with_agent_id_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_assistant_overview_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.overview(agent_id=agent_id)

    assert captured["params"]["agent_id"] == agent_id


def test_assistant_skills_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_assistant_skill_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.skills(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills"
    assert captured["method"] == "GET"
    assert len(result) == 1


def test_assistant_install_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_assistant_skill_payload(installed=True)])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.install_skill(agent_id, skill_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "POST"
    assert result[0].installed is True


def test_assistant_uninstall_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.uninstall_skill(agent_id, skill_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "DELETE"


def test_assistant_channels_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_channel_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.channels(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/channels"
    assert len(result) == 1


def test_assistant_wakeups_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_wakeup_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.wakeups(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/wakeups"
    assert len(result) == 1


def test_assistant_health_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_assistant_health_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.health(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/health"
    assert result.status == "healthy"


def test_assistant_sessions_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_session_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.sessions(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/sessions"
    assert len(result) == 1


# ------------------------------------------------------------------
# Async client tests
# ------------------------------------------------------------------

def test_assistant_aoverview_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_assistant_overview_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    asyncio.run(assistant.aoverview())

    assert captured["path"] == "/assistant/overview"


def test_assistant_askills_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_skill_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    result = asyncio.run(assistant.askills(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/skills"
    assert len(result) == 1


def test_assistant_ainstall_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_skill_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    asyncio.run(assistant.ainstall_skill(agent_id, skill_id))

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"


def test_assistant_auninstall_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    asyncio.run(assistant.auninstall_skill(agent_id, skill_id))

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"


def test_assistant_achannels_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_channel_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    result = asyncio.run(assistant.achannels(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/channels"


def test_assistant_awakeups_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_wakeup_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    result = asyncio.run(assistant.awakeups(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/wakeups"


def test_assistant_ahealth_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_assistant_health_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    result = asyncio.run(assistant.ahealth(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/health"
    assert result.status == "healthy"


def test_assistant_asessions_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_assistant_session_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio
    result = asyncio.run(assistant.asessions(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/sessions"


# ------------------------------------------------------------------
# Client type guard tests
# ------------------------------------------------------------------

def test_assistant_sync_methods_reject_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.overview()


def test_assistant_async_methods_reject_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    assistant = Assistant(client)

    import asyncio
    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        asyncio.run(assistant.aoverview())
