"""Contract tests for sdk.mutx.assistant module."""

from __future__ import annotations

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


# ---------------------------------------------------------------------------
# Payload helpers
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
        "config": {"token": "secret"},
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
        "version": "1.2.3",
        "uptime_seconds": 3600.0,
        "gateway_url": "https://gateway.test",
        "last_check": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _session_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "session_id": str(uuid.uuid4()),
        "assistant_id": str(uuid.uuid4()),
        "status": "active",
        "model": "gpt-4o",
        "created_at": "2026-04-03T00:00:00Z",
        "last_activity": "2026-04-03T00:30:00Z",
    }
    payload.update(overrides)
    return payload


def _overview_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "has_assistant": True,
        "recommended_template_id": "template-1",
        "assistant": {
            "id": str(uuid.uuid4()),
            "name": "my-assistant",
        },
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Parser tests
# ---------------------------------------------------------------------------

def test_assistant_skill_parser_maps_all_fields() -> None:
    skill = AssistantSkill(_skill_payload())
    assert skill.id is not None
    assert skill.name == "test-skill"
    assert skill.description == "A test skill"
    assert skill.version == "1.0.0"
    assert skill.installed is False
    assert skill.enabled is True
    assert skill._data is not None


def test_assistant_skill_parser_defaults_when_fields_missing() -> None:
    skill = AssistantSkill({"id": str(uuid.uuid4())})
    assert skill.name == ""
    assert skill.description == ""
    assert skill.version == ""
    assert skill.installed is False
    assert skill.enabled is True


def test_assistant_channel_parser_maps_all_fields() -> None:
    channel = AssistantChannel(_channel_payload())
    assert channel.id is not None
    assert channel.name == "test-channel"
    assert channel.type == "discord"
    assert channel.status == "active"
    assert isinstance(channel.config, dict)
    assert channel.config.get("token") == "secret"


def test_assistant_channel_parser_defaults_when_fields_missing() -> None:
    channel = AssistantChannel({"id": str(uuid.uuid4())})
    assert channel.name == ""
    assert channel.type == ""
    assert channel.status == ""
    assert channel.config == {}


def test_assistant_wakeup_parser_maps_all_fields() -> None:
    wakeup = AssistantWakeup(_wakeup_payload())
    assert wakeup.id is not None
    assert wakeup.phrase == "hey assistant"
    assert wakeup.enabled is True


def test_assistant_wakeup_parser_defaults_when_fields_missing() -> None:
    wakeup = AssistantWakeup({"id": str(uuid.uuid4())})
    assert wakeup.phrase == ""
    assert wakeup.enabled is True


def test_assistant_health_parser_maps_all_fields() -> None:
    health = AssistantHealth(_health_payload())
    assert health.status == "ok"
    assert health.version == "1.2.3"
    assert health.uptime_seconds == 3600.0
    assert health.gateway_url == "https://gateway.test"
    assert health.last_check == "2026-04-03T00:00:00Z"


def test_assistant_health_parser_defaults_when_fields_missing() -> None:
    health = AssistantHealth({})
    assert health.status == "unknown"
    assert health.version is None
    assert health.uptime_seconds is None


def test_assistant_session_parser_maps_all_fields() -> None:
    session = AssistantSession(_session_payload())
    assert session.session_id is not None
    assert session.assistant_id is not None
    assert session.status == "active"
    assert session.model == "gpt-4o"


def test_assistant_session_parser_defaults_when_fields_missing() -> None:
    session = AssistantSession({})
    assert session.session_id == ""
    assert session.assistant_id == ""
    assert session.status == ""
    assert session.model is None


def test_assistant_overview_parser_maps_all_fields() -> None:
    overview = AssistantOverview(_overview_payload())
    assert overview.has_assistant is True
    assert overview.recommended_template_id == "template-1"
    assert isinstance(overview.assistant, dict)


def test_assistant_overview_parser_defaults_when_fields_missing() -> None:
    overview = AssistantOverview({})
    assert overview.has_assistant is False
    assert overview.recommended_template_id is None
    assert overview.assistant is None


# ---------------------------------------------------------------------------
# Sync method contract tests
# ---------------------------------------------------------------------------

def test_overview_hits_route_without_agent_id() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_overview_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).overview()

    assert captured["path"] == "/assistant/overview"
    assert captured["params"] == {}
    assert isinstance(result, AssistantOverview)
    assert result.has_assistant is True


def test_overview_hits_route_with_agent_id() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=_overview_payload())

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).overview(agent_id=agent_id)

    assert captured["path"] == "/assistant/overview"
    assert captured["params"] == {"agent_id": agent_id}
    assert isinstance(result, AssistantOverview)


