"""Anthropic runtime adapter (Claude)."""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any, AsyncIterator, Mapping, Sequence

from anthropic import APIConnectionError, AsyncAnthropic, RateLimitError

from ..base import (
    AgentRuntime,
    RuntimeConfig,
    RuntimeMessage,
    RuntimeResult,
    RuntimeStreamEvent,
    RuntimeToolCall,
    RuntimeToolDefinition,
    ToolHandler,
)
from ..circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)


@dataclass
class AnthropicConfig(RuntimeConfig):
    model: str = "claude-3-5-sonnet-20241022"
    api_key: str | None = None
    base_url: str | None = None
    max_tokens: int = 1024
    temperature: float | None = None
    system: str | None = None
    max_tool_roundtrips: int = 3

    def to_client_kwargs(self) -> dict[str, Any]:
        kwargs: dict[str, Any] = {}
        if self.api_key:
            kwargs["api_key"] = self.api_key
        if self.base_url:
            kwargs["base_url"] = self.base_url
        return kwargs


class AnthropicAdapter(AgentRuntime):
    """Anthropic Claude runtime adapter."""

    def __init__(self, config: AnthropicConfig):
        self.config = config
        self._client = AsyncAnthropic(**config.to_client_kwargs())
        self._tools: list[RuntimeToolDefinition] = []
        self._circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)

    async def execute(
        self,
        messages: Sequence[RuntimeMessage],
        *,
        tools: Sequence[RuntimeToolDefinition] | None = None,
        tool_handlers: Mapping[str, ToolHandler] | None = None,
        **kwargs: Any,
    ) -> RuntimeResult:
        """Run a non-streaming model execution."""
        tool_handlers = tool_handlers or {}

        anthropic_messages = self._convert_messages(messages)
        request_kwargs: dict[str, Any] = {
            "model": self.config.model,
            "messages": anthropic_messages,
            "max_tokens": self.config.max_tokens,
        }

        if self.config.temperature is not None:
            request_kwargs["temperature"] = self.config.temperature

        if self.config.system:
            request_kwargs["system"] = self.config.system

        if tools:
            self._tools = list(tools)
            request_kwargs["tools"] = self._convert_tools(tools)

        max_retries = 3
        base_delay = 1.0

        for attempt in range(max_retries):
            if not self._circuit_breaker.can_attempt():
                logger.warning("Anthropic circuit breaker OPEN - rejecting request")
                raise RuntimeError("Circuit breaker is open - service unavailable")

            try:
                response = await self._client.messages.create(**request_kwargs)
                self._circuit_breaker.record_success()
                logger.debug("Anthropic API call succeeded")
                break
            except (RateLimitError, APIConnectionError) as exc:
                self._circuit_breaker.record_failure()
                logger.warning(
                    "Anthropic API transient error on attempt %s/%s: %s: %s",
                    attempt + 1,
                    max_retries,
                    type(exc).__name__,
                    exc,
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(base_delay * (2**attempt))
                else:
                    raise
            except Exception:
                self._circuit_breaker.record_failure()
                logger.exception(
                    "Anthropic API call failed on attempt %s/%s",
                    attempt + 1,
                    max_retries,
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(base_delay * (2**attempt))
                else:
                    raise

        tool_calls = self._convert_tool_calls(response.content)

        while tool_calls and tool_handlers:
            for tc in tool_calls:
                tool_name = tc["function"]["name"]
                tool_args = json.loads(tc["function"]["arguments"])
                if tool_name in tool_handlers:
                    tool_result = await tool_handlers[tool_name](tool_args)
                    messages = list(messages)
                    messages.append(
                        {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [tc],
                        }
                    )
                    messages.append(
                        {
                            "role": "tool",
                            "content": json.dumps(tool_result)
                            if not isinstance(tool_result, str)
                            else tool_result,
                            "tool_call_id": tc["id"],
                        }
                    )
                    anthropic_messages = self._convert_messages(messages)
                    request_kwargs["messages"] = anthropic_messages
                    response = await self._client.messages.create(**request_kwargs)
                    tool_calls = self._convert_tool_calls(response.content)

        return RuntimeResult(
            message={
                "role": "assistant",
                "content": response.content[0].text if response.content else None,
                "tool_calls": tool_calls or None,
            },
            content=response.content[0].text if response.content else None,
            tool_calls=tool_calls,
            raw_response=response,
        )

    async def stream(
        self,
        messages: Sequence[RuntimeMessage],
        *,
        tools: Sequence[RuntimeToolDefinition] | None = None,
        **kwargs: Any,
    ) -> AsyncIterator[RuntimeStreamEvent]:
        """Run a streaming model execution."""
        anthropic_messages = self._convert_messages(messages)

        request_kwargs: dict[str, Any] = {
            "model": self.config.model,
            "messages": anthropic_messages,
            "max_tokens": self.config.max_tokens,
            "stream": True,
        }

        if self.config.temperature is not None:
            request_kwargs["temperature"] = self.config.temperature

        if self.config.system:
            request_kwargs["system"] = self.config.system

        if tools:
            request_kwargs["tools"] = self._convert_tools(tools)

        async with self._client.messages.stream(**request_kwargs) as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    if event.delta.type == "text_delta":
                        yield RuntimeStreamEvent(
                            type="text",
                            delta=event.delta.text,
                            raw_event=event,
                        )
                    elif event.delta.type == "input_json_delta":
                        yield RuntimeStreamEvent(
                            type="tool_call",
                            delta=event.delta.partial_json,
                            raw_event=event,
                        )
                elif event.type == "message_delta":
                    yield RuntimeStreamEvent(
                        type="done",
                        delta="",
                        raw_event=event,
                    )

    def list_tools(self) -> list[RuntimeToolDefinition]:
        """List tools currently configured for this runtime."""
        return self._tools

    def _convert_messages(self, messages: Sequence[RuntimeMessage]) -> list[dict[str, Any]]:
        """Convert RuntimeMessage format to Anthropic format."""
        result = []
        for msg in messages:
            anthropic_msg: dict[str, Any] = {"role": msg["role"]}

            if "content" in msg and msg["content"]:
                anthropic_msg["content"] = msg["content"]

            if "name" in msg:
                anthropic_msg["name"] = msg["name"]

            if "tool_calls" in msg and msg["tool_calls"]:
                tool_calls = []
                for tc in msg["tool_calls"]:
                    tool_calls.append(
                        {
                            "id": tc["id"],
                            "type": "tool_use",
                            "name": tc["function"]["name"],
                            "input": json.loads(tc["function"]["arguments"]),
                        }
                    )
                anthropic_msg["tool_calls"] = tool_calls

            if "tool_call_id" in msg:
                anthropic_msg["tool_call_id"] = msg["tool_call_id"]

            result.append(anthropic_msg)

        return result

    def _convert_tools(self, tools: Sequence[RuntimeToolDefinition]) -> list[dict[str, Any]]:
        """Convert RuntimeToolDefinition to Anthropic tool format."""
        result = []
        for tool in tools:
            if tool["type"] == "function":
                func = tool.get("function", {})
                result.append(
                    {
                        "name": func.get("name", ""),
                        "description": func.get("description", ""),
                        "input_schema": func.get("parameters", {}),
                    }
                )
        return result

    def _convert_tool_calls(self, content: list[Any]) -> list[RuntimeToolCall]:
        """Convert Anthropic tool calls to RuntimeToolCall format."""
        result = []
        if not content:
            return result

        for block in content:
            if hasattr(block, "type") and block.type == "tool_use":
                result.append(
                    {
                        "id": block.id,
                        "type": "function",
                        "function": {
                            "name": block.name,
                            "arguments": json.dumps(block.input),
                        },
                    }
                )
        return result
