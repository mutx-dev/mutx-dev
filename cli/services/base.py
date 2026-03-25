from __future__ import annotations

import json
from collections.abc import Iterable
from typing import Any

import httpx

from cli.config import CLIConfig, HOSTED_API_URL, LOCAL_API_URL, current_config, get_client
from cli.errors import (
    APIRequestError,
    AuthenticationExpiredError,
    AuthenticationRequiredError,
    ResourceNotFoundError,
    ValidationError,
)


class APIService:
    """Shared service base for Click commands and the Textual UI."""

    def __init__(self, config: CLIConfig | None = None, client_factory=None):
        self.config = config or current_config()
        self._client_factory = client_factory or get_client

    def require_authentication(self) -> None:
        if not self.config.is_authenticated():
            raise AuthenticationRequiredError("Not authenticated. Run 'mutx login' first.")

    def _unreachable_api_message(self) -> str:
        api_url = self.config.api_url
        if api_url == LOCAL_API_URL:
            return (
                f"Could not reach the local control plane at {LOCAL_API_URL}. "
                "Run `mutx setup local` to bootstrap it, or use `mutx setup hosted` "
                f"for the hosted lane at {HOSTED_API_URL}."
            )

        return f"Could not reach API at {api_url}. Check that the control plane is running and reachable."

    def _request(
        self,
        method: str,
        path: str,
        *,
        require_auth: bool = True,
        allow_refresh: bool = True,
        **kwargs: Any,
    ):
        if require_auth:
            self.require_authentication()

        response = self._perform_request(method, path, **kwargs)

        if (
            response.status_code == 401
            and require_auth
            and allow_refresh
            and path != "/v1/auth/refresh"
            and self._refresh_auth_tokens()
        ):
            response = self._perform_request(method, path, **kwargs)

        if response.status_code == 401:
            raise AuthenticationExpiredError("Authentication expired. Run 'mutx login' again.")

        return response

    def _perform_request(self, method: str, path: str, **kwargs: Any):
        client = self._client_factory(self.config)
        try:
            try:
                return getattr(client, method.lower())(path, **kwargs)
            except httpx.HTTPError as exc:
                raise APIRequestError(self._unreachable_api_message()) from exc
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

    def _refresh_auth_tokens(self) -> bool:
        refresh_token = getattr(self.config, "refresh_token", None)
        if not refresh_token:
            return False

        response = self._perform_request(
            "post",
            "/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        if response.status_code != 200:
            return False

        payload = response.json()
        access_token = payload.get("access_token")
        next_refresh_token = payload.get("refresh_token")

        if hasattr(self.config, "access_token"):
            self.config.access_token = access_token
        else:
            self.config.api_key = access_token
        self.config.refresh_token = next_refresh_token
        return True

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
