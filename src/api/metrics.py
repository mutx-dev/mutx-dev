"""
Prometheus metrics for MUTX API monitoring.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import APIRouter, Response, Request
import time

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
mutx_document_queue_depth = Gauge(
    "mutx_document_queue_depth",
    "Current size of the document workflow queue",
)

mutx_document_jobs_total = Counter(
    "mutx_document_jobs_total",
    "Total document workflow jobs by template and status",
    ["template_id", "status"],
)

mutx_document_artifact_ops_total = Counter(
    "mutx_document_artifact_ops_total",
    "Document artifact operations by operation and storage backend",
    ["operation", "storage_backend"],
)

mutx_document_execution_duration_seconds = Histogram(
    "mutx_document_execution_duration_seconds",
    "Document workflow execution duration in seconds",
    ["template_id", "status"],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
)
mutx_reasoning_queue_depth = Gauge(
    "mutx_reasoning_queue_depth",
    "Current size of the reasoning workflow queue",
)
mutx_reasoning_jobs_total = Counter(
    "mutx_reasoning_jobs_total",
    "Total reasoning workflow jobs by template and status",
    ["template_id", "status"],
)
mutx_reasoning_artifact_ops_total = Counter(
    "mutx_reasoning_artifact_ops_total",
    "Reasoning artifact operations by operation and storage backend",
    ["operation", "storage_backend"],
)
mutx_reasoning_execution_duration_seconds = Histogram(
    "mutx_reasoning_execution_duration_seconds",
    "Reasoning workflow execution duration in seconds",
    ["template_id", "status"],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
)

# API metrics
mutx_api_calls_total = Counter("mutx_api_calls_total", "Total API calls", ["endpoint"])

# Error metrics
mutx_errors_total = Counter("mutx_errors_total", "Total errors by type", ["type", "endpoint"])
mutx_runtime_schema_repairs_applied = Gauge(
    "mutx_runtime_schema_repairs_applied",
    "Whether runtime schema repair ran during startup",
)
mutx_runtime_schema_repairs_total = Gauge(
    "mutx_runtime_schema_repairs_total",
    "Number of runtime schema repairs applied during startup",
)
mutx_background_monitor_consecutive_failures = Gauge(
    "mutx_background_monitor_consecutive_failures",
    "Current number of consecutive background monitor failures",
)

router = APIRouter()


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type="text/plain; version=0.0.4")


# Middleware for HTTP metrics
async def track_request(request: Request, call_next):
    """Track HTTP request metrics."""
    start_time = time.time()

    # Track active connections
    http_connections_active.inc()

    try:
        response = await call_next(request)
    except Exception as e:
        # Track errors
        mutx_errors_total.labels(type=type(e).__name__, endpoint=request.url.path).inc()
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


def set_runtime_schema_repair_metrics(repaired_objects: list[str]) -> None:
    mutx_runtime_schema_repairs_applied.set(1 if repaired_objects else 0)
    mutx_runtime_schema_repairs_total.set(len(repaired_objects))


def set_background_monitor_failure_metrics(consecutive_failures: int) -> None:
    mutx_background_monitor_consecutive_failures.set(consecutive_failures)
