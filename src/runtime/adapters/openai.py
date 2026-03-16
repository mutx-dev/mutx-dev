"""OpenAI runtime adapter (proof of concept)."""

from __future__ import annotations

import inspect
import json
from dataclasses import dataclass
from typing import Any

from openai import AsyncOpenAI

from ..base import (
    AgentRuntime,
    RuntimeConfig,
    RuntimeMessage,
    RuntimeResult,
    RuntimeUsage,
    RuntimeToolCall,
    RuntimeToolDefinition,
    ToolHandler,
)


@dataclass
class OpenAIConfig(RuntimeConfig):
    model: str
    api_key: str | None = None
    base_url: str | None = None
    organization: str | None = None
    project: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    tool_choice: str | dict[str, Any] | None = None
    max_tool_roundtrips: int = 3

    def to_client_kwargs(self) -> dict[str, Any]:
        kwargs: dict[str, Any] = {}
        if self.api_key:
            kwargs["api_key"] = self.api_key
        if self.base_url:
            kwargs["base_url"] = self.base_url
        if self.organization:
            kwargs["organization"] = self.organization
        if self.project:
            kwargs["project"] = self.project
        return kwargs

    def to_completion_defaults(self) -> dict[str, Any]:
        defaults: dict[str, Any] = {}
        if self.temperature is not None:
            defaults["temperature"] = self.temperature
        if self.max_tokens is not None:
            defaults["max_tokens"] = self.max_tokens
        if self.tool_choice is not None:
            defaults["tool_choice"] = self.tool_choice
        return defaults


