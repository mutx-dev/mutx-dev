"""Contract tests for sdk/mutx/assistant.py."""

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


# ---------------------------------------------------------------------------
# Payload helpers
# ---------------------------------------------------------------------------

def _skill_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": "web_search",
        "name": "Web Search",
        "description": "Search the web",
        "version": "1.0.0",
        "installed": True,
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def _channel_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "webchat",
        "type": "webchat",
        "status": "online",
        "config": {"mode": "pairing"},
    }
    payload.update(overrides)
    return payload


def _wakeup_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "phrase": "hey cipher",
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def _health_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "status": "ok",
        "version": "1.0.0",
        "uptime_seconds": 3600.0,
        "gateway_url": "http://localhost:18789",
        "last_check": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _session_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "session_id": str(uuid.uuid4()),
        "assistant_id": str(uuid.uuid4()),
        "status": "active",
        "model": "qwen3-4b",
        "created_at": "2026-04-01T10:00:00Z",
        "last_activity": "2026-04-03T00:00:00Z",
    }
    payload.update(overrides)
    return payload


def _overview_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "has_assistant": True,
        "recommended_template_id": "personal_assistant",
        "assistant": {
            "id": str(uuid.uuid4()),
            "name": "test-assistant",
            "type": "openclaw",
        },
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------

class TestAssistantSkillModel:
    def test_required_fields(self) -> None:
        data = {"id": "web_search", "name": "Web Search"}
        skill = AssistantSkill(data)
        assert skill.id == "web_search"
        assert skill.name == "Web Search"

    def test_optional_fields_default(self) -> None:
        data = {"id": "web_search"}
        skill = AssistantSkill(data)
        assert skill.description == ""
        assert skill.version == ""
        assert skill.installed is False
        assert skill.enabled is True

    def test_all_fields(self) -> None:
        data = _skill_payload()
        skill = AssistantSkill(data)
        assert skill.id == "web_search"
        assert skill.name == "Web Search"
        assert skill.description == "Search the web"
        assert skill.version == "1.0.0"
        assert skill.installed is True
        assert skill.enabled is True
        assert skill._data == data

    def test_repr(self) -> None:
        skill = AssistantSkill({"id": "web_search", "installed": True})
        assert "web_search" in repr(skill)
        assert "installed=True" in repr(skill)


class TestAssistantChannelModel:
    def test_required_fields(self) -> None:
        data = {"id": "ch-1", "name": "webchat", "type": "webchat"}
        ch = AssistantChannel(data)
        assert ch.id == "ch-1"
        assert ch.name == "webchat"
        assert ch.type == "webchat"

    def test_optional_fields_default(self) -> None:
        data = {"id": "ch-1"}
        ch = AssistantChannel(data)
        assert ch.status == ""
        assert ch.config == {}

    def test_all_fields(self) -> None:
        data = _channel_payload()
        ch = AssistantChannel(data)
        assert ch.name == "webchat"
        assert ch.type == "webchat"
        assert ch.status == "online"
        assert ch.config == {"mode": "pairing"}
        assert ch._data == data


class TestAssistantWakeupModel:
    def test_required_fields(self) -> None:
        data = {"id": "wk-1", "phrase": "hey cipher"}
        w = AssistantWakeup(data)
        assert w.id == "wk-1"
        assert w.phrase == "hey cipher"

    def test_optional_fields_default(self) -> None:
        data = {"id": "wk-1"}
        w = AssistantWakeup(data)
        assert w.enabled is True

    def test_all_fields(self) -> None:
        data = _wakeup_payload()
        w = AssistantWakeup(data)
        assert w.phrase == "hey cipher"
        assert w.enabled is True
        assert w._data == data


class TestAssistantHealthModel:
    def test_required_fields(self) -> None:
        data: dict[str, Any] = {}
        h = AssistantHealth(data)
        assert h.status == "unknown"
        assert h.version is None
        assert h.uptime_seconds is None

    def test_all_fields(self) -> None:
        data = _health_payload()
        h = AssistantHealth(data)
        assert h.status == "ok"
        assert h.version == "1.0.0"
        assert h.uptime_seconds == 3600.0
        assert h.gateway_url == "http://localhost:18789"
        assert h.last_check == "2026-04-03T00:00:00Z"
        assert h._data == data


class TestAssistantSessionModel:
    def test_required_fields(self) -> None:
        data: dict[str, Any] = {}
        s = AssistantSession(data)
        assert s.session_id == ""
        assert s.assistant_id == ""
        assert s.status == ""

    def test_all_fields(self) -> None:
        data = _session_payload()
        s = AssistantSession(data)
        assert s.session_id != ""
        assert s.status == "active"
        assert s.model == "qwen3-4b"
        assert s.created_at == "2026-04-01T10:00:00Z"
        assert s.last_activity == "2026-04-03T00:00:00Z"
        assert s._data == data


