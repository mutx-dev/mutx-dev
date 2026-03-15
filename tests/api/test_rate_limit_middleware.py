from datetime import datetime, timedelta

from fastapi import FastAPI
from starlette.requests import Request

from src.api.middleware.rate_limit import RateLimitMiddleware


def _request_with_headers(headers: list[tuple[bytes, bytes]], client_host: str = "127.0.0.1") -> Request:
    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "path": "/api/test",
        "raw_path": b"/api/test",
        "query_string": b"",
        "headers": headers,
        "client": (client_host, 12345),
        "server": ("testserver", 80),
        "scheme": "http",
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
    now = datetime.utcnow()

    middleware._requests = {
        "stale-client": [now - timedelta(seconds=120)],
        "active-client": [now - timedelta(seconds=5)],
    }

    middleware._clean_old_requests()

    assert "stale-client" not in middleware._requests
    assert "active-client" in middleware._requests
    assert len(middleware._requests["active-client"]) == 1
