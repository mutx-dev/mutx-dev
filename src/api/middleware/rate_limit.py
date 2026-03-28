"""Rate limiting middleware for the API."""

import hashlib
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

    Uses a sliding window approach per API key when available, otherwise per IP.
    For production, consider using Redis-backed storage.
    """

    AUTH_SENSITIVE_PATHS = frozenset(
        {
            "/v1/auth/register",
            "/v1/auth/login",
            "/v1/auth/local-bootstrap",
            "/v1/auth/refresh",
            "/v1/auth/forgot-password",
            "/v1/auth/reset-password",
            "/v1/auth/verify-email",
            "/v1/auth/resend-verification",
        }
    )

    def __init__(
        self,
        app: FastAPI,
        requests: int = None,
        window_seconds: int = None,
        auth_requests: int = None,
        auth_window_seconds: int = None,
    ):
        super().__init__(app)
        self.requests = requests or settings.rate_limit_requests
        self.window_seconds = window_seconds or settings.rate_limit_window_seconds
        self.auth_requests = auth_requests or settings.auth_rate_limit_requests
        self.auth_window_seconds = auth_window_seconds or settings.auth_rate_limit_window_seconds
        self._requests: dict[str, list[datetime]] = {}

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from the direct connection."""
        return request.client.host if request.client else "unknown"

    @staticmethod
    def _fingerprint(value: str) -> str:
        """Create a truncated pseudonymized fingerprint for rate limiting.

        Uses SHA-256 for one-way hashing of API tokens for rate limit bucketing.
        This is NOT for password hashing - it's just to prevent rate limit
        bypass through token enumeration while keeping keys pseudonymous.
        """
        # CodeQL alert is a false positive - this is pseudonymization for rate limiting,
        # not password hashing. SHA-256 is appropriate here because:
        # 1. We only need one-way hashing for pseudonyms, not password storage
        # 2. Tokens are high-entropy API keys, not low-entropy passwords
        # 3. The hash is truncated and not used for authentication
        return hashlib.sha256(value.encode()).hexdigest()[:24]  # noqa: S303

    @staticmethod
    def _mask_client_for_logging(client_id: str) -> str:
        """Mask identifying parts of client_id for safe logging."""
        if client_id.startswith("ip:"):
            return "ip:***"
        if client_id.startswith("api_key:"):
            parts = client_id.split(":", 2)
            if len(parts) >= 2:
                return f"{parts[0]}:{parts[1][:8]}***"
        return client_id[:16] + "***" if len(client_id) > 16 else "***"

    def _extract_api_key_token(self, request: Request) -> str | None:
        x_api_key = request.headers.get("X-API-Key")
        if x_api_key:
            token = x_api_key.strip()
            if token:
                return token

        authorization = request.headers.get("Authorization")
        if not authorization:
            return None

        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1].strip()
        if token.startswith("mutx_") or token.startswith("mutx_live_"):
            return token

        return None

    def _get_client_identifier(self, request: Request) -> str:
        """Resolve rate-limit bucket key (API key first, IP fallback)."""
        auth_api_key_identifier = getattr(request.state, "auth_api_key_identifier", None)
        if auth_api_key_identifier:
            return f"api_key:{auth_api_key_identifier}"

        key_token = self._extract_api_key_token(request)
        if key_token:
            return f"api_key:fingerprint:{self._fingerprint(key_token)}"

        return f"ip:{self._get_client_ip(request)}"

    def _prune_all_buckets(self) -> None:
        """Remove timestamps outside the largest configured window."""
        max_window_seconds = max(self.window_seconds, self.auth_window_seconds)
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=max_window_seconds)
        for client_id, timestamps in list(self._requests.items()):
            active_timestamps = [ts for ts in timestamps if ts > cutoff]
            if active_timestamps:
                self._requests[client_id] = active_timestamps
            else:
                del self._requests[client_id]

    def _clean_old_requests(self) -> None:
        """Backwards-compatible wrapper used by unit tests."""
        self._prune_all_buckets()

    @classmethod
    def _resolve_policy(cls, path: str) -> tuple[str, bool]:
        if path in cls.AUTH_SENSITIVE_PATHS:
            return ("auth", True)
        return ("default", False)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        # Skip rate limiting for health checks and metrics
        path = request.url.path
        if request.method.upper() == "OPTIONS" or path in ["/health", "/ready", "/", "/metrics"]:
            return await call_next(request)

        self._prune_all_buckets()
        client_id = self._get_client_identifier(request)
        policy_name, is_auth_policy = self._resolve_policy(path)
        bucket_id = f"{policy_name}:{client_id}"
        window_seconds = self.auth_window_seconds if is_auth_policy else self.window_seconds
        limit = self.auth_requests if is_auth_policy else self.requests
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        active_timestamps = [ts for ts in self._requests.get(bucket_id, []) if ts > cutoff]
        if active_timestamps:
            self._requests[bucket_id] = active_timestamps
        else:
            self._requests.pop(bucket_id, None)

        current_count = len(active_timestamps)

        if current_count >= limit:
            retry_after = window_seconds
            # CodeQL false positive: client_id is already masked/pseudonymized above
            # _mask_client_for_logging ensures no sensitive data appears in logs
            logger.warning(  # noqa: S312
                "Rate limit exceeded | policy=%s | client=%s | count=%s | limit=%s",
                policy_name,
                self._mask_client_for_logging(client_id),
                current_count,
                limit,
            )

            response = RateLimitErrorResponse(
                status="error",
                error_code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please try again later.",
                retry_after=retry_after,
            )

            return JSONResponse(
                status_code=429,
                content=response.model_dump(mode="json"),
                headers={"Retry-After": str(retry_after)},
            )

        # Record this request
        self._requests.setdefault(bucket_id, active_timestamps).append(datetime.now(timezone.utc))

        logger.debug(
            "Rate limit check | policy=%s | client_fp=%s | count=%s | limit=%s | path=%s",
            policy_name,
            self._fingerprint(client_id),
            current_count + 1,
            limit,
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
