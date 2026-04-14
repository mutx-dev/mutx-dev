"""
OpenTelemetry tracing middleware.

Handles TRACEPARENT/TRACESTATE header extraction and injection
for distributed trace context propagation.
"""

from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator


class TracingMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and propagate trace context headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract trace context from incoming headers
        carrier = {}
        propagator = TraceContextTextMapPropagator()

        # Get TRACEPARENT and TRACESTATE headers
        traceparent = request.headers.get("TRACEPARENT")
        tracestate = request.headers.get("TRACESTATE")

        if traceparent:
            carrier["traceparent"] = traceparent
        if tracestate:
            carrier["tracestate"] = tracestate

        # Extract trace context and use as parent for request span
        extracted_context = propagator.extract(carrier)

        # Parse trace_id and span_id from TRACEPARENT if available
        # Format: 00-<trace_id>-<span_id>-<trace_flags>
        trace_id = None
        span_id = None

        if traceparent:
            parts = traceparent.split("-")
            if len(parts) >= 3:
                trace_id = parts[1]
                span_id = parts[2]

        # Store in request state for downstream access
        request.state.trace_id = trace_id
        request.state.span_id = span_id
        request.state.traceparent = traceparent
        request.state.tracestate = tracestate

        # Create request span as child of extracted trace context
        tracer = trace.get_tracer(__name__)
        with tracer.start_as_current_span(
            f"{request.method} {request.url.path}",
            context=extracted_context,
        ) as request_span:
            request_span.set_attribute("http.method", request.method)
            request_span.set_attribute("http.url", str(request.url))
            response = await call_next(request)
            request_span.set_attribute("http.status_code", response.status_code)

        return response


def add_tracing_middleware(app):
    """Add tracing middleware to the FastAPI application."""
    app.add_middleware(TracingMiddleware)
