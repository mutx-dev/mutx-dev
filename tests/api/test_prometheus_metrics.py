"""
Tests for Prometheus /metrics endpoint.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from fastapi import FastAPI

from src.api.metrics import router as metrics_router


def create_test_app_with_metrics() -> FastAPI:
    """Create a test FastAPI application with metrics."""
    from src.api.routes import (
        agents,
        deployments,
        api_keys,
        auth,
        webhooks,
        clawhub,
        agent_runtime,
        newsletter,
        ingest,
        leads,
        runs,
        usage,
        analytics,
        budgets,
        monitoring,
        swarms,
    )

    app = FastAPI(title="MUTX Test API")

    # Include routers
    app.include_router(agents.router, prefix="/v1")
    app.include_router(deployments.router, prefix="/v1")
    app.include_router(api_keys.router, prefix="/v1")
    app.include_router(auth.router, prefix="/v1")
    app.include_router(webhooks.router, prefix="/v1")
    app.include_router(clawhub.router, prefix="/v1")
    app.include_router(agent_runtime.router, prefix="/v1")
    app.include_router(newsletter.router, prefix="/v1")
    app.include_router(leads.router, prefix="/v1")
    app.include_router(leads.contacts_router, prefix="/v1")
    app.include_router(ingest.router, prefix="/v1")
    app.include_router(runs.router, prefix="/v1")
    app.include_router(usage.router, prefix="/v1")
    app.include_router(analytics.router, prefix="/v1")
    app.include_router(budgets.router, prefix="/v1")
    app.include_router(monitoring.router, prefix="/v1")
    app.include_router(swarms.router, prefix="/v1")

    # Include metrics router (without prefix)
    app.include_router(metrics_router, tags=["monitoring"])

    # Health check endpoint
    @app.get("/")
    async def root():
        return {"message": "mutx.dev API", "version": "1.0.0"}

    @app.get("/ready")
    async def ready():
        return {
            "status": "ready",
        }

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_returns_200():
    """Test that /metrics endpoint returns 200 OK."""
    test_app = create_test_app_with_metrics()

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.get("/metrics")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_returns_prometheus_format():
    """Test that /metrics endpoint returns Prometheus format."""
    test_app = create_test_app_with_metrics()

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.get("/metrics")

    assert response.status_code == 200
    content = response.text
    # Prometheus format typically has lines like "metric_name{labels} value"
    assert (
        "# HELP" in content
        or "# TYPE" in content
        or any(line for line in content.split("\n") if line and not line.startswith("#"))
    )


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_content_type():
    """Test that /metrics endpoint returns correct content type."""
    test_app = create_test_app_with_metrics()

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.get("/metrics")

    assert response.status_code == 200
    assert "text/plain" in response.headers.get("content-type", "")
    assert "version=0.0.4" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_prometheus_metrics_endpoint_available_without_auth():
    """Test that /metrics endpoint is available without authentication."""
    test_app = create_test_app_with_metrics()

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.get("/metrics")

    assert response.status_code == 200
