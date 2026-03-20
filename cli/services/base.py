from __future__ import annotations

import json
from collections.abc import Iterable
from typing import Any

from cli.config import CLIConfig, current_config, get_client


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


class APIService:
    """Shared service base for Click commands and the Textual UI."""

    def __init__(self, config: CLIConfig | None = None, client_factory=None):
        self.config = config or current_config()
        self._client_factory = client_factory or get_client

    def require_authentication(self) -> None:
        if not self.config.is_authenticated():
            raise AuthenticationRequiredError("Not authenticated. Run 'mutx login' first.")

    def _request(
        self,
        method: str,
        path: str,
        *,
        require_auth: bool = True,
        **kwargs: Any,
    ):
        if require_auth:
            self.require_authentication()

        client = self._client_factory(self.config)
        try:
            response = getattr(client, method.lower())(path, **kwargs)
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

        if response.status_code == 401:
            raise AuthenticationExpiredError("Authentication expired. Run 'mutx login' again.")

        return response

    def _expect_status(
        self,
        response,
        ok_statuses: Iterable[int],
        *,
        not_found_message: str | None = None,
        invalid_message: str | None = None,
    ):
        ok_values = set(ok_statuses)
        if response.status_code in ok_values:
            return response

        if not_found_message and response.status_code == 404:
            raise ResourceNotFoundError(not_found_message)

        if invalid_message and response.status_code == 400:
            raise ValidationError(self._extract_error_message(response, invalid_message))

        raise APIRequestError(
            self._extract_error_message(response, "Request failed."),
            status_code=response.status_code,
        )

    @staticmethod
    def _extract_error_message(response, fallback: str) -> str:
        try:
            payload = response.json()
        except Exception:
            payload = None

        if isinstance(payload, dict):
            detail = payload.get("detail")
            if isinstance(detail, str) and detail.strip():
                return detail
            if detail is not None:
                try:
                    return json.dumps(detail)
                except TypeError:
                    return str(detail)

        text = getattr(response, "text", None)
        if text:
            return str(text)

        return fallback