class TestAssistantOverviewModel:
    def test_empty_state(self) -> None:
        data: dict[str, Any] = {}
        o = AssistantOverview(data)
        assert o.has_assistant is False
        assert o.recommended_template_id is None
        assert o.assistant is None

    def test_with_assistant(self) -> None:
        data = _overview_payload()
        o = AssistantOverview(data)
        assert o.has_assistant is True
        assert o.recommended_template_id == "personal_assistant"
        assert o.assistant["name"] == "test-assistant"


# ---------------------------------------------------------------------------
# Sync client — SDK method tests
# ---------------------------------------------------------------------------

class TestAssistantSyncOverview:
    def test_overview_without_agent_id(self) -> None:
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_overview_payload())

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            result = assistant.overview()

        assert captured["path"] == "/assistant/overview"
        assert captured["params"] == {}
        assert isinstance(result, AssistantOverview)
        assert result.has_assistant is True

    def test_overview_with_agent_id(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_overview_payload())

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            result = assistant.overview(agent_id=agent_id)

        assert captured["path"] == "/assistant/overview"
        assert captured["params"]["agent_id"] == agent_id
        assert isinstance(result, AssistantOverview)


class TestAssistantSyncSkills:
    def test_skills_returns_list_of_skills(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_skill_payload(), _skill_payload(id="memory", name="Memory")])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            skills = assistant.skills(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/skills"
        assert len(skills) == 2
        assert all(isinstance(s, AssistantSkill) for s in skills)
        assert skills[0].id == "web_search"
        assert skills[1].id == "memory"


class TestAssistantSyncInstallSkill:
    def test_install_skill_posts_and_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json=[_skill_payload(id="browser_control", installed=True)])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            skills = assistant.install_skill(agent_id, "browser_control")

        assert captured["path"] == f"/assistant/{agent_id}/skills/browser_control"
        assert captured["method"] == "POST"
        assert len(skills) == 1
        assert skills[0].installed is True


class TestAssistantSyncUninstallSkill:
    def test_uninstall_skill_deletes_and_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json=[_skill_payload(id="browser_control", installed=False)])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            skills = assistant.uninstall_skill(agent_id, "browser_control")

        assert captured["path"] == f"/assistant/{agent_id}/skills/browser_control"
        assert captured["method"] == "DELETE"
        assert len(skills) == 1
        assert skills[0].installed is False


class TestAssistantSyncChannels:
    def test_channels_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_channel_payload(), _channel_payload(name="discord")])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            channels = assistant.channels(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/channels"
        assert len(channels) == 2
        assert all(isinstance(c, AssistantChannel) for c in channels)


class TestAssistantSyncWakeups:
    def test_wakeups_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_wakeup_payload(), _wakeup_payload(phrase="hey bot")])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            wakeups = assistant.wakeups(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/wakeups"
        assert len(wakeups) == 2
        assert all(isinstance(w, AssistantWakeup) for w in wakeups)


class TestAssistantSyncHealth:
    def test_health_returns_health_object(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=_health_payload())

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            health = assistant.health(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/health"
        assert isinstance(health, AssistantHealth)
        assert health.status == "ok"
        assert health.version == "1.0.0"


class TestAssistantSyncSessions:
    def test_sessions_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_session_payload(), _session_payload(status="idle")])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            sessions = assistant.sessions(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/sessions"
        assert len(sessions) == 2
        assert all(isinstance(s, AssistantSession) for s in sessions)


class TestAssistantSyncRejectsAsyncClient:
    """Sync methods must reject async httpx.AsyncClient."""

    @pytest.mark.asyncio
    async def test_overview_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_overview_payload())

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.overview()

    @pytest.mark.asyncio
    async def test_skills_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.skills(str(uuid.uuid4()))

    @pytest.mark.asyncio
    async def test_install_skill_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.install_skill(str(uuid.uuid4()), "web_search")

    @pytest.mark.asyncio
    async def test_uninstall_skill_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.uninstall_skill(str(uuid.uuid4()), "web_search")

    @pytest.mark.asyncio
    async def test_channels_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.channels(str(uuid.uuid4()))

    @pytest.mark.asyncio
    async def test_wakeups_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.wakeups(str(uuid.uuid4()))

    @pytest.mark.asyncio
    async def test_health_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_health_payload())

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.health(str(uuid.uuid4()))

    @pytest.mark.asyncio
    async def test_sessions_rejects_async_client(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        async with httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="sync httpx.Client"):
                assistant.sessions(str(uuid.uuid4()))


# ---------------------------------------------------------------------------
# Async client — SDK async method tests
# ---------------------------------------------------------------------------

