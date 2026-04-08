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


def test_get_client_identifier_uses_ip_without_authenticated_api_key_context() -> None:
    middleware = RateLimitMiddleware(FastAPI(), requests=5, window_seconds=60)
    request = _request_with_headers(
        headers=[(b"x-api-key", b"mutx_live_abc123"), (b"host", b"testserver")],
        client_host="192.0.2.50",
    )

    assert middleware._get_client_identifier(request) == "ip:192.0.2.50"


@pytest.mark.asyncio
async def test_dispatch_rate_limits_by_ip_without_authenticated_api_key_context() -> None:
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

    first_response = await middleware.dispatch(key_one_request, call_next)
    second_response = await middleware.dispatch(key_two_request, call_next)

    assert first_response.status_code == 200
    assert second_response.status_code == 429
