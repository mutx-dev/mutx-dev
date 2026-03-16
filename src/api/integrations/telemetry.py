"""
OpenTelemetry support for MUTX agents.

Enable via environment variables:
    MUTX_OTEL_ENABLED=true
    MUTX_OTEL_EXPORTER=otlp_http  # or otlp_grpc, console, jaeger, zipkin
    MUTX_OTEL_ENDPOINT=https://your-otel-collector:4318
    MUTX_OTEL_SERVICE_NAME=mutx-backend
    MUTX_OTEL_MASK_INPUT=true
    MUTX_OTEL_MASK_OUTPUT=true
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

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
        # Status, StatusCode imported in trace_async
        from opentelemetry.sdk.propagate import set_global_textmap
        from opentelemetry.propagators.b3 import B3MultiFormatPropagator

        service_name = os.getenv("MUTX_OTEL_SERVICE_NAME", "mutx-backend")
        resource = Resource.create({SERVICE_NAME: service_name})
        provider = TracerProvider(resource=resource)

        exporter_type = os.getenv("MUTX_OTEL_EXPORTER", "console")
        endpoint = os.getenv("MUTX_OTEL_ENDPOINT", "")

        # Support multiple exporters
        if exporter_type == "otlp_http":
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

            headers = os.getenv("MUTX_OTEL_HEADERS", "")
            parsed_headers = {}
            if headers:
                for header in headers.split(","):
                    if "=" in header:
                        key, value = header.split("=", 1)
                        parsed_headers[key.strip()] = value.strip()
            span_exporter = OTLPSpanExporter(endpoint=endpoint, headers=parsed_headers)
        elif exporter_type == "otlp_grpc":
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

            span_exporter = OTLPSpanExporter(endpoint=endpoint)
        elif exporter_type == "jaeger":
            from opentelemetry.exporter.jaeger.thrift import JaegerExporter

            jaeger_host = os.getenv("MUTX_OTEL_JAEGER_HOST", "localhost")
            jaeger_port = int(os.getenv("MUTX_OTEL_JAEGER_PORT", "6831"))
            span_exporter = JaegerExporter(
                agent_host_name=jaeger_host,
                agent_port=jaeger_port,
            )
        elif exporter_type == "zipkin":
            from opentelemetry.exporter.zipkin.proto.http import ZipkinExporter

            zipkin_endpoint = os.getenv(
                "MUTX_OTEL_ZIPKIN_ENDPOINT", "http://localhost:9411/api/v2/spans"
            )
            span_exporter = ZipkinExporter(endpoint=zipkin_endpoint)
        else:
            span_exporter = ConsoleSpanExporter()

        provider.add_span_processor(BatchSpanProcessor(span_exporter))
        trace.set_tracer_provider(provider)
        set_global_textmap(B3MultiFormatPropagator())
        _tracer = trace.get_tracer(__name__)

        return _tracer, True
    except ImportError as e:
        import logging

        logging.warning(f"OpenTelemetry import error: {e}")
        return None, False
    except Exception as e:
        import logging

        logging.warning(f"OpenTelemetry setup error: {e}")
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
    from opentelemetry.trace import Status, StatusCode
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
