from collections.abc import Iterable

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from starlette.responses import Response

SAFE_HTTP_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
CSRF_FAILURE_DETAIL = "CSRF validation failed: origin is not allowed"
HSTS_POLICY = "max-age=63072000; includeSubDomains"


def _normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/").lower()


def _allowed_origins_set(allowed_origins: Iterable[str]) -> set[str]:
    return {_normalize_origin(origin) for origin in allowed_origins if origin}


def _apply_security_headers(response: Response) -> Response:
    response.headers["Strict-Transport-Security"] = HSTS_POLICY
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


def add_security_middleware(app: FastAPI, allowed_origins: Iterable[str]) -> None:
    normalized_allowed_origins = _allowed_origins_set(allowed_origins)

    @app.middleware("http")
    async def _security_middleware(request: Request, call_next):
        request_origin = request.headers.get("origin")
        if request.method.upper() not in SAFE_HTTP_METHODS and request_origin:
            if _normalize_origin(request_origin) not in normalized_allowed_origins:
                csrf_rejection = JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": CSRF_FAILURE_DETAIL},
                )
                return _apply_security_headers(csrf_rejection)

        response = await call_next(request)
        return _apply_security_headers(response)