class OpenAIAdapter(AgentRuntime):
    """Proof-of-concept runtime adapter backed by the OpenAI Chat Completions API."""

    def __init__(
        self,
        config: OpenAIConfig,
        tools: list[RuntimeToolDefinition] | None = None,
        client: AsyncOpenAI | None = None,
    ) -> None:
        self.config = config
        self._tools = list(tools or [])
        self._client = client or AsyncOpenAI(**config.to_client_kwargs())

    def list_tools(self) -> list[RuntimeToolDefinition]:
        return list(self._tools)

    async def execute(
        self,
        messages: list[RuntimeMessage],
        *,
        tools: list[RuntimeToolDefinition] | None = None,
        tool_handlers: dict[str, ToolHandler] | None = None,
        **kwargs: Any,
    ) -> RuntimeResult:
        conversation: list[RuntimeMessage] = [dict(message) for message in messages]
        active_tools = list(tools) if tools is not None else self.list_tools()
        handlers = dict(tool_handlers or {})
        max_roundtrips = int(kwargs.pop("max_tool_roundtrips", self.config.max_tool_roundtrips))

        last_response: Any | None = None
        last_message: RuntimeMessage = {"role": "assistant", "content": None}
        last_tool_calls: list[RuntimeToolCall] = []

        for _ in range(max_roundtrips + 1):
            response = await self._create_completion(
                messages=conversation,
                tools=active_tools,
                stream=False,
                **kwargs,
            )
            last_response = response

            message = response.choices[0].message
            runtime_message = self._message_to_runtime_message(message)
            conversation.append(runtime_message)

            tool_calls = self._extract_tool_calls(message)
            last_message = runtime_message
            last_tool_calls = tool_calls

            if not tool_calls:
                return {
                    "message": runtime_message,
                    "content": runtime_message.get("content"),
                    "tool_calls": [],
                    "raw_response": response,
                    "usage": self._extract_usage(response),
                }

            unresolved_calls = await self._append_tool_results(
                conversation=conversation,
                tool_calls=tool_calls,
                tool_handlers=handlers,
            )
            if unresolved_calls:
                return {
                    "message": runtime_message,
                    "content": runtime_message.get("content"),
                    "tool_calls": unresolved_calls,
                    "raw_response": response,
                    "usage": self._extract_usage(response),
                }

        return {
            "message": last_message,
            "content": last_message.get("content"),
            "tool_calls": last_tool_calls,
            "raw_response": last_response,
            "usage": self._extract_usage(last_response),
        }

    async def stream(
        self,
        messages: list[RuntimeMessage],
        *,
        tools: list[RuntimeToolDefinition] | None = None,
        **kwargs: Any,
    ) -> Any:
        conversation: list[RuntimeMessage] = [dict(message) for message in messages]
        active_tools = list(tools) if tools is not None else self.list_tools()

        try:
            stream = await self._create_completion(
                messages=conversation,
                tools=active_tools,
                stream=True,
                **kwargs,
            )
        except Exception as exc:
            yield {"type": "error", "error": str(exc)}
            return

        pending_tool_calls: dict[int, RuntimeToolCall] = {}

        async for chunk in stream:
            if not chunk.choices:
                continue

            choice = chunk.choices[0]
            delta = choice.delta

            text_delta = getattr(delta, "content", None)
            if text_delta:
                yield {"type": "text", "delta": text_delta, "raw_event": chunk}

            for partial_call in getattr(delta, "tool_calls", []) or []:
                index = getattr(partial_call, "index", 0) or 0
                call = pending_tool_calls.setdefault(
                    index,
                    {
                        "id": "",
                        "type": "function",
                        "function": {
                            "name": "",
                            "arguments": "",
                        },
                    },
                )
                call_id = getattr(partial_call, "id", None)
                if call_id:
                    call["id"] = call_id

                function = getattr(partial_call, "function", None)
                if function:
                    name = getattr(function, "name", None)
                    if name:
                        call["function"]["name"] = name

                    arguments_delta = getattr(function, "arguments", None)
                    if arguments_delta:
                        call["function"]["arguments"] += arguments_delta

        for call in pending_tool_calls.values():
            yield {"type": "tool_call", "tool_call": call}

        yield {"type": "done"}

    def _extract_usage(self, response: Any) -> RuntimeUsage | None:
        """Extract usage statistics from the API response."""
        usage = getattr(response, 'usage', None)
        if not usage:
            return None
        
        prompt_tokens = getattr(usage, 'prompt_tokens', 0) or 0
        completion_tokens = getattr(usage, 'completion_tokens', 0) or 0
        total_tokens = getattr(usage, 'total_tokens', 0) or 0
        
        # Calculate approximate cost (can be customized per model)
        cost = self._calculate_cost(prompt_tokens, completion_tokens, self.config.model)
        
        return {
            'prompt_tokens': prompt_tokens,
            'completion_tokens': completion_tokens,
            'total_tokens': total_tokens,
            'model': self.config.model,
            'cost_usd': cost,
        }
    
    def _calculate_cost(self, prompt_tokens: int, completion_tokens: int, model: str) -> float:
        """Calculate approximate cost in USD based on model pricing."""
        # Pricing per 1M tokens (approximate, as of 2024)
        pricing = {
            'gpt-4o': {'prompt': 2.50, 'completion': 10.00},
            'gpt-4-turbo': {'prompt': 10.00, 'completion': 30.00},
            'gpt-4': {'prompt': 30.00, 'completion': 60.00},
            'gpt-3.5-turbo': {'prompt': 0.50, 'completion': 1.50},
            'o1': {'prompt': 15.00, 'completion': 60.00},
            'o1-preview': {'prompt': 15.00, 'completion': 60.00},
            'o1-mini': {'prompt': 3.00, 'completion': 12.00},
        }
        
        model_pricing = pricing.get(model.lower(), {'prompt': 5.0, 'completion': 15.0})
        prompt_cost = (prompt_tokens / 1_000_000) * model_pricing['prompt']
        completion_cost = (completion_tokens / 1_000_000) * model_pricing['completion']
        
        return round(prompt_cost + completion_cost, 6)

    async def _create_completion(
        self,
        *,
        messages: list[RuntimeMessage],
        tools: list[RuntimeToolDefinition],
        stream: bool,
        **kwargs: Any,
    ) -> Any:
        request: dict[str, Any] = {
            "model": self.config.model,
            "messages": messages,
            **self.config.to_completion_defaults(),
            **kwargs,
        }
        if tools:
            request["tools"] = tools
        if stream:
            request["stream"] = True

        return await self._client.chat.completions.create(**request)

    async def _append_tool_results(
        self,
        *,
        conversation: list[RuntimeMessage],
        tool_calls: list[RuntimeToolCall],
        tool_handlers: dict[str, ToolHandler],
    ) -> list[RuntimeToolCall]:
        unresolved_calls: list[RuntimeToolCall] = []

        for tool_call in tool_calls:
            function = tool_call["function"]
            tool_name = function["name"]
            handler = tool_handlers.get(tool_name)
            if handler is None:
                unresolved_calls.append(tool_call)
                continue

            parsed_arguments = self._parse_tool_arguments(function.get("arguments", "{}"))

            try:
                tool_output = handler(parsed_arguments)
                if inspect.isawaitable(tool_output):
                    tool_output = await tool_output
            except Exception as exc:
                tool_output = {"error": str(exc)}

            conversation.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": tool_name,
                    "content": self._serialize_tool_output(tool_output),
                }
            )

        return unresolved_calls

    @staticmethod
    def _message_to_runtime_message(message: Any) -> RuntimeMessage:
        runtime_message: RuntimeMessage = {
            "role": getattr(message, "role", "assistant"),
            "content": getattr(message, "content", None),
        }

        tool_calls = OpenAIAdapter._extract_tool_calls(message)
        if tool_calls:
            runtime_message["tool_calls"] = tool_calls

        name = getattr(message, "name", None)
        if name:
            runtime_message["name"] = name

        return runtime_message

    @staticmethod
    def _extract_tool_calls(message: Any) -> list[RuntimeToolCall]:
        runtime_calls: list[RuntimeToolCall] = []

        for tool_call in getattr(message, "tool_calls", []) or []:
            function = getattr(tool_call, "function", None)
            runtime_calls.append(
                {
                    "id": getattr(tool_call, "id", ""),
                    "type": "function",
                    "function": {
                        "name": getattr(function, "name", ""),
                        "arguments": getattr(function, "arguments", "{}"),
                    },
                }
            )

        return runtime_calls

    @staticmethod
    def _parse_tool_arguments(arguments_json: str) -> dict[str, Any]:
        if not arguments_json:
            return {}

        try:
            parsed = json.loads(arguments_json)
        except json.JSONDecodeError:
            return {"raw": arguments_json}

        if isinstance(parsed, dict):
            return parsed

        return {"value": parsed}

    @staticmethod
    def _serialize_tool_output(output: Any) -> str:
        if isinstance(output, str):
            return output

        try:
            return json.dumps(output)
        except TypeError:
            return str(output)
