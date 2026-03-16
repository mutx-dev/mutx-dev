"""
Prometheus metrics for MUTX API monitoring.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
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

router = APIRouter()


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Middleware for HTTP metrics
async def track_request(request: Request, call_next):
    """Track HTTP request metrics."""
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time
    path = request.url.path

    # Track request count
    http_requests_total.labels(method=request.method, path=path, status=response.status_code).inc()

    # Track duration
    http_request_duration_seconds.labels(method=request.method, path=path).observe(duration)

    return response
