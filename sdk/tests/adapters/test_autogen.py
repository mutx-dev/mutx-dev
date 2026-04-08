"""Contract tests for sdk/mutx/adapters/autogen.py.

These tests verify the MutxAutoGenCallback and register_with_autogen()
integrate correctly with AutoGen callbacks and emit OTel spans/events.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest


class TestMutxAutoGenCallback:
    """Tests for MutxAutoGenCallback."""

    def test_init_sets_attributes(self):
        """Test that handler initializes with correct attributes."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        assert handler.api_url == "https://api.mutx.dev"
        assert handler.api_key == "test-key"
        assert handler.agent_name == "test-agent"
        assert handler._http is not None

    def test_init_strips_trailing_slash(self):
        """Test that api_url trailing slash is stripped."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev/",
            api_key="test-key",
            agent_name="test-agent",
        )

        assert handler.api_url == "https://api.mutx.dev"

    def test_on_agent_message_received_emits_span_and_logs(self):
        """Test that on_agent_message_received creates span and logs event."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        mock_message = MagicMock()
        mock_sender = MagicMock()
        mock_sender.name = "sender-agent"

        with patch("mutx.adapters.autogen.span") as mock_span_cm:
            mock_span = MagicMock()
            mock_span_cm.return_value.__enter__ = MagicMock(return_value=mock_span)
            mock_span_cm.return_value.__exit__ = MagicMock(return_value=None)

            with patch.object(handler._http, "post") as mock_post:
                handler.on_agent_message_received(mock_message, mock_sender)

                mock_post.assert_called_once()
                call_args = mock_post.call_args
                event = call_args[1]["json"]
                assert event["event_type"] == "autogen_message_received"
                assert event["agent_name"] == "test-agent"
                assert event["sender"] == "sender-agent"

    def test_on_agent_teardown_emits_span_and_logs(self):
        """Test that on_agent_teardown creates span and logs event."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        mock_agent = MagicMock()

        with patch("mutx.adapters.autogen.span") as mock_span_cm:
            mock_span = MagicMock()
            mock_span_cm.return_value.__enter__ = MagicMock(return_value=mock_span)
            mock_span_cm.return_value.__exit__ = MagicMock(return_value=None)

            with patch.object(handler._http, "post") as mock_post:
                handler.on_agent_teardown(mock_agent)

                mock_post.assert_called_once()
                call_args = mock_post.call_args
                event = call_args[1]["json"]
                assert event["event_type"] == "autogen_agent_teardown"
                assert event["agent_name"] == "test-agent"

    def test_wrap_tool_call_emits_span(self):
        """Test that wrap_tool_call wraps function with span."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        def mock_tool(x, y):
            return x + y

        with patch("mutx.adapters.autogen.span") as mock_span_cm:
            mock_span = MagicMock()
            mock_span_cm.return_value.__enter__ = MagicMock(return_value=mock_span)
            mock_span_cm.return_value.__exit__ = MagicMock(return_value=None)

            result = handler.wrap_tool_call("calculator", mock_tool, 2, 3)

            assert result == 5
            mock_span_cm.assert_called_once_with(
                "mutx.tool.call",
                attributes={
                    "tool.name": "calculator",
                    "agent.name": "test-agent",
                },
            )

    def test_wrap_tool_call_propagates_exception(self):
        """Test that wrap_tool_call properly propagates exceptions."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        def failing_tool():
            raise ValueError("Tool failed")

        with patch("mutx.adapters.autogen.span") as mock_span_cm:
            mock_span = MagicMock()
            mock_span_cm.return_value.__enter__ = MagicMock(return_value=mock_span)
            mock_span_cm.return_value.__exit__ = MagicMock(return_value=None)

            with pytest.raises(ValueError, match="Tool failed"):
                handler.wrap_tool_call("failing_tool", failing_tool)

    def test_wrap_llm_call_emits_span_and_logs(self):
        """Test that wrap_llm_call wraps function with span and logs event."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        def mock_llm_call():
            return "LLM response"

        with patch("mutx.adapters.autogen.span") as mock_span_cm:
            mock_span = MagicMock()
            mock_span_cm.return_value.__enter__ = MagicMock(return_value=mock_span)
            mock_span_cm.return_value.__exit__ = MagicMock(return_value=None)

            with patch.object(handler._http, "post") as mock_post:
                result = handler.wrap_llm_call("gpt-4", mock_llm_call)

                assert result == "LLM response"
                mock_post.assert_called_once()
                event = mock_post.call_args[1]["json"]
                assert event["event_type"] == "autogen_llm_call"
                assert event["model"] == "gpt-4"

    def test_audit_log_failure_does_not_raise(self):
        """Test that audit log failures don't raise exceptions."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        import httpx

        mock_message = MagicMock()
        mock_sender = MagicMock()

        with patch("mutx.adapters.autogen.span"):
            with patch.object(handler._http, "post") as mock_post:
                mock_post.side_effect = httpx.HTTPError("Network error")

                # Should not raise
                handler.on_agent_message_received(mock_message, mock_sender)

    def test_http_client_cleanup(self):
        """Test that HTTP client is properly closed on deletion."""
        from mutx.adapters.autogen import MutxAutoGenCallback

        handler = MutxAutoGenCallback(
            api_url="https://api.mutx.dev",
            api_key="test-key",
            agent_name="test-agent",
        )

        with patch.object(handler._http, "close") as mock_close:
            handler.__del__()
            mock_close.assert_called_once()


class TestRegisterWithAutogen:
    """Tests for register_with_autogen function."""

    def test_register_with_autogen_returns_callback(self):
        """Test that register_with_autogen returns a callback handler."""
        import sys

        from mutx.adapters.autogen import MutxAutoGenCallback, register_with_autogen

        # Mock autogen module to avoid ImportError
        mock_autogen_module = MagicMock()
        with patch.dict(sys.modules, {"autogen": mock_autogen_module}):
            mock_agent = MagicMock()
            mock_agent.name = "test-agent"

            callback = register_with_autogen(
                mock_agent,
                "https://api.mutx.dev",
                "test-key",
            )

            assert isinstance(callback, MutxAutoGenCallback)
            assert callback.agent_name == "test-agent"

    def test_register_uses_fallback_name(self):
        """Test that register_with_autogen uses fallback name when agent has no name."""
        import sys

        from mutx.adapters.autogen import register_with_autogen

        # Mock autogen module to avoid ImportError
        mock_autogen_module = MagicMock()
        with patch.dict(sys.modules, {"autogen": mock_autogen_module}):
            mock_agent = MagicMock(spec=[])
            del mock_agent.name

            callback = register_with_autogen(
                mock_agent,
                "https://api.mutx.dev",
                "test-key",
            )

            assert callback.agent_name == "autogen-agent"

    def test_register_attaches_handlers(self):
        """Test that register_with_autogen attaches handlers to agent."""
        import sys

        from mutx.adapters.autogen import register_with_autogen

        # Mock autogen module to avoid ImportError
        mock_autogen_module = MagicMock()
        with patch.dict(sys.modules, {"autogen": mock_autogen_module}):
            mock_agent = MagicMock()
            mock_agent.name = "test-agent"

            register_with_autogen(
                mock_agent,
                "https://api.mutx.dev",
                "test-key",
            )

            # Check that handlers were registered if supported
            if hasattr(mock_agent, "register_message_handler"):
                mock_agent.register_message_handler.assert_called_once()
            if hasattr(mock_agent, "register_teardown_handler"):
                mock_agent.register_teardown_handler.assert_called_once()
