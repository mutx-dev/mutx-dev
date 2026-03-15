"""Structured error response schemas for the API."""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
import uuid


class ErrorDetail(BaseModel):
    """Detailed error information for a specific field."""
    loc: list[str] = Field(description="Location of the error (e.g., ['body', 'replicas'])")
    msg: str = Field(description="Error message")
    type: str = Field(description="Error type (e.g., 'value_error')")


class ErrorResponse(BaseModel):
    """Standard error response for all API errors."""
    status: str = Field(default="error", description="Error status")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")
    message: str = Field(description="Human-readable error message")
    details: Optional[list[ErrorDetail]] = Field(None, description="Detailed validation errors")
    request_id: Optional[str] = Field(None, description="Request ID for tracing")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "error",
                    "error_code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": [
                        {
                            "loc": ["body", "replicas"],
                            "msg": "Input should be less than or equal to 10",
                            "type": "less_than_equal"
                        }
                    ],
                    "request_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": "2026-03-15T01:00:00Z"
                }
            ]
        }
    }


class ValidationErrorResponse(ErrorResponse):
    """Specific error response for validation errors (422)."""
    error_code: str = Field(default="VALIDATION_ERROR", description="Error code for validation")
    message: str = Field(default="Request validation failed", description="Error message")


class RateLimitErrorResponse(ErrorResponse):
    """Specific error response for rate limiting (429)."""
    error_code: str = Field(default="RATE_LIMIT_EXCEEDED", description="Error code for rate limiting")
    message: str = Field(default="Rate limit exceeded", description="Error message")
    retry_after: Optional[int] = Field(None, description="Seconds to wait before retry")


class NotFoundErrorResponse(ErrorResponse):
    """Specific error response for not found errors (404)."""
    error_code: str = Field(default="NOT_FOUND", description="Error code for not found")
    message: str = Field(default="Resource not found", description="Error message")


class UnauthorizedErrorResponse(ErrorResponse):
    """Specific error response for unauthorized errors (401)."""
    error_code: str = Field(default="UNAUTHORIZED", description="Error code for unauthorized")
    message: str = Field(default="Authentication required", description="Error message")


class ForbiddenErrorResponse(ErrorResponse):
    """Specific error response for forbidden errors (403)."""
    error_code: str = Field(default="FORBIDDEN", description="Error code for forbidden")
    message: str = Field(default="Access denied", description="Error message")


class InternalErrorResponse(ErrorResponse):
    """Specific error response for internal server errors (500)."""
    error_code: str = Field(default="INTERNAL_ERROR", description="Error code for internal error")
    message: str = Field(default="Internal server error", description="Error message")
