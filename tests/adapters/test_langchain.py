"""
Tests for LangChain adapter (sdk/mutx/adapters/langchain.py).

Verifies:
- MutxLangChainCallbackHandler: instantiates, emits spans, posts audit events
- MutxAgentKit: instantiates with/without guardrails, raises when no executor set
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest


class TestMutxLangChainCallbackHandlerImport:
    """Test import and instantiation behavior."""

    def test_handler_instantiates(self):
        """Verify handler instantiates with required params."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )
        assert handler.api_url == "https://api.mutx.dev"
        assert handler.api_key == "test-key"
        assert handler.agent_name == "test-agent"
        assert handler._tracer is not None
        handler._http.close()

    def test_handler_url_rstrip(self):
        """Verify trailing slash is stripped from api_url."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev/",
            api_key="test-key",
        )
        assert handler.api_url == "https://api.mutx.dev"
        handler._http.close()


class TestMutxLangChainCallbackSpans:
    """Test OTel span emission on callback methods."""

    def test_on_llm_start_creates_span(self):
        """on_llm_start should call tracer.start_span with correct name/attrs."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )
        mock_tracer = MagicMock()
        handler._tracer = mock_tracer

        handler.on_llm_start({"name": "gpt-4"}, ["Hello, world"])

        mock_tracer.start_span.assert_called_once()
        call_args = mock_tracer.start_span.call_args
        assert call_args[0][0] == "mutx.llm.call"
        assert call_args[1]["attributes"]["llm.model"] == "gpt-4"
        assert call_args[1]["attributes"]["agent.name"] == "test-agent"
        handler._http.close()

    def test_on_tool_start_creates_span(self):
        """on_tool_start should create a span with tool.name."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )
        mock_tracer = MagicMock()
        handler._tracer = mock_tracer

        handler.on_tool_start({"name": "search"}, "python tutorial")

        mock_tracer.start_span.assert_called_once()
        call_args = mock_tracer.start_span.call_args
        assert call_args[0][0] == "mutx.tool.call"
        assert call_args[1]["attributes"]["tool.name"] == "search"
        handler._http.close()

    def test_on_agent_action_posts_to_v1_events(self):
        """on_agent_action should POST event to /v1/events."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )
        mock_response = MagicMock()
        handler._http.post = MagicMock(return_value=mock_response)

        mock_action = MagicMock()
        mock_action.tool = "search"
        mock_action.tool_input = "python"
        mock_action.log = "Acting..."

        handler.on_agent_action(mock_action)

        handler._http.post.assert_called_once()
        call_args = handler._http.post.call_args
        assert call_args[0][0] == "/v1/events"
        event = call_args[1]["json"]
        assert event["event_type"] == "agent_action"
        assert event["agent_name"] == "test-agent"
        assert event["tool"] == "search"
        handler._http.close()

    def test_on_agent_action_swallows_http_errors(self):
        """on_agent_action should not raise on HTTP errors."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler
        import httpx

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )
        handler._http.post = MagicMock(side_effect=httpx.HTTPError("network error"))

        mock_action = MagicMock()
        mock_action.tool = "search"
        mock_action.tool_input = "python"
        mock_action.log = "..."

        # Should not raise
        handler.on_agent_action(mock_action)
        handler._http.close()

    def test_on_agent_finish_posts_event(self):
        """on_agent_finish should POST finish event to /v1/events."""
        from mutx.adapters.langchain import MutxLangChainCallbackHandler

        handler = MutxLangChainCallbackHandler(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )
        handler._http.post = MagicMock()

        mock_finish = MagicMock()
        mock_finish.log = "Final output"
        mock_finish.return_values = {"output": "done"}

        handler.on_agent_finish(mock_finish)

        handler._http.post.assert_called_once()
        event = handler._http.post.call_args[1]["json"]
        assert event["event_type"] == "agent_finish"
        assert event["agent_name"] == "test-agent"
        handler._http.close()


class TestMutxAgentKit:
    """Test MutxAgentKit guardrails and event streaming."""

    def test_kit_without_guardrails(self):
        """Kit initializes with callback handler but no guardrails when disabled."""
        from mutx.adapters.langchain import MutxAgentKit

        kit = MutxAgentKit(
            mutx_api_url="https://api.mutx.dev",
            agent_name="test-agent",
            api_key="test-key",
            guardrails_enabled=False,
        )
        assert kit.guardrails_enabled is False
        assert kit._callback_handler is not None
        assert kit._guardrail_middleware is None

    def test_kit_with_guardrails_enabled(self):
        """Kit initializes guardrail middleware when guardrails_enabled=True."""
        from mutx.adapters.langchain import MutxAgentKit

        kit = MutxAgentKit(
            mutx_api_url="https://api.mutx.dev",
            agent_name="test-agent",
            api_key="test-key",
            guardrails_enabled=True,
        )
        assert kit.guardrails_enabled is True
        assert kit._guardrail_middleware is not None

    def test_arun_raises_when_no_executor(self):
        """arun should raise RuntimeError if no agent executor set."""
        from mutx.adapters.langchain import MutxAgentKit

        kit = MutxAgentKit(
            mutx_api_url="https://api.mutx.dev",
            agent_name="test-agent",
            api_key="test-key",
        )
        with pytest.raises(RuntimeError, match="No agent executor set"):
            kit.arun("Hello")

    def test_arun_async_raises_when_no_executor(self):
        """arun_async should raise RuntimeError if no agent executor set."""
        from mutx.adapters.langchain import MutxAgentKit
        import asyncio

        kit = MutxAgentKit(
            mutx_api_url="https://api.mutx.dev",
            agent_name="test-agent",
            api_key="test-key",
        )
        with pytest.raises(RuntimeError, match="No agent executor set"):
            asyncio.run(kit.arun_async("Hello"))

    def test_stream_events_yields_stream_start(self):
        """stream_events should yield at least a stream_start event."""
        from mutx.adapters.langchain import MutxAgentKit

        kit = MutxAgentKit(
            mutx_api_url="https://api.mutx.dev",
            agent_name="test-agent",
            api_key="test-key",
        )
        events = list(kit.stream_events())
        assert len(events) >= 1
        assert events[0]["event_type"] == "stream_start"
        assert events[0]["agent_name"] == "test-agent"

    def test_stream_events_with_executor(self):
        """stream_events yields events even when executor is set (stub)."""
        from mutx.adapters.langchain import MutxAgentKit

        kit = MutxAgentKit(
            mutx_api_url="https://api.mutx.dev",
            agent_name="test-agent",
            api_key="test-key",
        )
        kit.set_agent_executor(MagicMock())
        events = list(kit.stream_events())
        assert len(events) >= 1
