from __future__ import annotations


class CLIServiceError(Exception):
    """Base exception for reusable CLI service failures."""


class AuthenticationRequiredError(CLIServiceError):
    """Raised when a command requires local auth state."""


class AuthenticationExpiredError(CLIServiceError):
    """Raised when the remote API rejects stored credentials."""


class InvalidCredentialsError(CLIServiceError):
    """Raised when login credentials are invalid."""


class ResourceNotFoundError(CLIServiceError):
    """Raised when an API resource cannot be found."""


class ValidationError(CLIServiceError):
    """Raised when user input is invalid for a CLI operation."""


class APIRequestError(CLIServiceError):
    """Raised for non-success API responses."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code
