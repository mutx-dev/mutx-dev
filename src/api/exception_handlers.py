"""Custom exception handlers for the API."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from src.api.models.error_schemas import (
    ErrorDetail,
    ValidationErrorResponse,
    InternalErrorResponse,
)

logger = logging.getLogger(__name__)


def _get_request_id(request: Request) -> str:
    """Extract or generate request ID for tracing."""
    return str(getattr(request.state, "request_id", uuid.uuid4()))


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors with structured response."""
    request_id = _get_request_id(request)

    # Build detailed error list
    details = []
    for error in exc.errors():
        details.append(
            ErrorDetail(
                loc=list(error.get("loc", [])),
                msg=error.get("msg", "Validation error"),
                type=error.get("type", "value_error"),
            )
        )

    # Log validation errors
    logger.warning(
        "Request validation failed: %s errors | request_id=%s | path=%s",
        len(details),
        request_id,
        request.url.path,
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "errors": [{"loc": d.loc, "msg": d.msg, "type": d.type} for d in details],
        },
    )

    response = ValidationErrorResponse(
        status="error",
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        details=details,
        request_id=request_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response.model_dump(mode="json"),
    )


async def pydantic_validation_exception_handler(
    request: Request, exc: ValidationError
) -> JSONResponse:
    """Handle Pydantic model validation errors."""
    request_id = _get_request_id(request)

    details = []
    for error in exc.errors():
        details.append(
            ErrorDetail(
                loc=list(error.get("loc", [])),
                msg=error.get("msg", "Validation error"),
                type=error.get("type", "value_error"),
            )
        )

    logger.warning(
        "Pydantic validation error: %s errors | request_id=%s | path=%s",
        len(details),
        request_id,
        request.url.path,
    )

    response = ValidationErrorResponse(
        status="error",
        error_code="VALIDATION_ERROR",
        message="Data validation failed",
        details=details,
        request_id=request_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response.model_dump(mode="json"),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions with structured response."""
    request_id = _get_request_id(request)

    logger.exception(
        "Unhandled exception | request_id=%s | path=%s | error=%s",
        request_id,
        request.url.path,
        str(exc),
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__,
        },
    )

    response = InternalErrorResponse(
        status="error",
        error_code="INTERNAL_ERROR",
        message="An internal error occurred",
        request_id=request_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response.model_dump(mode="json"),
    )
