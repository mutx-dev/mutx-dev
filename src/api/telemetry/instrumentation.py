"""
OpenTelemetry instrumentation utilities for MUTX agents.

This module provides decorators and utilities for instrumenting
agent operations with trace spans.

Issue: #1029
"""

from __future__ import annotations

import functools
import time
from typing import Any, Callable, TypeVar, ParamSpec

from opentelemetry.trace import Status, StatusCode

from .telemetry import get_tracer, Spans

# Type variables for decorator
P = ParamSpec("P")
R = TypeVar("R")


def traced(
    span_name: str | None = None,
    attributes: dict[str, Any] | None = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Decorator to add tracing to a function.
    
    Args:
        span_name: Name of the span (default: function name)
        attributes: Static attributes to add to the span
    
    Example:
        @traced("agent.execute")
        async def execute_agent(agent_id: str, input_data: dict):
            ...
    
    Or with dynamic attributes:
        @traced(attributes={"service": "mutx"})
        def process():
            ...
    """
    tracer = get_tracer()
    
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        name = span_name or func.__name__
        
        @functools.wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            with tracer.start_as_current_span(name) as span:
                # Add static attributes
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                
                # Add function name
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            with tracer.start_as_current_span(name) as span:
                # Add static attributes
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                
                # Add function name
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        
        # Return appropriate wrapper based on whether function is async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore
    
    return decorator


def trace_llm_call(
    model: str,
    stream: bool = False,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Decorator specifically for LLM API calls.
    
    Adds standard attributes for LLM tracing:
    - llm.model
    - llm.stream
    - llm.vendor
    
    Args:
        model: Model name (e.g., "gpt-4", "claude-3-opus")
        stream: Whether this is a streaming call
    
    Example:
        @trace_llm_call("gpt-4")
        async def call_openai(messages):
            ...
    """
    # Extract vendor from model name
    vendor = "unknown"
    model_lower = model.lower()
    if "gpt" in model_lower or "openai" in model_lower:
        vendor = "openai"
    elif "claude" in model_lower or "anthropic" in model_lower:
        vendor = "anthropic"
    elif "gemini" in model_lower or "google" in model_lower:
        vendor = "google"
    
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            tracer = get_tracer()
            with tracer.start_as_current_span(Spans.LLM_CALL) as span:
                span.set_attribute("llm.model", model)
                span.set_attribute("llm.stream", stream)
                span.set_attribute("llm.vendor", vendor)
                span.set_attribute("operation", "chat_completion")
                
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    
                    # Extract token counts if available
                    if hasattr(result, "usage") and result.usage:
                        usage = result.usage
                        if hasattr(usage, "prompt_tokens"):
                            span.set_attribute("llm.usage.prompt_tokens", usage.prompt_tokens)
                        if hasattr(usage, "completion_tokens"):
                            span.set_attribute("llm.usage.completion_tokens", usage.completion_tokens)
                        if hasattr(usage, "total_tokens"):
                            span.set_attribute("llm.usage.total_tokens", usage.total_tokens)
                    
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
                finally:
                    duration = time.time() - start_time
                    span.set_attribute("duration_ms", duration * 1000)
        
        @functools.wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            tracer = get_tracer()
            with tracer.start_as_current_span(Spans.LLM_CALL) as span:
                span.set_attribute("llm.model", model)
                span.set_attribute("llm.stream", stream)
                span.set_attribute("llm.vendor", vendor)
                
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
                finally:
                    duration = time.time() - start_time
                    span.set_attribute("duration_ms", duration * 1000)
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore
    
    return decorator


def trace_tool_execution(tool_name: str) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Decorator for tracing tool executions.
    
    Args:
        tool_name: Name of the tool being executed
    
    Example:
        @trace_tool_execution("weather_lookup")
        async def get_weather(location: str):
            ...
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            tracer = get_tracer()
            with tracer.start_as_current_span(Spans.TOOL_EXECUTION) as span:
                span.set_attribute("tool.name", tool_name)
                span.set_attribute("operation", "tool_call")
                
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
                finally:
                    duration = time.time() - start_time
                    span.set_attribute("duration_ms", duration * 1000)
        
        @functools.wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            tracer = get_tracer()
            with tracer.start_as_current_span(Spans.TOOL_EXECUTION) as span:
                span.set_attribute("tool.name", tool_name)
                
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
                finally:
                    duration = time.time() - start_time
                    span.set_attribute("duration_ms", duration * 1000)
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        return sync_wrapper  # type: ignore
    
    return decorator
