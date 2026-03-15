import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import ASGITransport, AsyncClient

from src.api.config import get_settings
from src.api.middleware.security import (
    CSRF_FAILURE_DETAIL,
    HSTS_POLICY,
    add_security_middleware,
)


@pytest_asyncio.fixture
async def security_client():
    origins = get_settings().cors_origins
    app = FastAPI(title="Security Middleware Test API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    add_security_middleware(app, origins)

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    @app.post("/api/state-change")
    async def state_change():
        return {"status": "updated"}

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_cors_preflight_allows_configured_origin(security_client: AsyncClient):
    origin = get_settings().cors_origins[0]
    response = await security_client.options(
        "/api/state-change",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"
    assert response.headers["strict-transport-security"] == HSTS_POLICY


@pytest.mark.asyncio
async def test_cors_preflight_rejects_disallowed_origin(security_client: AsyncClient):
    response = await security_client.options(
        "/api/state-change",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


@pytest.mark.asyncio
async def test_security_headers_are_applied_to_responses(security_client: AsyncClient):
    response = await security_client.get("/health")

    assert response.status_code == 200
    assert response.headers["strict-transport-security"] == HSTS_POLICY
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["permissions-policy"] == "geolocation=(), microphone=(), camera=()"


@pytest.mark.asyncio
async def test_csrf_rejects_state_change_with_disallowed_origin(security_client: AsyncClient):
    response = await security_client.post(
        "/api/state-change",
        headers={"Origin": "https://evil.example"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": CSRF_FAILURE_DETAIL}


@pytest.mark.asyncio
async def test_csrf_allows_state_change_with_configured_origin(security_client: AsyncClient):
    origin = get_settings().cors_origins[0]
    response = await security_client.post(
        "/api/state-change",
        headers={"Origin": origin},
    )

    assert response.status_code == 200
