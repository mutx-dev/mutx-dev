"""
Prometheus metrics for MUTX API monitoring.

Phase 3+4: HTTP Instrumentation + Metrics Export
- FastAPI middleware for automatic request tracing (OpenTelemetry)
- Response time metrics
- Prometheus metrics endpoint at /metrics
- Custom metrics: agents_running, tokens_used, requests_total, errors_total
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Response, Request
import time
from typing import Callable

# Custom metrics for Issue #1029
agents_running = Gauge("agents_running", "Number of currently running agents")
tokens_used = Counter("tokens_used", "Total tokens used", ["model", "endpoint"])
requests_total = Counter("requests_total", "Total HTTP requests received")
errors_total = Counter("errors_total", "Total errors encountered", ["type", "endpoint"])

# HTTP metrics
http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "path", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Request size metrics
http_request_size_bytes = Histogram(
    "http_request_size_bytes",
    "HTTP request size in bytes",
    ["method", "path"],
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000],
)

# Response size metrics
http_response_size_bytes = Histogram(
    "http_response_size_bytes",
    "HTTP response size in bytes",
    ["method", "path"],
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
)

# Active connections
http_connections_active = Gauge("http_connections_active", "Number of active HTTP connections")

# Database metrics
db_pool_size = Gauge("db_pool_size", "Database connection pool size")
db_pool_acquired = Gauge("db_pool_acquired", "Number of acquired database connections")
db_pool_overflow = Gauge("db_pool_overflow", "Number of overflow connections")
db_query_duration_seconds = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

# Agent metrics
mutx_agents_total = Gauge("mutx_agents_total", "Total number of agents")

mutx_agents_active = Gauge("mutx_agents_active", "Number of active agents")

mutx_agent_tasks_total = Counter(
    "mutx_agent_tasks_total",
    "Total agent tasks processed",
    ["status"],  # success, failed, timeout
)

mutx_agent_task_duration_seconds = Histogram(
    "mutx_agent_task_duration_seconds",
    "Agent task duration in seconds",
    buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 300.0, 600.0],
)

# Deployment metrics
mutx_deployments_total = Gauge("mutx_deployments_total", "Total number of deployments")

mutx_deployments_running = Gauge("mutx_deployments_running", "Number of running deployments")

mutx_deployments_by_status = Gauge(
    "mutx_deployments_by_status", "Deployments by status", ["status"]
)

# Queue metrics
mutx_queue_size = Gauge("mutx_queue_size", "Current size of agent task queue")

# API metrics
mutx_api_calls_total = Counter("mutx_api_calls_total", "Total API calls", ["endpoint"])

# Error metrics (alias for errors_total for backward compatibility)
mutx_errors_total = Counter("mutx_errors_total", "Total errors by type", ["type", "endpoint"])

router = APIRouter()


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Middleware for HTTP metrics
async def track_request(request: Request, call_next):
    """Track HTTP request metrics."""
    start_time = time.time()

    # Track active connections
    http_connections_active.inc()
    
    # Increment total requests
    requests_total.inc()

    try:
        response = await call_next(request)
    except Exception as e:
        # Track errors using both metrics
        error_type = type(e).__name__
        endpoint = request.url.path
        errors_total.labels(type=error_type, endpoint=endpoint).inc()
        mutx_errors_total.labels(type=error_type, endpoint=endpoint).inc()
        raise
    finally:
        http_connections_active.dec()

    duration = time.time() - start_time
    path = request.url.path

    # Track request count
    http_requests_total.labels(method=request.method, path=path, status=response.status_code).inc()

    # Track duration
    http_request_duration_seconds.labels(method=request.method, path=path).observe(duration)

    return response


# OpenTelemetry FastAPI instrumentation
def setup_opentelemetry(app, service_name: str = "mutx-backend"):
    """
    Set up OpenTelemetry instrumentation for FastAPI.
    
    This enables automatic request tracing using opentelemetry-instrumentation-fastapi.
    """
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.propagate import set_global_textmap
        from opentelemetry.propagators.b3 import B3MultiFormatPropagator
        import os
        
        # Configure resource
        resource = Resource.create({SERVICE_NAME: service_name})
        
        # Create tracer provider
        provider = TracerProvider(resource=resource)
        
        # Configure OTLP exporter if enabled
        otel_enabled = os.getenv("MUTX_OTEL_ENABLED", "false").lower() == "true"
        
        if otel_enabled:
            endpoint = os.getenv("MUTX_OTEL_ENDPOINT", "")
            headers = os.getenv("MUTX_OTEL_HEADERS", "")
            
            # Parse headers
            parsed_headers = {}
            if headers:
                for header in headers.split(","):
                    if "=" in header:
                        key, value = header.split("=", 1)
                        parsed_headers[key.strip()] = value.strip()
            
            # Add OTLP exporter
            if endpoint:
                span_exporter = OTLPSpanExporter(
                    endpoint=endpoint,
                    headers=parsed_headers,
                )
                provider.add_span_processor(BatchSpanProcessor(span_exporter))
        
        # Set tracer provider
        trace.set_tracer_provider(provider)
        
        # Set up B3 propagation
        set_global_textmap(B3MultiFormatPropagator())
        
        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(app)
        
        return True
    except ImportError as e:
        # OpenTelemetry packages not installed
        import logging
        logging.warning(f"OpenTelemetry instrumentation not available: {e}")
        return False
    except Exception as e:
        import logging
        logging.warning(f"Failed to set up OpenTelemetry: {e}")
        return False


# Helper functions to update custom metrics
def increment_tokens_used(model: str, endpoint: str, tokens: int = 1):
    """Increment tokens_used counter."""
    tokens_used.labels(model=model, endpoint=endpoint).inc(tokens)


def set_agents_running(count: int):
    """Set the current number of running agents."""
    agents_running.set(count)


def increment_errors(error_type: str, endpoint: str):
    """Increment errors_total counter."""
    errors_total.labels(type=error_type, endpoint=endpoint).inc()
