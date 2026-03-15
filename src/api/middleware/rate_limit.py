"""Rate limiting middleware for the API."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.api.config import get_settings
from src.api.models.error_schemas import RateLimitErrorResponse

logger = logging.getLogger(__name__)

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware.

    Uses a sliding window approach per IP address.
    For production, consider using Redis-backed storage.
    """

    def __init__(self, app: FastAPI, requests: int = None, window_seconds: int = None):
        super().__init__(app)
        self.requests = requests or settings.rate_limit_requests
        self.window_seconds = window_seconds or settings.rate_limit_window_seconds
        self._requests: dict[str, list[datetime]] = {}

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from the direct connection."""
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self) -> None:
        """Remove requests outside the current window and stale client entries."""
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self.window_seconds)
        for client_id, timestamps in list(self._requests.items()):
            active_timestamps = [ts for ts in timestamps if ts > cutoff]
            if active_timestamps:
                self._requests[client_id] = active_timestamps
            else:
                del self._requests[client_id]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        # Skip rate limiting for health checks and metrics
        path = request.url.path
        if path in ["/health", "/ready", "/", "/metrics"]:
            return await call_next(request)

        self._clean_old_requests()
        client_id = self._get_client_ip(request)

        current_count = len(self._requests.get(client_id, []))

        if current_count >= self.requests:
            retry_after = self.window_seconds
            logger.warning(
                "Rate limit exceeded | client=%s | count=%s | limit=%s",
                client_id,
                current_count,
                self.requests,
            )

            response = RateLimitErrorResponse(
                status="error",
                error_code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please try again later.",
                retry_after=retry_after,
            )

            return JSONResponse(
                status_code=429,
                content=response.model_dump(),
                headers={"Retry-After": str(retry_after)},
            )

        # Record this request
        self._requests.setdefault(client_id, []).append(datetime.now(timezone.utc))

        logger.debug(
            "Rate limit check | client=%s | count=%s | limit=%s | path=%s",
            client_id,
            current_count + 1,
            self.requests,
            path,
        )

        return await call_next(request)


def add_rate_limiting(app: FastAPI) -> None:
    """Add rate limiting middleware to the app."""
    app.add_middleware(RateLimitMiddleware)
    logger.info(
        "Rate limiting enabled: %s requests per %s seconds",
        settings.rate_limit_requests,
        settings.rate_limit_window_seconds,
    )
