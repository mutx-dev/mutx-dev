"""LangChain adapter for MUTX observability and agent runtime.

This module provides:
- MutxLangChainCallbackHandler: BaseCallbackHandler for tracing LLM/tool calls
- MutxAgentKit: High-level agent kit with guardrails and event streaming

Example:
    >>> from langchain.agents import create_agent
    >>> from langchain_openai import ChatOpenAI
    >>> from mutx.adapters.langchain import MutxLangChainCallbackHandler
    >>>
    >>> handler = MutxLangChainCallbackHandler(api_url="https://api.mutx.dev", api_key="...")
    >>> agent = create_agent(ChatOpenAI(model="gpt-5.4-mini"), tools)
    >>> result = agent.invoke(
    ...     {"messages": [{"role": "user", "content": "Hello"}]},
    ...     {"callbacks": [handler]},
    ... )
"""

from __future__ import annotations

import asyncio
from collections.abc import Mapping
from datetime import datetime
from typing import Any

import httpx

try:
    from langchain_core.agents import AgentAction, AgentFinish
    from langchain_core.callbacks import BaseCallbackHandler
    from langchain_core.outputs import LLMResult
except ImportError as e:
    raise ImportError(
        "langchain is required for mutx.adapters.langchain. "
        "Install with: pip install mutx[langchain]"
    ) from e

from mutx.telemetry import get_tracer


