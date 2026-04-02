"""
SDK contract tests for assistant module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import sys
import uuid
from pathlib import Path
from typing import Any

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

# assistant.py lives in the main MUTX repo SDK; the worktree SDK may not have it yet
import os as _os
_main_sdk = _os.environ.get("MUTX_SDK_PATH", "/Users/fortune/MUTX/sdk")
if _main_sdk not in sys.path:
    sys.path.insert(0, _main_sdk)

from mutx.assistant import (
    Assistant,
    AssistantChannel,
    AssistantHealth,
    AssistantOverview,
    AssistantSession,
    AssistantSkill,
    AssistantWakeup,
)


# ---------------------------------------------------------------------------
# Payload factories
# ---------------------------------------------------------------------------


def _skill_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-skill",
        "description": "A test skill",
        "version": "1.0.0",
        "installed": False,
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def _channel_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-channel",
        "type": "discord",
        "status": "active",
        "config": {},
    }
    payload.update(overrides)
    return payload


def _wakeup_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "phrase": "hey assistant",
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def _health_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "status": "ok",
        "version": "1.0.0",
        "uptime_seconds": 3600.0,
        "gateway_url": "https://gateway.mutx.dev",
        "last_check": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _session_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "session_id": str(uuid.uuid4()),
        "assistant_id": str(uuid.uuid4()),
        "status": "active",
        "model": "gpt-4",
        "created_at": "2026-04-01T00:00:00Z",
        "last_activity": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _overview_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "has_assistant": True,
        "recommended_template_id": None,
        "assistant": {"id": str(uuid.uuid4()), "name": "my-assistant"},
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Data model tests
# ---------------------------------------------------------------------------


def test_assistant_skill_parses_required_fields() -> None:
    skill = AssistantSkill(_skill_payload())
    assert skill.id is not None
    assert skill.name == "test-skill"
    assert skill.installed is False
    assert skill.enabled is True


def test_assistant_skill_parses_optional_fields() -> None:
    skill = AssistantSkill(_skill_payload(description="custom desc", version="2.0.0"))
    assert skill.description == "custom desc"
    assert skill.version == "2.0.0"


def test_assistant_skill_repr() -> None:
    skill = AssistantSkill(_skill_payload(installed=True))
    assert "AssistantSkill" in repr(skill)
    assert "installed=True" in repr(skill)


def test_assistant_skill_defaults() -> None:
    skill = AssistantSkill({"id": "abc123"})
    assert skill.name == ""
    assert skill.description == ""
    assert skill.version == ""
    assert skill.installed is False
    assert skill.enabled is True


def test_assistant_channel_parses_required_fields() -> None:
    ch = AssistantChannel(_channel_payload())
    assert ch.id is not None
    assert ch.name == "test-channel"
    assert ch.type == "discord"
    assert ch.status == "active"


def test_assistant_channel_defaults() -> None:
    ch = AssistantChannel({"id": "ch-1"})
    assert ch.name == ""
    assert ch.type == ""
    assert ch.status == ""
    assert ch.config == {}


def test_assistant_wakeup_parses_required_fields() -> None:
    w = AssistantWakeup(_wakeup_payload())
    assert w.id is not None
    assert w.phrase == "hey assistant"
    assert w.enabled is True


def test_assistant_wakeup_defaults() -> None:
    w = AssistantWakeup({"id": "w-1"})
    assert w.phrase == ""
    assert w.enabled is True


def test_assistant_health_parses_all_fields() -> None:
    h = AssistantHealth(_health_payload())
    assert h.status == "ok"
    assert h.version == "1.0.0"
    assert h.uptime_seconds == 3600.0
    assert h.gateway_url == "https://gateway.mutx.dev"


def test_assistant_health_defaults() -> None:
    h = AssistantHealth({})
    assert h.status == "unknown"
    assert h.version is None
    assert h.uptime_seconds is None


def test_assistant_session_parses_required_fields() -> None:
    s = AssistantSession(_session_payload())
    assert s.session_id is not None
    assert s.assistant_id is not None
    assert s.status == "active"
    assert s.model == "gpt-4"


def test_assistant_session_defaults() -> None:
    s = AssistantSession({})
    assert s.session_id == ""
    assert s.assistant_id == ""
    assert s.status == ""
    assert s.model is None


def test_assistant_overview_parses_required_fields() -> None:
    o = AssistantOverview(_overview_payload())
    assert o.has_assistant is True
    assert o.recommended_template_id is None
    assert o.assistant is not None


def test_assistant_overview_defaults() -> None:
    o = AssistantOverview({})
    assert o.has_assistant is False
    assert o.recommended_template_id is None
    assert o.assistant is None


# ---------------------------------------------------------------------------
# Assistant overview
# ---------------------------------------------------------------------------


def test_overview_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_overview_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.overview()

    assert captured["path"] == "/assistant/overview"
    assert captured["method"] == "GET"


def test_overview_passes_agent_id_param() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_overview_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.overview(agent_id=str(agent_id))

    assert captured["params"]["agent_id"] == str(agent_id)


def test_overview_returns_assistant_overview() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_overview_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.overview()
    assert isinstance(result, AssistantOverview)
    assert result.has_assistant is True


def test_aoverview_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_overview_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.aoverview())

    assert captured["path"] == "/assistant/overview"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Assistant skills
# ---------------------------------------------------------------------------


def test_skills_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_skill_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.skills(str(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/skills"
    assert captured["method"] == "GET"


def test_skills_returns_list_of_assistant_skill() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[_skill_payload(), _skill_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.skills(str(uuid.uuid4()))
    assert isinstance(result, list)
    assert all(isinstance(s, AssistantSkill) for s in result)
    assert len(result) == 2


def test_askills_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.askills(str(agent_id)))

    assert captured["path"] == f"/assistant/{agent_id}/skills"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Install skill
# ---------------------------------------------------------------------------


def test_install_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()
    skill_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_skill_payload(installed=True)])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.install_skill(str(agent_id), str(skill_id))

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "POST"
    assert isinstance(result, list)


def test_ainstall_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()
    skill_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.ainstall_skill(str(agent_id), str(skill_id)))

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "POST"


# ---------------------------------------------------------------------------
# Uninstall skill
# ---------------------------------------------------------------------------


def test_uninstall_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()
    skill_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    assistant.uninstall_skill(str(agent_id), str(skill_id))

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "DELETE"


def test_auninstall_skill_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()
    skill_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.auninstall_skill(str(agent_id), str(skill_id)))

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "DELETE"


# ---------------------------------------------------------------------------
# Assistant channels
# ---------------------------------------------------------------------------


def test_channels_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_channel_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.channels(str(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/channels"
    assert captured["method"] == "GET"
    assert isinstance(result, list)
    assert isinstance(result[0], AssistantChannel)


def test_achannels_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.achannels(str(agent_id)))

    assert captured["path"] == f"/assistant/{agent_id}/channels"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Assistant wakeups
# ---------------------------------------------------------------------------


def test_wakeups_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_wakeup_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.wakeups(str(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/wakeups"
    assert captured["method"] == "GET"
    assert isinstance(result, list)
    assert isinstance(result[0], AssistantWakeup)


def test_awakeups_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.awakeups(str(agent_id)))

    assert captured["path"] == f"/assistant/{agent_id}/wakeups"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Assistant health
# ---------------------------------------------------------------------------


def test_health_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_health_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.health(str(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/health"
    assert captured["method"] == "GET"
    assert isinstance(result, AssistantHealth)
    assert result.status == "ok"


def test_ahealth_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_health_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    result = asyncio.run(assistant.ahealth(str(agent_id)))

    assert captured["path"] == f"/assistant/{agent_id}/health"
    assert captured["method"] == "GET"
    assert isinstance(result, AssistantHealth)


# ---------------------------------------------------------------------------
# Assistant sessions
# ---------------------------------------------------------------------------


def test_sessions_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_session_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.sessions(str(agent_id))

    assert captured["path"] == f"/assistant/{agent_id}/sessions"
    assert captured["method"] == "GET"
    assert isinstance(result, list)
    assert isinstance(result[0], AssistantSession)


def test_asessions_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    agent_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    import asyncio

    asyncio.run(assistant.asessions(str(agent_id)))

    assert captured["path"] == f"/assistant/{agent_id}/sessions"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Client type enforcement
# ---------------------------------------------------------------------------


def test_overview_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.overview()


def test_skills_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.skills(str(uuid.uuid4()))


def test_install_skill_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.install_skill(str(uuid.uuid4()), str(uuid.uuid4()))


def test_uninstall_skill_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.uninstall_skill(str(uuid.uuid4()), str(uuid.uuid4()))


def test_channels_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.channels(str(uuid.uuid4()))


def test_wakeups_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.wakeups(str(uuid.uuid4()))


def test_health_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.health(str(uuid.uuid4()))


def test_sessions_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        assistant.sessions(str(uuid.uuid4()))


def test_aoverview_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(assistant.aoverview())


def test_askills_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    assistant = Assistant(client)

    with pytest.raises(RuntimeError, match="requires an async httpx.AsyncClient"):
        import asyncio

        asyncio.run(assistant.askills(str(uuid.uuid4())))


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


def test_methods_raise_for_status() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "internal error"})

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    with pytest.raises(httpx.HTTPStatusError):
        assistant.overview()


def test_health_returns_parsed_health_object() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_health_payload(status="degraded", uptime_seconds=None))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    assistant = Assistant(client)

    result = assistant.health(str(uuid.uuid4()))
    assert result.status == "degraded"
    assert result.uptime_seconds is None
