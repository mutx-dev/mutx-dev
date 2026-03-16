"""Unit tests for the OpenAI runtime adapter."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.runtime.adapters.openai import OpenAIAdapter, OpenAIConfig


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_choice(content: str | None = None, tool_calls: list[Any] | None = None) -> MagicMock:
    message = MagicMock()
    message.role = "assistant"
    message.content = content
    message.tool_calls = tool_calls or []
    message.name = None
    choice = MagicMock()
    choice.message = message
    return choice


def _make_response(content: str | None = None, tool_calls: list[Any] | None = None) -> MagicMock:
    response = MagicMock()
    response.choices = [_make_choice(content=content, tool_calls=tool_calls)]
    return response


def _make_tool_call(call_id: str, name: str, arguments: str = "{}") -> MagicMock:
    fn = MagicMock()
    fn.name = name
    fn.arguments = arguments
    tc = MagicMock()
    tc.id = call_id
    tc.type = "function"
    tc.function = fn
    return tc


@pytest.fixture()
def mock_client() -> MagicMock:
    client = MagicMock()
    client.chat = MagicMock()
    client.chat.completions = MagicMock()
    client.chat.completions.create = AsyncMock()
    return client


@pytest.fixture()
def adapter(mock_client: MagicMock) -> OpenAIAdapter:
    config = OpenAIConfig(model="gpt-4o-mini")
    return OpenAIAdapter(config=config, client=mock_client)


# ---------------------------------------------------------------------------
# OpenAIConfig
# ---------------------------------------------------------------------------


class TestOpenAIConfig:
    def test_to_client_kwargs_empty_when_defaults(self) -> None:
        config = OpenAIConfig(model="gpt-4o")
        assert config.to_client_kwargs() == {}

    def test_to_client_kwargs_includes_api_key(self) -> None:
        config = OpenAIConfig(model="gpt-4o", api_key="sk-test")
        assert config.to_client_kwargs()["api_key"] == "sk-test"

    def test_to_client_kwargs_ignores_none_api_key(self) -> None:
        config = OpenAIConfig(model="gpt-4o", api_key=None)
        assert "api_key" not in config.to_client_kwargs()

    def test_to_completion_defaults_empty_when_none(self) -> None:
        config = OpenAIConfig(model="gpt-4o")
        assert config.to_completion_defaults() == {}

    def test_to_completion_defaults_includes_set_values(self) -> None:
        config = OpenAIConfig(model="gpt-4o", temperature=0.5, max_tokens=100)
        defaults = config.to_completion_defaults()
        assert defaults["temperature"] == 0.5
        assert defaults["max_tokens"] == 100


# ---------------------------------------------------------------------------
# execute() — no tool calls
# ---------------------------------------------------------------------------


class TestExecuteNoTools:
    @pytest.mark.asyncio
    async def test_returns_content(self, adapter: OpenAIAdapter, mock_client: MagicMock) -> None:
        mock_client.chat.completions.create.return_value = _make_response(content="Hello!")

        messages = [{"role": "user", "content": "Hi"}]
        result = await adapter.execute(messages)

        assert result["content"] == "Hello!"
        assert result["tool_calls"] == []
        assert result["message"]["role"] == "assistant"

    @pytest.mark.asyncio
    async def test_does_not_mutate_caller_messages(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        tc = _make_tool_call("id1", "my_tool", '{"x": 1}')
        mock_client.chat.completions.create.return_value = _make_response(content="done")

        original_tool_calls = [{"id": "orig", "type": "function", "function": {"name": "example_function", "arguments": "{}"}}]
        messages = [{"role": "assistant", "content": None, "tool_calls": original_tool_calls}]

        await adapter.execute(messages)

        # The original nested list must not have been mutated
        assert messages[0]["tool_calls"] is original_tool_calls


# ---------------------------------------------------------------------------
# execute() — with tool calls
# ---------------------------------------------------------------------------


class TestExecuteWithTools:
    @pytest.mark.asyncio
    async def test_resolves_tool_and_continues(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        tc = _make_tool_call("call-1", "add", '{"a": 1, "b": 2}')
        first_response = _make_response(tool_calls=[tc])
        second_response = _make_response(content="The answer is 3.")
        mock_client.chat.completions.create.side_effect = [first_response, second_response]

        messages = [{"role": "user", "content": "What is 1+2?"}]
        result = await adapter.execute(
            messages, tool_handlers={"add": lambda args: args["a"] + args["b"]}
        )

        assert result["content"] == "The answer is 3."
        assert mock_client.chat.completions.create.call_count == 2

    @pytest.mark.asyncio
    async def test_returns_unresolved_tool_calls(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        tc = _make_tool_call("call-1", "unknown_tool", "{}")
        mock_client.chat.completions.create.return_value = _make_response(tool_calls=[tc])

        messages = [{"role": "user", "content": "Do something"}]
        result = await adapter.execute(messages, tool_handlers={})

        assert len(result["tool_calls"]) == 1
        assert result["tool_calls"][0]["function"]["name"] == "unknown_tool"

    @pytest.mark.asyncio
    async def test_respects_max_tool_roundtrips(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        tc = _make_tool_call("call-1", "loop_tool", "{}")
        loop_response = _make_response(tool_calls=[tc])
        mock_client.chat.completions.create.return_value = loop_response

        messages = [{"role": "user", "content": "Loop"}]
        result = await adapter.execute(
            messages,
            tool_handlers={"loop_tool": lambda _: "result"},
            max_tool_roundtrips=2,
        )

        # max_tool_roundtrips=2 → at most 3 completions (initial call + 2 roundtrips)
        assert mock_client.chat.completions.create.call_count <= 3

    @pytest.mark.asyncio
    async def test_async_tool_handler_is_awaited(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        tc = _make_tool_call("call-1", "async_tool", '{"val": 42}')
        first_response = _make_response(tool_calls=[tc])
        second_response = _make_response(content="done")
        mock_client.chat.completions.create.side_effect = [first_response, second_response]

        async def async_handler(args: dict) -> str:
            return f"got {args['val']}"

        messages = [{"role": "user", "content": "async"}]
        result = await adapter.execute(messages, tool_handlers={"async_tool": async_handler})

        assert result["content"] == "done"

    @pytest.mark.asyncio
    async def test_tool_exception_returns_error_content(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        tc = _make_tool_call("call-1", "bad_tool", "{}")
        first_response = _make_response(tool_calls=[tc])
        second_response = _make_response(content="handled")
        mock_client.chat.completions.create.side_effect = [first_response, second_response]

        def failing_handler(_: dict) -> None:
            raise ValueError("boom")

        messages = [{"role": "user", "content": "go"}]
        result = await adapter.execute(messages, tool_handlers={"bad_tool": failing_handler})

        assert result["content"] == "handled"


# ---------------------------------------------------------------------------
# stream()
# ---------------------------------------------------------------------------


def _make_chunk(content: str | None = None) -> MagicMock:
    delta = MagicMock()
    delta.content = content
    delta.tool_calls = []
    choice = MagicMock()
    choice.delta = delta
    chunk = MagicMock()
    chunk.choices = [choice]
    return chunk


async def _async_chunks(chunks: list[Any]):
    for chunk in chunks:
        yield chunk


class TestStream:
    @pytest.mark.asyncio
    async def test_yields_text_events(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        chunks = [_make_chunk("Hello"), _make_chunk(" world")]
        mock_client.chat.completions.create.return_value = _async_chunks(chunks)

        messages = [{"role": "user", "content": "Hi"}]
        events = [event async for event in adapter.stream(messages)]

        text_events = [e for e in events if e.get("type") == "text"]
        assert len(text_events) == 2
        assert text_events[0]["delta"] == "Hello"
        assert text_events[1]["delta"] == " world"
        assert events[-1]["type"] == "done"

    @pytest.mark.asyncio
    async def test_yields_error_event_on_setup_failure(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        mock_client.chat.completions.create.side_effect = RuntimeError("connection refused")

        messages = [{"role": "user", "content": "Hi"}]
        events = [event async for event in adapter.stream(messages)]

        assert len(events) == 1
        assert events[0]["type"] == "error"
        assert "connection refused" in events[0]["error"]

    @pytest.mark.asyncio
    async def test_yields_error_event_on_mid_stream_failure(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        async def bad_stream():
            yield _make_chunk("Hello")
            raise RuntimeError("mid-stream error")

        mock_client.chat.completions.create.return_value = bad_stream()

        messages = [{"role": "user", "content": "Hi"}]
        events = [event async for event in adapter.stream(messages)]

        assert events[0]["type"] == "text"
        error_events = [e for e in events if e.get("type") == "error"]
        assert len(error_events) == 1
        assert "mid-stream" in error_events[0]["error"]

    @pytest.mark.asyncio
    async def test_skips_empty_choices(
        self, adapter: OpenAIAdapter, mock_client: MagicMock
    ) -> None:
        empty_chunk = MagicMock()
        empty_chunk.choices = []
        normal_chunk = _make_chunk("Hi")
        mock_client.chat.completions.create.return_value = _async_chunks(
            [empty_chunk, normal_chunk]
        )

        messages = [{"role": "user", "content": "test"}]
        events = [event async for event in adapter.stream(messages)]

        text_events = [e for e in events if e.get("type") == "text"]
        assert len(text_events) == 1


# ---------------------------------------------------------------------------
# Static helpers
# ---------------------------------------------------------------------------


class TestParseToolArguments:
    def test_empty_string_returns_empty_dict(self) -> None:
        assert OpenAIAdapter._parse_tool_arguments("") == {}

    def test_valid_json_dict_returned_as_is(self) -> None:
        assert OpenAIAdapter._parse_tool_arguments('{"a": 1}') == {"a": 1}

    def test_invalid_json_returns_raw(self) -> None:
        result = OpenAIAdapter._parse_tool_arguments("not-json")
        assert result == {"raw": "not-json"}

    def test_non_dict_json_wrapped_in_value(self) -> None:
        result = OpenAIAdapter._parse_tool_arguments("[1, 2, 3]")
        assert result == {"value": [1, 2, 3]}


class TestSerializeToolOutput:
    def test_string_returned_as_is(self) -> None:
        assert OpenAIAdapter._serialize_tool_output("hello") == "hello"

    def test_dict_serialized_to_json(self) -> None:
        assert OpenAIAdapter._serialize_tool_output({"a": 1}) == '{"a": 1}'

    def test_non_serializable_falls_back_to_str(self) -> None:
        class Custom:
            def __repr__(self) -> str:
                return "custom-repr"

        result = OpenAIAdapter._serialize_tool_output(Custom())
        assert isinstance(result, str)


class TestExtractToolCalls:
    def test_returns_empty_for_no_tool_calls(self) -> None:
        message = MagicMock()
        message.tool_calls = None
        assert OpenAIAdapter._extract_tool_calls(message) == []

    def test_converts_tool_calls(self) -> None:
        tc = _make_tool_call("id1", "my_func", '{"x": 1}')
        message = MagicMock()
        message.tool_calls = [tc]

        result = OpenAIAdapter._extract_tool_calls(message)
        assert len(result) == 1
        assert result[0]["id"] == "id1"
        assert result[0]["function"]["name"] == "my_func"
        assert result[0]["function"]["arguments"] == '{"x": 1}'