def test_skills_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_skill_payload(), _skill_payload(installed=True)])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).skills(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills"
    assert len(result) == 2
    assert all(isinstance(s, AssistantSkill) for s in result)
    assert result[1].installed is True


def test_install_skill_hits_post_route() -> None:
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_skill_payload(installed=True)])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).install_skill(agent_id, skill_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "POST"
    assert all(s.installed is True for s in result)


def test_uninstall_skill_hits_delete_route() -> None:
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).uninstall_skill(agent_id, skill_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "DELETE"
    assert result == []


def test_channels_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_channel_payload()])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).channels(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/channels"
    assert len(result) == 1
    assert isinstance(result[0], AssistantChannel)
    assert result[0].type == "discord"


def test_wakeups_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_wakeup_payload()])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).wakeups(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/wakeups"
    assert len(result) == 1
    assert isinstance(result[0], AssistantWakeup)
    assert result[0].phrase == "hey assistant"


def test_health_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_health_payload(status="degraded"))

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).health(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/health"
    assert isinstance(result, AssistantHealth)
    assert result.status == "degraded"


def test_sessions_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_session_payload(), _session_payload(status="closed")])

    with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
        result = Assistant(client).sessions(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/sessions"
    assert len(result) == 2
    assert all(isinstance(s, AssistantSession) for s in result)
    assert result[1].status == "closed"


def test_sync_methods_raise_when_client_is_async() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    assistant = Assistant(client)
    for method_name, args in [
        ("overview", ("agent-id",)),
        ("skills", ("agent-id",)),
        ("install_skill", ("agent-id", "skill-id")),
        ("uninstall_skill", ("agent-id", "skill-id")),
        ("channels", ("agent-id",)),
        ("wakeups", ("agent-id",)),
        ("health", ("agent-id",)),
        ("sessions", ("agent-id",)),
    ]:
        with pytest.raises(RuntimeError, match="sync.*httpx"):
            getattr(assistant, method_name)(*args)


# ---------------------------------------------------------------------------
# Async method contract tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_aoverview_hits_correct_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_overview_payload(has_assistant=False))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).aoverview()

    assert captured["path"] == "/assistant/overview"
    assert isinstance(result, AssistantOverview)
    assert result.has_assistant is False


@pytest.mark.asyncio
async def test_askills_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_skill_payload(name="async-skill")])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).askills(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills"
    assert len(result) == 1
    assert result[0].name == "async-skill"


@pytest.mark.asyncio
async def test_ainstall_skill_hits_post_route() -> None:
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_skill_payload(installed=True)])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).ainstall_skill(agent_id, skill_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "POST"
    assert all(s.installed is True for s in result)


@pytest.mark.asyncio
async def test_auninstall_skill_hits_delete_route() -> None:
    agent_id = str(uuid.uuid4())
    skill_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).auninstall_skill(agent_id, skill_id)

    assert captured["path"] == f"/assistant/{agent_id}/skills/{skill_id}"
    assert captured["method"] == "DELETE"
    assert result == []


@pytest.mark.asyncio
async def test_achannels_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_channel_payload(type="telegram")])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).achannels(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/channels"
    assert result[0].type == "telegram"


@pytest.mark.asyncio
async def test_awakeups_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_wakeup_payload(phrase="hello assistant")])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).awakeups(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/wakeups"
    assert result[0].phrase == "hello assistant"


@pytest.mark.asyncio
async def test_ahealth_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_health_payload(version="2.0.0"))

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).ahealth(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/health"
    assert result.version == "2.0.0"


@pytest.mark.asyncio
async def test_asessions_hits_correct_route() -> None:
    agent_id = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=[_session_payload(model="claude-3-opus")])

    async with httpx.AsyncClient(
        base_url="https://api.test",
        transport=httpx.MockTransport(handler),
    ) as client:
        result = await Assistant(client).asessions(agent_id)

    assert captured["path"] == f"/assistant/{agent_id}/sessions"
    assert result[0].model == "claude-3-opus"


@pytest.mark.asyncio
async def test_async_methods_raise_when_client_is_sync() -> None:
    with httpx.Client(base_url="https://api.test") as client:
        assistant = Assistant(client)
        for method_name, args in [
            ("aoverview", ("agent-id",)),
            ("askills", ("agent-id",)),
            ("ainstall_skill", ("agent-id", "skill-id")),
            ("auninstall_skill", ("agent-id", "skill-id")),
            ("achannels", ("agent-id",)),
            ("awakeups", ("agent-id",)),
            ("ahealth", ("agent-id",)),
            ("asessions", ("agent-id",)),
        ]:
            with pytest.raises(RuntimeError, match="async.*httpx"):
                await getattr(assistant, method_name)(*args)
