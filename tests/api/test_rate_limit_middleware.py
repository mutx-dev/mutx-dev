from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import pytest
from starlette.requests import Request

from src.api.middleware.rate_limit import RateLimitMiddleware


def _request_with_headers(
    headers: list[tuple[bytes, bytes]],
    client_host: str = "127.0.0.1",
    state: dict | None = None,
    path: str = "/v1/test",
    method: str = "GET",
) -> Request:
    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": method,
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": headers,
        "client": (client_host, 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "state": state or {},
    }
    return Request(scope)


def test_get_client_ip_ignores_x_forwarded_for_header() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=5, window_seconds=60)
    request = _request_with_headers(
        headers=[(b"x-forwarded-for", b"203.0.113.10"), (b"host", b"testserver")],
        client_host="192.0.2.50",
    )

    assert middleware._get_client_ip(request) == "192.0.2.50"


def test_clean_old_requests_removes_stale_client_entries() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=5, window_seconds=60)
    now = datetime.now(timezone.utc)

    middleware._requests = {
        "stale-client": [now - timedelta(seconds=120)],
        "active-client": [now - timedelta(seconds=5)],
    }

    middleware._clean_old_requests()

    assert "stale-client" not in middleware._requests
    assert "active-client" in middleware._requests
    assert len(middleware._requests["active-client"]) == 1


def test_get_client_identifier_prefers_authenticated_api_key_context() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=5, window_seconds=60)
    request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        state={"auth_api_key_identifier": "managed:00000000-0000-0000-0000-000000000001"},
    )

    assert (
        middleware._get_client_identifier(request)
        == "api_key:managed:00000000-0000-0000-0000-000000000001"
    )


def test_get_client_identifier_uses_api_key_fingerprint_without_state() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=5, window_seconds=60)
    request = _request_with_headers(
        headers=[(b"x-api-key", b"mutx_live_abc123"), (b"host", b"testserver")],
        client_host="192.0.2.50",
    )

    identifier = middleware._get_client_identifier(request)
    assert identifier.startswith("api_key:fingerprint:")


@pytest.mark.asyncio
async def test_dispatch_rate_limits_per_api_key_not_per_ip() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=1, window_seconds=60)

    async def call_next(_request: Request):
        return JSONResponse({"ok": True}, status_code=200)

    key_one_request = _request_with_headers(
        headers=[(b"x-api-key", b"mutx_live_key_one"), (b"host", b"testserver")],
        client_host="192.0.2.50",
    )
    key_two_request = _request_with_headers(
        headers=[(b"x-api-key", b"mutx_live_key_two"), (b"host", b"testserver")],
        client_host="192.0.2.50",
    )
    repeated_key_one_request = _request_with_headers(
        headers=[(b"x-api-key", b"mutx_live_key_one"), (b"host", b"testserver")],
        client_host="192.0.2.50",
    )

    first_response = await middleware.dispatch(key_one_request, call_next)
    second_response = await middleware.dispatch(key_two_request, call_next)
    third_response = await middleware.dispatch(repeated_key_one_request, call_next)

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert third_response.status_code == 429


@pytest.mark.asyncio
async def test_dispatch_uses_stricter_limit_for_auth_paths() -> None:
    middleware = RateLimitMiddleware(
        FastAPI(),
        requests=5,
        window_seconds=60,
        auth_requests=2,
        auth_window_seconds=300,
    )

    async def call_next(_request: Request):
        return JSONResponse({"ok": True}, status_code=200)

    first_request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/auth/login",
        method="POST",
    )
    second_request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/auth/login",
        method="POST",
    )
    third_request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/auth/login",
        method="POST",
    )

    assert (await middleware.dispatch(first_request, call_next)).status_code == 200
    assert (await middleware.dispatch(second_request, call_next)).status_code == 200
    assert (await middleware.dispatch(third_request, call_next)).status_code == 429


@pytest.mark.asyncio
async def test_dispatch_keeps_auth_and_general_buckets_separate() -> None:
    middleware = RateLimitMiddleware(
        FastAPI(),
        requests=2,
        window_seconds=60,
        auth_requests=1,
        auth_window_seconds=300,
    )

    async def call_next(_request: Request):
        return JSONResponse({"ok": True}, status_code=200)

    auth_request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/auth/forgot-password",
        method="POST",
    )
    repeated_auth_request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/auth/forgot-password",
        method="POST",
    )
    general_request = _request_with_headers(
        headers=[(b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/deployments",
        method="GET",
    )

    assert (await middleware.dispatch(auth_request, call_next)).status_code == 200
    assert (await middleware.dispatch(repeated_auth_request, call_next)).status_code == 429
    assert (await middleware.dispatch(general_request, call_next)).status_code == 200


@pytest.mark.asyncio
async def test_dispatch_skips_options_preflight_requests() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=1, window_seconds=60)

    async def call_next(_request: Request):
        return JSONResponse({"ok": True}, status_code=200)

    preflight_request = _request_with_headers(
        headers=[(b"origin", b"https://app.mutx.dev"), (b"host", b"testserver")],
        client_host="192.0.2.50",
        path="/v1/auth/login",
        method="OPTIONS",
    )

    first_response = await middleware.dispatch(preflight_request, call_next)
    second_response = await middleware.dispatch(preflight_request, call_next)

    assert first_response.status_code == 200
    assert second_response.status_code == 200
