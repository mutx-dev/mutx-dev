"""
OpenTelemetry setup for MUTX agents.

This module provides standardized tracing using OpenTelemetry (OTEL),
supporting multiple backends (Jaeger, Zipkin, Grafana Tempo, etc.).

Issue: #1029
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator, Any

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
)
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.trace import Status, StatusCode

# Default service name
DEFAULT_SERVICE_NAME = "mutx"


def get_exporter_from_env():
    """Get the appropriate span exporter based on environment variables.

    Environment Variables:
        OTEL_TRACES_EXPORTER: otlp, jaeger, zipkin, console (default: console)
        OTEL_EXPORTER_OTLP_ENDPOINT: OTLP gRPC/HTTP endpoint
    """
    exporter_type = os.getenv("OTEL_TRACES_EXPORTER", "console")

    if exporter_type == "otlp":
        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

            endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
            return OTLPSpanExporter(endpoint=endpoint)
        except ImportError:
            pass

    elif exporter_type == "zipkin":
        try:
            from opentelemetry.exporter.zipkin.proto.http import ZipkinExporter

            endpoint = os.getenv(
                "OTEL_EXPORTER_ZIPKIN_ENDPOINT", "http://localhost:9411/api/v2/spans"
            )
            return ZipkinExporter(endpoint=endpoint)
        except ImportError:
            pass

    # Default: console exporter for development
    return ConsoleSpanExporter()


def setup_telemetry(service_name: str | None = None) -> trace.Tracer:
    """Initialize OpenTelemetry tracing.

    Args:
        service_name: Name of the service (default: from OTEL_SERVICE_NAME or "mutx")

    Returns:
        Configured tracer instance

    Environment Variables:
        OTEL_SERVICE_NAME: Name of the service
        OTEL_TRACES_SAMPLER: parentbased_traceidratio, always_on, always_off
        OTEL_TRACES_SAMPLER_ARG: Sampler argument (e.g., 0.1 for 10% sampling)
    """
    # Get service name
    name = service_name or os.getenv("OTEL_SERVICE_NAME", DEFAULT_SERVICE_NAME)

    # Create resource with service name
    resource = Resource(attributes={SERVICE_NAME: name})

    # Configure sampler based on env
    sampler_type = os.getenv("OTEL_TRACES_SAMPLER", "parentbased_traceidratio")
    sampler_arg = os.getenv("OTEL_TRACES_SAMPLER_ARG", "0.1")

    if sampler_type == "always_on":
        from opentelemetry.sdk.trace.sampling import AlwaysOnSampler

        provider = TracerProvider(resource=resource, sampler=AlwaysOnSampler())
    elif sampler_type == "always_off":
        from opentelemetry.sdk.trace.sampling import AlwaysOffSampler

        provider = TracerProvider(resource=resource, sampler=AlwaysOffSampler())
    else:
        # Parent-based trace ID ratio (default)
        try:
            from opentelemetry.sdk.trace.sampling import ParentBasedTraceIdRatio

            provider = TracerProvider(
                resource=resource,
                sampler=ParentBasedTraceIdRatio(float(sampler_arg)),
            )
        except ImportError:
            # Fallback if sampling import fails
            provider = TracerProvider(resource=resource)

    # Add span processor with exporter
    try:
        exporter = get_exporter_from_env()
        provider.add_span_processor(BatchSpanProcessor(exporter))
    except Exception:
        # If exporter fails, continue without it
        pass

    # Set global tracer provider
    trace.set_tracer_provider(provider)

    # Return configured tracer
    return trace.get_tracer(name)


@contextmanager
def create_span(
    tracer: trace.Tracer,
    name: str,
    attributes: dict[str, Any] | None = None,
) -> Generator[Any, None, None]:
    """Context manager for creating a span.

    Args:
        tracer: The tracer to use
        name: Name of the span
        attributes: Optional attributes for the span

    Example:
        with create_span(tracer, "agent.execution", {"agent_id": "abc123"}) as span:
            span.set_attribute("model", "gpt-4")
            # ... do work ...
    """
    with tracer.start_as_current_span(name, attributes=attributes) as span:
        try:
            yield span
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise


# Standard span names for agent operations
class Spans:
    """Standard span names for MUTX agent operations."""

    AGENT_EXECUTION = "agent.execution"
    AGENT_INITIALIZE = "agent.initialize"
    LLM_CALL = "llm.call"
    TOOL_EXECUTION = "tool.execution"
    AGENT_RESPONSE = "agent.response"


# Pre-configured tracer (initialized on first use)
_tracer: trace.Tracer | None = None


def get_tracer() -> trace.Tracer:
    """Get the global tracer, initializing if needed."""
    global _tracer
    if _tracer is None:
        _tracer = setup_telemetry()
    return _tracer
