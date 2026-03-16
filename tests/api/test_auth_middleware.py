import uuid

from fastapi import FastAPI, Request
from httpx import ASGITransport, AsyncClient
import pytest

import src.api.middleware.auth as auth_middleware
from src.api.middleware.auth import add_authentication_middleware


def _build_app() -> FastAPI:
    app = FastAPI()
    add_authentication_middleware(app)

    @app.get("/state")
    async def state(request: Request):
        auth_user_id = getattr(request.state, "auth_user_id", None)
        auth_api_key_id = getattr(request.state, "auth_api_key_id", None)
        return {
            "auth_user_id": str(auth_user_id) if auth_user_id else None,
            "auth_method": getattr(request.state, "auth_method", None),
            "auth_api_key_id": str(auth_api_key_id) if auth_api_key_id else None,
            "auth_api_key_identifier": getattr(request.state, "auth_api_key_identifier", None),
        }

    return app


@pytest.mark.asyncio
async def test_auth_middleware_sets_jwt_context(monkeypatch):
    expected_user_id = uuid.uuid4()
    monkeypatch.setattr(
        auth_middleware,
        "verify_access_token",
        lambda token: expected_user_id if token == "valid.jwt.token" else None,
    )

    app = _build_app()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/state", headers={"Authorization": "Bearer valid.jwt.token"})

    assert response.status_code == 200
    assert response.json() == {
        "auth_user_id": str(expected_user_id),
        "auth_method": "jwt",
        "auth_api_key_id": None,
        "auth_api_key_identifier": None,
    }


@pytest.mark.asyncio
async def test_auth_middleware_sets_api_key_context(monkeypatch):
    expected_user_id = uuid.uuid4()
    expected_key_id = uuid.uuid4()

    monkeypatch.setattr(auth_middleware, "verify_access_token", lambda _token: None)

    async def fake_populate_api_key_context(request: Request, token: str) -> None:
        assert token == "mutx_live_example"
        request.state.auth_user_id = expected_user_id
        request.state.auth_method = "api_key"
        request.state.auth_api_key_id = expected_key_id
        request.state.auth_api_key_identifier = f"managed:{expected_key_id}"

    monkeypatch.setattr(auth_middleware, "_populate_api_key_context", fake_populate_api_key_context)

    app = _build_app()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/state", headers={"X-API-Key": "mutx_live_example"})

    assert response.status_code == 200
    assert response.json() == {
        "auth_user_id": str(expected_user_id),
        "auth_method": "api_key",
        "auth_api_key_id": str(expected_key_id),
        "auth_api_key_identifier": f"managed:{expected_key_id}",
    }


@pytest.mark.asyncio
async def test_auth_middleware_leaves_request_unauthenticated_when_headers_missing():
    app = _build_app()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/state")

    assert response.status_code == 200
    assert response.json() == {
        "auth_user_id": None,
        "auth_method": None,
        "auth_api_key_id": None,
        "auth_api_key_identifier": None,
    }