class TestAssistantAsyncOverview:
    @pytest.mark.asyncio
    async def test_aoverview_without_agent_id(self) -> None:
        captured: dict[str, Any] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_overview_payload())

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            result = await assistant.aoverview()

        assert captured["path"] == "/assistant/overview"
        assert captured["params"] == {}
        assert isinstance(result, AssistantOverview)

    @pytest.mark.asyncio
    async def test_aoverview_with_agent_id(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["params"] = dict(request.url.params)
            return httpx.Response(200, json=_overview_payload())

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            result = await assistant.aoverview(agent_id=agent_id)

        assert captured["path"] == "/assistant/overview"
        assert captured["params"]["agent_id"] == agent_id
        assert isinstance(result, AssistantOverview)


class TestAssistantAsyncSkills:
    @pytest.mark.asyncio
    async def test_askills_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_skill_payload(), _skill_payload(id="memory")])

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            skills = await assistant.askills(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/skills"
        assert len(skills) == 2
        assert all(isinstance(s, AssistantSkill) for s in skills)


class TestAssistantAsyncInstallSkill:
    @pytest.mark.asyncio
    async def test_ainstall_skill_posts_and_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json=[_skill_payload(id="browser_control", installed=True)])

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            skills = await assistant.ainstall_skill(agent_id, "browser_control")

        assert captured["path"] == f"/assistant/{agent_id}/skills/browser_control"
        assert captured["method"] == "POST"
        assert len(skills) == 1
        assert skills[0].installed is True


class TestAssistantAsyncUninstallSkill:
    @pytest.mark.asyncio
    async def test_auninstall_skill_deletes_and_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            captured["method"] = request.method
            return httpx.Response(200, json=[_skill_payload(id="browser_control", installed=False)])

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            skills = await assistant.auninstall_skill(agent_id, "browser_control")

        assert captured["path"] == f"/assistant/{agent_id}/skills/browser_control"
        assert captured["method"] == "DELETE"
        assert len(skills) == 1
        assert skills[0].installed is False


class TestAssistantAsyncChannels:
    @pytest.mark.asyncio
    async def test_achannels_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_channel_payload()])

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            channels = await assistant.achannels(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/channels"
        assert len(channels) == 1
        assert isinstance(channels[0], AssistantChannel)


class TestAssistantAsyncWakeups:
    @pytest.mark.asyncio
    async def test_awakeups_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_wakeup_payload()])

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            wakeups = await assistant.awakeups(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/wakeups"
        assert len(wakeups) == 1
        assert isinstance(wakeups[0], AssistantWakeup)


class TestAssistantAsyncHealth:
    @pytest.mark.asyncio
    async def test_ahealth_returns_health_object(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=_health_payload())

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            health = await assistant.ahealth(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/health"
        assert isinstance(health, AssistantHealth)
        assert health.status == "ok"


class TestAssistantAsyncSessions:
    @pytest.mark.asyncio
    async def test_asessions_returns_list(self) -> None:
        captured: dict[str, Any] = {}
        agent_id = str(uuid.uuid4())

        def handler(request: httpx.Request) -> httpx.Response:
            captured["path"] = request.url.path
            return httpx.Response(200, json=[_session_payload()])

        async with httpx.AsyncClient(
            base_url="https://api.test", transport=httpx.MockTransport(handler)
        ) as client:
            assistant = Assistant(client)
            sessions = await assistant.asessions(agent_id)

        assert captured["path"] == f"/assistant/{agent_id}/sessions"
        assert len(sessions) == 1
        assert isinstance(sessions[0], AssistantSession)


class TestAssistantAsyncRejectsSyncClient:
    """Async methods must reject sync httpx.Client."""

    def test_aoverview_rejects_sync_client(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_overview_payload())

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                import asyncio
                asyncio.get_event_loop().run_until_complete(assistant.aoverview())

    def test_askills_rejects_sync_client(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                import asyncio
                asyncio.get_event_loop().run_until_complete(assistant.askills(str(uuid.uuid4())))

    def test_achannels_rejects_sync_client(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                import asyncio
                asyncio.get_event_loop().run_until_complete(assistant.achannels(str(uuid.uuid4())))

    def test_awakeups_rejects_sync_client(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                import asyncio
                asyncio.get_event_loop().run_until_complete(assistant.awakeups(str(uuid.uuid4())))

    def test_ahealth_rejects_sync_client(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_health_payload())

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                import asyncio
                asyncio.get_event_loop().run_until_complete(assistant.ahealth(str(uuid.uuid4())))

    def test_asessions_rejects_sync_client(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[])

        with httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler)) as client:
            assistant = Assistant(client)
            with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
                import asyncio
                asyncio.get_event_loop().run_until_complete(assistant.asessions(str(uuid.uuid4())))
