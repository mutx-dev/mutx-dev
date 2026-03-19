from __future__ import annotations

from cli.services.base import APIRequestError, APIService, InvalidCredentialsError
from cli.services.models import CLIStatus, UserProfile


class AuthService(APIService):
    def status(self) -> CLIStatus:
        return CLIStatus(
            api_url=self.config.api_url,
            config_path=self.config.config_path,
            authenticated=self.config.is_authenticated(),
            has_api_key=bool(self.config.api_key),
            has_refresh_token=bool(self.config.refresh_token),
        )

    def login(self, email: str, password: str, api_url: str | None = None) -> CLIStatus:
        if api_url:
            self.config.api_url = api_url
        elif not self.config.api_url:
            self.config.api_url = "http://localhost:8000"

        response = self._request(
            "post",
            "/v1/auth/login",
            require_auth=False,
            json={"email": email, "password": password},
        )

        if response.status_code == 200:
            tokens = response.json()
            self.config.api_key = tokens.get("access_token")
            self.config.refresh_token = tokens.get("refresh_token")
            return self.status()

        if response.status_code == 401:
            raise InvalidCredentialsError("Invalid email or password")

        raise APIRequestError(
            self._extract_error_message(response, "Login failed."),
            status_code=response.status_code,
        )

    def logout(self) -> bool:
        if not self.config.is_authenticated():
            return False

        self.config.clear_auth()
        return True

    def whoami(self) -> UserProfile:
        response = self._request("get", "/v1/auth/me")
        self._expect_status(response, {200})
        return UserProfile.from_payload(response.json())