class MutxLangChainCallbackHandler(BaseCallbackHandler):
    """Callback handler for tracing LangChain agent executions via OTel.

    This handler emits spans for:
    - LLM calls (mutx.llm.call)
    - Tool calls (mutx.tool.call)
    - Agent actions (logged to MUTX audit store)

    Attributes:
        api_url: Base URL for the MUTX API.
        api_key: API key for authentication.
        agent_name: Name of the agent for span attribution.
    """

    def __init__(
        self,
        api_url: str,
        api_key: str,
        agent_name: str = "langchain-agent",
    ):
        """Initialize the callback handler.

        Args:
            api_url: Base URL for the MUTX API.
            api_key: API key for authentication.
            agent_name: Name of the agent for span attribution.
        """
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.agent_name = agent_name
        self._http = httpx.Client(
            base_url=self.api_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
        self._tracer = get_tracer("mutx.langchain")

    def on_llm_start(
        self,
        serialized: dict[str, Any],
        prompts: list[str],
        **kwargs: Any,
    ) -> None:
        """Emit span when LLM call starts.

        Args:
            serialized: Serialized LLM configuration.
            prompts: List of input prompts to the LLM.
            **kwargs: Additional callback parameters.
        """
        span_name = "mutx.llm.call"
        attributes = {
            "llm.model": serialized.get("name", "unknown"),
            "llm.prompt_count": len(prompts),
            "agent.name": self.agent_name,
        }
        self._tracer.start_span(span_name, attributes=attributes)

    def on_chat_model_start(
        self,
        serialized: dict[str, Any],
        messages: list[list[Any]],
        **kwargs: Any,
    ) -> None:
        """Emit the same LLM span for LangChain v1 chat-model callbacks."""
        model_name = serialized.get("name")
        if not model_name:
            identifier = serialized.get("id") or []
            model_name = identifier[-1] if identifier else "unknown"
        self._tracer.start_span(
            "mutx.llm.call",
            attributes={
                "llm.model": model_name,
                "llm.prompt_count": len(messages),
                "agent.name": self.agent_name,
            },
        )

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Record span when LLM call ends.

        Args:
            response: The LLM result including generated outputs.
            **kwargs: Additional callback parameters.
        """
        # Get token usage if available
        token_usage = None
        if response.llm_output and "token_usage" in response.llm_output:
            token_usage = response.llm_output["token_usage"]

        attributes = {
            "llm.output_tokens": (token_usage.get("completion_tokens", 0) if token_usage else 0),
            "llm.prompt_tokens": (token_usage.get("prompt_tokens", 0) if token_usage else 0),
            "llm.total_tokens": (token_usage.get("total_tokens", 0) if token_usage else 0),
        }

        # Record the span via telemetry
        try:
            from opentelemetry import trace

            span = trace.get_current_span()
            if span:
                for key, value in attributes.items():
                    span.set_attribute(key, value)
        except Exception:
            pass  # Best effort telemetry recording

    def on_tool_start(
        self,
        serialized: dict[str, Any],
        input_str: str,
        *,
        run_id: str | None = None,
        parent_run_id: str | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> None:
        """Emit span when tool call starts.

        Args:
            serialized: Serialized tool configuration.
            input_str: Input string to the tool.
            run_id: Unique identifier for this tool run.
            parent_run_id: Parent run identifier for nested calls.
            tags: Tags associated with this run.
            metadata: Metadata for the run.
            **kwargs: Additional callback parameters.
        """
        tool_name = serialized.get("name", "unknown")
        span_name = "mutx.tool.call"
        attributes = {
            "tool.name": tool_name,
            "tool.input_length": len(input_str),
            "agent.name": self.agent_name,
        }
        self._tracer.start_span(span_name, attributes=attributes)

    def on_tool_end(
        self,
        output: Any,
        *,
        run_id: str | None = None,
        parent_run_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """End span when tool call completes.

        Args:
            output: Output from the tool execution.
            run_id: Unique identifier for this tool run.
            parent_run_id: Parent run identifier for nested calls.
            **kwargs: Additional callback parameters.
        """
        try:
            from opentelemetry import trace

            span = trace.get_current_span()
            if span:
                span.set_attribute("tool.output_length", len(str(output)))
                span.set_attribute("tool.success", True)
                span.end()
        except Exception:
            pass  # Best effort telemetry recording

    def on_tool_error(
        self,
        error: BaseException | str,
        *,
        run_id: str | None = None,
        parent_run_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Handle tool execution error.

        Args:
            error: The error that occurred.
            run_id: Unique identifier for this tool run.
            parent_run_id: Parent run identifier for nested calls.
            **kwargs: Additional callback parameters.
        """
        try:
            from opentelemetry import trace
            from opentelemetry.trace import Status, StatusCode

            span = trace.get_current_span()
            if span:
                span.set_status(Status(StatusCode.ERROR, str(error)))
                span.record_exception(error)
                span.end()
        except Exception:
            pass  # Best effort telemetry recording

    def on_agent_action(
        self,
        action: AgentAction,
        *,
        run_id: str | None = None,
        parent_run_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Log agent action to MUTX audit store.

        Args:
            action: The agent action that was taken.
            run_id: Unique identifier for this agent run.
            parent_run_id: Parent run identifier for nested calls.
            **kwargs: Additional callback parameters.
        """
        event = {
            "event_type": "agent_action",
            "agent_name": self.agent_name,
            "tool": action.tool,
            "tool_input": action.tool_input,
            "log": action.log,
            "timestamp": datetime.now().isoformat(),
            "run_id": run_id,
            "parent_run_id": parent_run_id,
        }

        # Best effort audit logging - don't block agent execution on failure
        try:
            self._http.post("/v1/events", json=event)
        except httpx.HTTPError:
            pass  # Fail silently to not interrupt agent execution

    def on_agent_finish(
        self,
        finish: AgentFinish,
        *,
        run_id: str | None = None,
        parent_run_id: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Log agent completion to MUTX audit store.

        Args:
            finish: The agent finish event.
            run_id: Unique identifier for this agent run.
            parent_run_id: Parent run identifier for nested calls.
            **kwargs: Additional callback parameters.
        """
        event = {
            "event_type": "agent_finish",
            "agent_name": self.agent_name,
            "output": finish.log,
            "return_values": finish.return_values,
            "timestamp": datetime.now().isoformat(),
            "run_id": run_id,
            "parent_run_id": parent_run_id,
        }

        try:
            self._http.post("/v1/events", json=event)
        except httpx.HTTPError:
            pass  # Fail silently

    def emit_v1_graph_events(self, messages: list[Any], output: str) -> None:
        """Emit the action and finish events removed with legacy AgentExecutor callbacks."""
        for message in messages:
            if isinstance(message, Mapping):
                tool_calls = message.get("tool_calls") or []
            else:
                tool_calls = getattr(message, "tool_calls", None) or []

            for tool_call in tool_calls:
                if not isinstance(tool_call, Mapping):
                    continue
                function = tool_call.get("function")
                if not isinstance(function, Mapping):
                    function = {}
                tool_name = tool_call.get("name") or function.get("name") or "unknown"
                tool_input = tool_call.get("args")
                if tool_input is None:
                    tool_input = function.get("arguments") or {}
                run_id = tool_call.get("id")
                event = {
                    "event_type": "agent_action",
                    "agent_name": self.agent_name,
                    "tool": tool_name,
                    "tool_input": tool_input,
                    "log": f"Calling {tool_name}",
                    "timestamp": datetime.now().isoformat(),
                    "run_id": str(run_id) if run_id is not None else None,
                    "parent_run_id": None,
                }
                try:
                    self._http.post("/v1/events", json=event)
                except httpx.HTTPError:
                    pass  # Audit delivery is best-effort and must not fail agent execution.

        finish_event = {
            "event_type": "agent_finish",
            "agent_name": self.agent_name,
            "output": output,
            "return_values": {"output": output},
            "timestamp": datetime.now().isoformat(),
            "run_id": None,
            "parent_run_id": None,
        }
        try:
            self._http.post("/v1/events", json=finish_event)
        except httpx.HTTPError:
            pass  # Audit delivery is best-effort and must not fail agent execution.

    def __del__(self) -> None:
        """Clean up HTTP client on deletion."""
        try:
            self._http.close()
        except Exception:
            pass


class MutxAgentKit:
    """High-level agent kit integrating LangChain with MUTX observability and guardrails.

    This kit provides:
    - Automatic OTel instrumentation via MutxLangChainCallbackHandler
    - Optional guardrails for input/output validation
    - Event streaming for backend integration

    Attributes:
        mutx_api_url: Base URL for the MUTX API.
        agent_name: Name of the agent.
        api_key: API key for authentication.
        guardrails_enabled: Whether to enable guardrails.

    Example:
        >>> kit = MutxAgentKit(
        ...     mutx_api_url="https://api.mutx.dev",
        ...     agent_name="my-agent",
        ...     api_key="mk-...",
        ...     guardrails_enabled=True,
        ... )
        >>> result = kit.arun("What is 2+2?")
        >>> print(result)
    """

    def __init__(
        self,
        mutx_api_url: str,
        agent_name: str,
        api_key: str,
        guardrails_enabled: bool = False,
    ):
        """Initialize the agent kit.

        Args:
            mutx_api_url: Base URL for the MUTX API.
            agent_name: Name of the agent for identification.
            api_key: API key for authentication.
            guardrails_enabled: Whether to enable input/output guardrails.
        """
        self.mutx_api_url = mutx_api_url.rstrip("/")
        self.agent_name = agent_name
        self.api_key = api_key
        self.guardrails_enabled = guardrails_enabled

        # Initialize callback handler for observability
        self._callback_handler = MutxLangChainCallbackHandler(
            api_url=self.mutx_api_url,
            api_key=self.api_key,
            agent_name=self.agent_name,
        )

        # Guardrail middleware (lazy import to avoid hard dependency)
        self._guardrail_middleware = None
        if guardrails_enabled:
            try:
                from mutx.guardrails import (
                    GuardrailMiddleware,
                    InputGuardrail,
                    OutputGuardrail,
                    PIIBlocklistGuardrail,
                    RegexBlocklistGuardrail,
                )

                input_guardrails: list[InputGuardrail] = [
                    PIIBlocklistGuardrail(),
                    RegexBlocklistGuardrail([r"(?i)\bsensitive\b", r"(?i)\bsecret\b"]),
                ]
                output_guardrails: list[OutputGuardrail] = [
                    PIIBlocklistGuardrail(),
                ]
                self._guardrail_middleware = GuardrailMiddleware(
                    input_guardrails=input_guardrails,
                    output_guardrails=output_guardrails,
                )
            except ImportError:
                pass  # Guardrails not available

        self._agent_executor: Any = None

    def set_agent_executor(self, executor: Any) -> None:
        """Set the LangChain v1 agent graph for this kit.

        Args:
            executor: A graph returned by ``langchain.agents.create_agent``.
        """
        self._agent_executor = executor

    @staticmethod
    def _extract_output(result: dict[str, Any]) -> str:
        """Extract text from either a v1 message state or a legacy output mapping."""
        if "output" in result:
            return str(result.get("output") or "")

        messages = result.get("messages") or []
        if not messages:
            return ""

        message = messages[-1]
        text = getattr(message, "text", "")
        if text:
            return str(text)
        if isinstance(message, dict):
            return str(message.get("content") or "")
        return str(getattr(message, "content", "") or "")

    def arun(self, input: str) -> str:
        """Run the agent synchronously.

        Args:
            input: The user input/question for the agent.

        Returns:
            The agent's response string.

        Raises:
            GuardrailViolationError: If guardrails are enabled and input/output is blocked.
            RuntimeError: If no agent executor has been set.
        """
        if self._guardrail_middleware:
            self._guardrail_middleware.check_input_text(input)

        if not self._agent_executor:
            raise RuntimeError("No agent executor set. Call set_agent_executor() first.")

        result = self._agent_executor.invoke(
            {"messages": [{"role": "user", "content": input}]},
            {"callbacks": [self._callback_handler]},
        )
        output = self._extract_output(result)
        if "messages" in result:
            self._callback_handler.emit_v1_graph_events(result["messages"], output)

        if self._guardrail_middleware:
            self._guardrail_middleware.check_output_text(output)

        return output

    async def arun_async(self, input: str) -> str:
        """Run the agent asynchronously.

        Args:
            input: The user input/question for the agent.

        Returns:
            The agent's response string.

        Raises:
            GuardrailViolationError: If guardrails are enabled and input/output is blocked.
            RuntimeError: If no agent executor has been set.
        """
        if self._guardrail_middleware:
            self._guardrail_middleware.check_input_text(input)

        if not self._agent_executor:
            raise RuntimeError("No agent executor set. Call set_agent_executor() first.")

        result = await self._agent_executor.ainvoke(
            {"messages": [{"role": "user", "content": input}]},
            {"callbacks": [self._callback_handler]},
        )
        output = self._extract_output(result)
        if "messages" in result:
            await asyncio.to_thread(
                self._callback_handler.emit_v1_graph_events,
                result["messages"],
                output,
            )

        if self._guardrail_middleware:
            self._guardrail_middleware.check_output_text(output)

        return output

    def stream_events(self):
        """Yield events for streaming back to the MUTX backend.

        This is a generator that yields agent execution events
        for real-time streaming to the backend.

        Yields:
            dict: Event dictionaries with type and data.
        """
        # Always yield stream start event
        yield {
            "event_type": "stream_start",
            "agent_name": self.agent_name,
            "timestamp": datetime.now().isoformat(),
        }

        if not self._agent_executor:
            return

        # Note: This is a stub implementation. In practice, you would
        # use LangChain's streaming callbacks to capture events.
        # The actual implementation would depend on the streaming architecture.
        yield {
            "event_type": "stream_start",
            "agent_name": self.agent_name,
            "timestamp": datetime.now().isoformat(),
        }


__all__ = [
    "MutxLangChainCallbackHandler",
    "MutxAgentKit",
]
