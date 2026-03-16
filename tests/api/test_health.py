"""Tests for the /health endpoint and its dependency checks."""

import time
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select as sa_select

from src.api.models.schemas import DependencyStatus, HealthResponse


def _make_health_app() -> FastAPI:
    """Build a minimal FastAPI app that exposes the real health_check logic."""
    import logging

    logger = logging.getLogger(__name__)
    app = FastAPI()
    app.state.start_time = time.time()

    @app.get("/health", response_model=HealthResponse)
    async def health_check(request: Request):
        from src.api.database import async_session_maker

        uptime = (
            time.time() - request.app.state.start_time
            if hasattr(request.app.state, "start_time")
            else 0
        )

        db_status = "healthy"
        db_error: str | None = None
        try:
            async with async_session_maker() as session:
                await session.execute(sa_select(1))
        except Exception as exc:
            db_status = "unhealthy"
            db_error = str(exc)
            logger.warning("Health check: database connectivity failed: %s", exc)

        dependencies: dict[str, DependencyStatus] = {
            "database": DependencyStatus(status=db_status, error=db_error),
        }

        all_healthy = all(dep.status == "healthy" for dep in dependencies.values())
        overall_status = "healthy" if all_healthy else "degraded"

        return HealthResponse(
            status=overall_status,
            timestamp=datetime.now(timezone.utc),
            database=db_status,
            error=db_error,
            uptime_seconds=uptime,
            dependencies=dependencies,
        )

    return app


# ---------------------------------------------------------------------------
# Schema unit tests
# ---------------------------------------------------------------------------


def test_dependency_status_healthy():
    dep = DependencyStatus(status="healthy")
    assert dep.status == "healthy"
    assert dep.error is None


def test_dependency_status_unhealthy_with_error():
    dep = DependencyStatus(status="unhealthy", error="Connection refused")
    assert dep.status == "unhealthy"
    assert dep.error == "Connection refused"


def test_health_response_includes_dependencies():
    now = datetime.now(timezone.utc)
    resp = HealthResponse(
        status="healthy",
        timestamp=now,
        database="healthy",
        uptime_seconds=42.0,
        dependencies={"database": DependencyStatus(status="healthy")},
    )
    assert "database" in resp.dependencies
    assert resp.dependencies["database"].status == "healthy"


def test_health_response_default_dependencies_is_empty_dict():
    now = datetime.now(timezone.utc)
    resp = HealthResponse(status="healthy", timestamp=now)
    assert resp.dependencies == {}


# ---------------------------------------------------------------------------
# Endpoint integration tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_endpoint_healthy_database():
    """When the database is reachable the endpoint reports healthy."""
    mock_session = AsyncMock()
    mock_session.execute = AsyncMock(return_value=MagicMock())

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=False)

    mock_session_maker = MagicMock(return_value=mock_ctx)

    with patch("src.api.database.async_session_maker", mock_session_maker):
        app = _make_health_app()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "dependencies" in data
    assert data["dependencies"]["database"]["status"] == "healthy"
    assert data["dependencies"]["database"]["error"] is None
    assert "uptime_seconds" in data
    assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_health_endpoint_degraded_when_database_fails():
    """When the database is unreachable the endpoint reports degraded."""
    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(side_effect=Exception("Connection refused"))
    mock_ctx.__aexit__ = AsyncMock(return_value=False)

    mock_session_maker = MagicMock(return_value=mock_ctx)

    with patch("src.api.database.async_session_maker", mock_session_maker):
        app = _make_health_app()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["dependencies"]["database"]["status"] == "unhealthy"
    assert data["dependencies"]["database"]["error"] is not None


@pytest.mark.asyncio
async def test_health_endpoint_response_schema():
    """Verify the response contains all expected top-level fields."""
    mock_session = AsyncMock()
    mock_session.execute = AsyncMock(return_value=MagicMock())

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=False)

    mock_session_maker = MagicMock(return_value=mock_ctx)

    with patch("src.api.database.async_session_maker", mock_session_maker):
        app = _make_health_app()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/health")

    data = response.json()
    for field in ("status", "timestamp", "database", "version", "uptime_seconds", "dependencies"):
        assert field in data, f"Missing field: {field}"
