"""
OpenTelemetry observability for MUTX SDK.

This module provides standardized tracing using OpenTelemetry (OTEL),
supporting OTLP export when an endpoint is configured, or logging exporter
as a fallback for local development.

Standard span naming: mutx.<operation>
Standard attributes: agent.id, session.id, trace.id
"""

from __future__ import annotations

import atexit
from contextlib import contextmanager
from typing import Any, Generator

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SimpleSpanProcessor,
)
from opentelemetry.trace import Status, StatusCode, Tracer
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

# Global state
_tracer_provider: TracerProvider | None = None
_tracer: Tracer | None = None
_telemetry_endpoint: str | None = None
_telemetry_enabled: bool = False

# Flag to track if instrumentation is available
_instrumentation_available: bool | None = None
_httpx_instrumented: bool = False


def _check_instrumentation() -> bool:
    """Check if opentelemetry-instrumentation packages are available."""
    global _instrumentation_available
    if _instrumentation_available is None:
        try:
            from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor  # noqa: F401

            _instrumentation_available = True
        except ImportError:
            _instrumentation_available = False
    return _instrumentation_available


def shutdown_telemetry() -> None:
    """Flush and stop the current telemetry provider."""
    global _tracer_provider, _tracer, _telemetry_endpoint, _telemetry_enabled

    if _tracer_provider is not None:
        try:
            _tracer_provider.shutdown()
        except Exception:
            pass

    _tracer_provider = None
    _tracer = None
    _telemetry_endpoint = None
    _telemetry_enabled = False


def init_telemetry(agent_name: str, endpoint: str | None = None) -> None:
    """Initialize OpenTelemetry tracing.

    Args:
        agent_name: Name of the agent/service for tracing.
        endpoint: OTLP endpoint for exporting spans. If None, uses console exporter.
    """
    global _tracer_provider, _tracer, _telemetry_endpoint, _telemetry_enabled

    # Re-importing this module in tests loses the local globals but not the
    # process-global OTel tracer provider. Reuse that provider instead of
    # trying to replace it and spawning another exporter thread.
    if _tracer_provider is None:
        current_provider = trace.get_tracer_provider()
        if isinstance(current_provider, TracerProvider):
            _tracer_provider = current_provider
            _tracer = trace.get_tracer(agent_name)
            _telemetry_endpoint = endpoint
            _telemetry_enabled = True
            _instrument_httpx_once()
            return
    else:
        shutdown_telemetry()

    resource = Resource.create({"service.name": agent_name, "service.version": "1.0.0"})

    if endpoint:
        _telemetry_endpoint = endpoint
        exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        _telemetry_enabled = True
        span_processor = BatchSpanProcessor(exporter)
    else:
        _telemetry_endpoint = None
        exporter = ConsoleSpanExporter()
        _telemetry_enabled = True
        # Console export in local/tests should stay synchronous to avoid a
        # background worker writing after stdout/stderr closes.
        span_processor = SimpleSpanProcessor(exporter)

    _tracer_provider = TracerProvider(resource=resource)
    _tracer_provider.add_span_processor(span_processor)
    trace.set_tracer_provider(_tracer_provider)
    _tracer = trace.get_tracer(agent_name)

    # Auto-instrument httpx if available
    _instrument_httpx_once()


def _instrument_httpx_once() -> None:
    global _httpx_instrumented
    if _check_instrumentation():
        try:
            from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

            if not _httpx_instrumented:
                HTTPXClientInstrumentor().instrument()
                _httpx_instrumented = True
        except Exception:
            pass


def get_tracer(name: str) -> Tracer:
    """Get a tracer instance.

    Args:
        name: Name for the tracer, typically the module or component name.

    Returns:
        Configured tracer instance.
    """
    global _tracer
    if _tracer is None:
        # Return a no-op tracer if telemetry not initialized
        return trace.get_tracer(name)
    return _tracer


@contextmanager
def span(name: str, attributes: dict[str, Any] | None = None) -> Generator[Any, None, None]:
    """Context manager for creating a span with attributes and exception recording.

    Args:
        name: Name of the span, should follow mutx.<operation> pattern.
        attributes: Optional dictionary of span attributes.

    Yields:
        The span object.

    Example:
        with span("mutx.agent.execute", {"agent.id": "abc123"}) as span_obj:
            span_obj.set_attribute("session.id", "session-456")
            # ... do work ...
    """
    tracer = get_tracer("mutx")
    with tracer.start_as_current_span(name, attributes=attributes) as span_obj:
        try:
            yield span_obj
        except Exception as e:
            span_obj.set_status(Status(StatusCode.ERROR, str(e)))
            span_obj.record_exception(e)
            raise


def trace_context() -> dict[str, str]:
    """Get current trace context as W3C trace headers.

    Returns:
        Dictionary with TRACEPARENT and TRACESTATE headers for propagation.
    """
    carrier: dict[str, str] = {}
    propagator = TraceContextTextMapPropagator()
    propagator.inject(carrier)
    return carrier


def get_telemetry_config() -> dict[str, Any]:
    """Get current telemetry configuration.

    Returns:
        Dictionary with otel_enabled, exporter_type, and endpoint.
    """
    global _telemetry_enabled, _telemetry_endpoint
    return {
        "otel_enabled": _telemetry_enabled,
        "exporter_type": "otlp" if _telemetry_endpoint else "logging",
        "endpoint": _telemetry_endpoint,
    }


atexit.register(shutdown_telemetry)
