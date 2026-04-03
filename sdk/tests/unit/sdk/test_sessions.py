"""Tests for sessions module."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import httpx
import pytest

from mutx.sessions import Session, Sessions


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------


class TestSession:
    def test_init_full_data(self):
        data = {
            "id": "sess-123",
            "source": "web",
            "name": "My Session",
            "status": "active",
            "agent_id": "agent-abc",
            "assistant_id": "asst-def",
            "last_activity": 1700000000,
            "model": "claude-3-opus",
            "thinking_level": "high",
            "verbose": "on",
            "reasoning": "stream",
            "label": "important",
        }
        s = Session(data)
        assert s.id == "sess-123"
        assert s.source == "web"
        assert s.name == "My Session"
        assert s.status == "active"
        assert s.agent_id == "agent-abc"
        assert s.assistant_id == "asst-def"
        assert s.last_activity == 1700000000
        assert s.model == "claude-3-opus"
        assert s.thinking_level == "high"
        assert s.verbose == "on"
        assert s.reasoning == "stream"
        assert s.label == "important"
        assert s._data is data

    def test_init_defaults(self):
        s = Session({})
        assert s.id == ""
        assert s.source == "unknown"
        assert s.name == ""
        assert s.status == ""
        assert s.agent_id is None
        assert s.assistant_id is None
        assert s.last_activity == 0
        assert s.model is None
        assert s.thinking_level is None
        assert s.verbose is None
        assert s.reasoning is None
        assert s.label is None

    def test_repr(self):
        s = Session({"id": "sess-xyz", "source": "cli", "status": "idle"})
        r = repr(s)
        assert "sess-xyz" in r
        assert "cli" in r
        assert "idle" in r


# ---------------------------------------------------------------------------
# Sessions — client guards
# ---------------------------------------------------------------------------


class TestSessionsClientGuards:
    def test_require_sync_client_raises_on_async(self):
        async_client = httpx.AsyncClient()
        s = Sessions(async_client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            s.list()

    def test_require_async_client_raises_on_sync(self):
        sync_client = httpx.Client()
        s = Sessions(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(s.alist())


# ---------------------------------------------------------------------------
# Sessions.list
# ---------------------------------------------------------------------------


class TestSessionsList:
    def test_list_returns_sessions(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "sessions": [
                {"id": "s1", "source": "web", "status": "active"},
                {"id": "s2", "source": "cli", "status": "idle"},
            ]
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        result = sessions.list()

        assert len(result) == 2
        assert all(isinstance(s, Session) for s in result)
        assert result[0].id == "s1"
        assert result[1].id == "s2"
        mock_client.get.assert_called_once_with("/sessions", params={})

    def test_list_filters_by_agent_id(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"sessions": []}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        sessions.list(agent_id="agent-42")

        mock_client.get.assert_called_once_with("/sessions", params={"agent_id": "agent-42"})

    def test_list_agent_id_coerced_to_str(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"sessions": []}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        sessions.list(agent_id=123)

        mock_client.get.assert_called_once_with("/sessions", params={"agent_id": "123"})

    def test_list_empty_response(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"sessions": []}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        result = sessions.list()

        assert result == []

    def test_list_raises_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=MagicMock(status_code=500)
        )
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        with pytest.raises(httpx.HTTPStatusError):
            sessions.list()


# ---------------------------------------------------------------------------
# Sessions.alist
# ---------------------------------------------------------------------------


class TestSessionsAList:
    @pytest.mark.asyncio
    async def test_alist_returns_sessions(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "sessions": [{"id": "a1", "source": "api", "status": "active"}]
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        result = await sessions.alist()

        assert len(result) == 1
        assert result[0].id == "a1"
        mock_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_alist_filters_by_agent_id(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"sessions": []}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sessions = Sessions(mock_client)
        await sessions.alist(agent_id="my-agent")

        mock_client.get.assert_called_once_with("/sessions", params={"agent_id": "my-agent"})


# ---------------------------------------------------------------------------
# Sessions.set_thinking
# ---------------------------------------------------------------------------


class TestSessionsSetThinking:
    def test_set_thinking_valid_level(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True, "level": "high"}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        result = sessions.set_thinking("sess-key", "high")

        assert result["level"] == "high"
        mock_client.post.assert_called_once_with(
            "/sessions",
            params={"action": "set-thinking"},
            json={"session_key": "sess-key", "level": "high"},
        )

    def test_set_thinking_invalid_level_raises(self):
        mock_client = MagicMock(spec=httpx.Client)
        sessions = Sessions(mock_client)

        with pytest.raises(ValueError, match="Invalid thinking level"):
            sessions.set_thinking("sess-key", "uberhigh")

    @pytest.mark.parametrize("level", Sessions.VALID_THINKING_LEVELS)
    def test_set_thinking_all_valid_levels(self, level):
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        # Should not raise
        sessions.set_thinking("sess-key", level)
        mock_client.post.assert_called_once()

    def test_set_thinking_raises_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=MagicMock(status_code=400)
        )
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        with pytest.raises(httpx.HTTPStatusError):
            sessions.set_thinking("sess-key", "high")


# ---------------------------------------------------------------------------
# Sessions.aset_thinking
# ---------------------------------------------------------------------------


class TestSessionsASetThinking:
    @pytest.mark.asyncio
    async def test_aset_thinking_valid_level(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        result = await sessions.aset_thinking("sess-key", "medium")

        assert result["ok"] is True
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_aset_thinking_invalid_level_raises(self):
        mock_client = MagicMock(spec=httpx.AsyncClient)
        sessions = Sessions(mock_client)

        with pytest.raises(ValueError, match="Invalid thinking level"):
            await sessions.aset_thinking("sess-key", "bad-level")


# ---------------------------------------------------------------------------
# Sessions.set_reasoning
# ---------------------------------------------------------------------------


class TestSessionsSetReasoning:
    def test_set_reasoning_valid_level(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        result = sessions.set_reasoning("sess-key", "stream")

        assert result["ok"] is True
        mock_client.post.assert_called_once_with(
            "/sessions",
            params={"action": "set-reasoning"},
            json={"session_key": "sess-key", "level": "stream"},
        )

    def test_set_reasoning_invalid_level_raises(self):
        mock_client = MagicMock(spec=httpx.Client)
        sessions = Sessions(mock_client)

        with pytest.raises(ValueError, match="Invalid reasoning level"):
            sessions.set_reasoning("sess-key", "fast")

    @pytest.mark.parametrize("level", Sessions.VALID_REASONING_LEVELS)
    def test_set_reasoning_all_valid_levels(self, level):
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        sessions.set_reasoning("sess-key", level)
        mock_client.post.assert_called_once()


# ---------------------------------------------------------------------------
# Sessions.aset_reasoning
# ---------------------------------------------------------------------------


class TestSessionsASetReasoning:
    @pytest.mark.asyncio
    async def test_aset_reasoning_valid_level(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        result = await sessions.aset_reasoning("sess-key", "on")

        assert result["ok"] is True
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_aset_reasoning_invalid_level_raises(self):
        mock_client = MagicMock(spec=httpx.AsyncClient)
        sessions = Sessions(mock_client)

        with pytest.raises(ValueError, match="Invalid reasoning level"):
            await sessions.aset_reasoning("sess-key", "maybe")


# ---------------------------------------------------------------------------
# Sessions.set_label
# ---------------------------------------------------------------------------


class TestSessionsSetLabel:
    def test_set_label_ok(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True, "label": "work"}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        result = sessions.set_label("sess-key", "work")

        assert result["label"] == "work"
        mock_client.post.assert_called_once_with(
            "/sessions",
            params={"action": "set-label"},
            json={"session_key": "sess-key", "label": "work"},
        )

    def test_set_label_empty_string(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        sessions.set_label("sess-key", "")

        mock_client.post.assert_called_once()

    def test_set_label_too_long_raises(self):
        mock_client = MagicMock(spec=httpx.Client)
        sessions = Sessions(mock_client)
        long_label = "x" * 101

        with pytest.raises(ValueError, match="100 characters"):
            sessions.set_label("sess-key", long_label)

    def test_set_label_exactly_100_chars_ok(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        sessions.set_label("sess-key", "x" * 100)  # Should not raise


# ---------------------------------------------------------------------------
# Sessions.aset_label
# ---------------------------------------------------------------------------


class TestSessionsASetLabel:
    @pytest.mark.asyncio
    async def test_aset_label_ok(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"ok": True}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sessions = Sessions(mock_client)
        result = await sessions.aset_label("sess-key", "personal")

        assert result["ok"] is True
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_aset_label_too_long_raises(self):
        mock_client = MagicMock(spec=httpx.AsyncClient)
        sessions = Sessions(mock_client)

        with pytest.raises(ValueError, match="100 characters"):
            await sessions.aset_label("sess-key", "x" * 200)


# ---------------------------------------------------------------------------
# Sessions.delete
# ---------------------------------------------------------------------------


class TestSessionsDelete:
    def test_delete_ok(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"deleted": True}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.delete.return_value = mock_response

        sessions = Sessions(mock_client)
        result = sessions.delete("sess-key")

        assert result["deleted"] is True
        mock_client.delete.assert_called_once_with(
            "/sessions", json={"session_key": "sess-key"}
        )

    def test_delete_raises_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=MagicMock(status_code=404)
        )
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.delete.return_value = mock_response

        sessions = Sessions(mock_client)
        with pytest.raises(httpx.HTTPStatusError):
            sessions.delete("nonexistent-key")


# ---------------------------------------------------------------------------
# Sessions.adelete
# ---------------------------------------------------------------------------


class TestSessionsADelete:
    @pytest.mark.asyncio
    async def test_adelete_ok(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"deleted": True}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.delete.return_value = mock_response

        sessions = Sessions(mock_client)
        result = await sessions.adelete("sess-key")

        assert result["deleted"] is True
        mock_client.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_adelete_requires_async_client(self):
        sync_client = httpx.Client()
        sessions = Sessions(sync_client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            await sessions.adelete("sess-key")


# ---------------------------------------------------------------------------
# Sessions — valid level constants
# ---------------------------------------------------------------------------


class TestSessionsConstants:
    def test_valid_thinking_levels(self):
        assert Sessions.VALID_THINKING_LEVELS == ["off", "minimal", "low", "medium", "high", "xhigh"]

    def test_valid_verbose_levels(self):
        assert Sessions.VALID_VERBOSE_LEVELS == ["off", "on", "full"]

    def test_valid_reasoning_levels(self):
        assert Sessions.VALID_REASONING_LEVELS == ["off", "on", "stream"]
