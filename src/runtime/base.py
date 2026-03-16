"""Base interfaces and shared types for agent runtimes."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator, Awaitable, Callable, Mapping, Sequence
from typing import Any, Literal, TypedDict


class RuntimeToolFunction(TypedDict):
    name: str
    arguments: str


class RuntimeToolCall(TypedDict):
    id: str
    type: Literal["function"]
    function: RuntimeToolFunction


class _RuntimeToolSpecRequired(TypedDict):
    name: str


class RuntimeToolSpec(_RuntimeToolSpecRequired, total=False):
    description: str
    parameters: dict[str, Any]


class RuntimeToolDefinition(TypedDict):
    type: Literal["function"]
    function: RuntimeToolSpec


class _RuntimeMessageRequired(TypedDict):
    role: Literal["system", "user", "assistant", "tool"]


class RuntimeMessage(_RuntimeMessageRequired, total=False):
    content: str | None
    name: str
    tool_call_id: str
    tool_calls: list[RuntimeToolCall]


class RuntimeResult(TypedDict, total=False):
    message: RuntimeMessage
    content: str | None
    tool_calls: list[RuntimeToolCall]
    raw_response: Any


class RuntimeStreamEvent(TypedDict, total=False):
    type: Literal["text", "tool_call", "done", "error"]
    delta: str
    tool_call: RuntimeToolCall
    error: str
    raw_event: Any


ToolHandler = Callable[[dict[str, Any]], Any | Awaitable[Any]]


class RuntimeConfig(ABC):
    """Abstract runtime configuration."""

    @abstractmethod
    def to_client_kwargs(self) -> dict[str, Any]:
        """Build keyword arguments for the underlying provider SDK client."""


class AgentRuntime(ABC):
    """Abstract interface for runtime execution adapters."""

    @abstractmethod
    async def execute(
        self,
        messages: Sequence[RuntimeMessage],
        *,
        tools: Sequence[RuntimeToolDefinition] | None = None,
        tool_handlers: Mapping[str, ToolHandler] | None = None,
        **kwargs: Any,
    ) -> RuntimeResult:
        """Run a non-streaming model execution."""

    @abstractmethod
    async def stream(
        self,
        messages: Sequence[RuntimeMessage],
        *,
        tools: Sequence[RuntimeToolDefinition] | None = None,
        **kwargs: Any,
    ) -> AsyncGenerator[RuntimeStreamEvent, None]:
        """Run a streaming model execution. Implementations must use ``yield``."""
        yield  # type: ignore[misc]  # pragma: no cover  # stub — subclasses must override with actual yielding logic

    @abstractmethod
    def list_tools(self) -> list[RuntimeToolDefinition]:
        """List tools currently configured for this runtime."""
