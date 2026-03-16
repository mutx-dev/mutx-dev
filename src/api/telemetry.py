"""
OpenTelemetry instrumentation for MUTX API server.
"""

import os
import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Optional

from fastapi import FastAPI, Request
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.trace.propagation import TraceContextTextMapPropagator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.propagate import inject, extract

logger = logging.getLogger(__name__)


@dataclass
class ApiTelemetryConfig:
    """Configuration for API OpenTelemetry."""
    service_name: str = "mutx-api"
    otlp_endpoint: Optional[str] = None
    otlp_headers: Optional[dict] = None
    service_version: str = "unknown"


def setup_telemetry(app: FastAPI, config: Optional[ApiTelemetryConfig] = None) -> None:
    """Setup OpenTelemetry for the FastAPI application."""
    config = config or ApiTelemetryConfig()
    
    resource = Resource.create({
        SERVICE_NAME: config.service_name,
        "service.version": config.service_version,
        "deployment.environment": os.getenv("ENVIRONMENT", "development"),
    })
    
    # Setup tracer provider
    tracer_provider = TracerProvider(resource=resource)
    
    if config.otlp_endpoint:
        try:
            otlp_exporter = OTLPSpanExporter(
                endpoint=config.otlp_endpoint,
                headers=config.otlp_headers or {},
            )
            tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
            logger.info(f"OTLP tracing enabled: {config.otlp_endpoint}")
        except Exception as e:
            logger.warning(f"Failed to setup OTLP exporter: {e}")
    
    trace.set_tracer_provider(tracer_provider)
    
    # Setup metrics
    try:
        metric_reader = PeriodicExportingMetricReader(
            OTLPMetricExporter(
                endpoint=config.otlp_endpoint,
                headers=config.otlp_headers or {},
            )
        )
        meter_provider = MeterProvider(
            resource=resource,
            metric_readers=[metric_reader],
        )
    except Exception as e:
        logger.warning(f"Failed to setup metrics: {e}")
    
    # Instrument FastAPI
    try:
        FastAPIInstrumentor.instrument_app(app)
        logger.info("FastAPI instrumentation enabled")
    except Exception as e:
        logger.warning(f"Failed to instrument FastAPI: {e}")
    
    # Store tracer in app state
    app.state.tracer = trace.get_tracer(__name__)


def extract_trace_context(request: Request) -> dict:
    """Extract trace context from incoming request headers."""
    # Extract from HTTP headers
    carrier = {
        "traceparent": request.headers.get("traceparent", ""),
        "tracestate": request.headers.get("tracestate", ""),
    }
    propagator = TraceContextTextMapPropagator()
    return extract(carrier)


def inject_trace_context(headers: dict) -> None:
    """Inject trace context into outgoing request headers."""
    inject(headers)


# Convenience function to get tracer
def get_tracer(name: str = __name__):
    return trace.get_tracer(name)
