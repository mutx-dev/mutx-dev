"""
OpenTelemetry support for MUTX agents.

Enable via environment variables:
    MUTX_OTEL_ENABLED=true
    MUTX_OTEL_EXPORTER=otlp_http  # or otlp_grpc, console
    MUTX_OTEL_ENDPOINT=https://your-otel-collector:4318
    MUTX_OTEL_SERVICE_NAME=mutx-backend
    MUTX_OTEL_MASK_INPUT=true
    MUTX_OTEL_MASK_OUTPUT=true
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

_tracer = None
_otel_enabled = False


def init_otel():
    global _tracer, _otel_enabled
    
    enabled = os.getenv("MUTX_OTEL_ENABLED", "false").lower() == "true"
    if not enabled:
        return None, False
    
    _otel_enabled = True
    
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.trace import Status, StatusCode
        from opentelemetry.trace.propagation import set_span_in_context
        from opentelemetry.sdk.propagate import set_global_textmap
        from opentelemetry.propagators.b3 import B3MultiFormatPropagator
        
        service_name = os.getenv("MUTX_OTEL_SERVICE_NAME", "mutx-backend")
        resource = Resource.create({SERVICE_NAME: service_name})
        provider = TracerProvider(resource=resource)
        
        exporter_type = os.getenv("MUTX_OTEL_EXPORTER", "console")
        endpoint = os.getenv("MUTX_OTEL_ENDPOINT", "")
        
        if exporter_type == "otlp_http":
            span_exporter = OTLPSpanExporter(endpoint=endpoint)
        else:
            span_exporter = ConsoleSpanExporter()
        
        provider.add_span_processor(BatchSpanProcessor(span_exporter))
        trace.set_tracer_provider(provider)
        set_global_textmap(B3MultiFormatPropagator())
        _tracer = trace.get_tracer(__name__)
        
        return _tracer, True
    except ImportError:
        return None, False


def get_tracer():
    global _tracer
    if _tracer is None:
        _tracer, _ = init_otel()
    return _tracer


def is_otel_enabled():
    global _otel_enabled
    return _otel_enabled


@asynccontextmanager
async def trace_async(name, attributes=None, mask_input=False, mask_output=False):
    tracer = get_tracer()
    if tracer is None:
        yield None
        return
    
    with tracer.start_as_current_span(name) as span:
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, str(value))
        
        try:
            yield span
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise


init_otel()
