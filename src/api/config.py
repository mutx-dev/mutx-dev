from functools import lru_cache
from json import JSONDecodeError, loads
import secrets

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/mutx",
        validation_alias=AliasChoices("DATABASE_URL", "DB_URL"),
    )
    database_ssl_mode: str | None = Field(
        default=None,
        validation_alias=AliasChoices("DATABASE_SSL_MODE", "DB_SSL_MODE"),
    )
    api_host: str = "0.0.0.0"
    api_port: int = Field(
        default=8000,
        validation_alias=AliasChoices("API_PORT", "PORT"),
    )
    cors_origins: list[str] | str = [
        "http://localhost:3000",
        "http://app.localhost:3000",
        "https://mutx.dev",
        "https://app.mutx.dev",
    ]
    log_level: str = "INFO"
    json_logging: bool = Field(
        default=False,
        validation_alias=AliasChoices("JSON_LOGGING", "LOG_JSON"),
        description="Enable structured JSON logging output",
    )
    log_file: str | None = Field(
        default=None,
        validation_alias=AliasChoices("LOG_FILE", "LOG_PATH"),
        description="Optional file path for log output",
    )
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    refresh_token_max_sliding_days: int = 30  # Max days for sliding expiry
    # Email settings
    smtp_host: str = Field(default="smtp.gmail.com")
    smtp_port: int = Field(default=587)
    smtp_user: str = Field(default="")
    smtp_password: str = Field(default="")
    smtp_from_email: str = Field(default="noreply@mutx.dev")
    smtp_from_name: str = Field(default="MUTX")
    # Frontend URL for email links
    frontend_url: str = Field(default="http://localhost:3000")
    database_required_on_startup: bool = Field(
        default=False,
        validation_alias=AliasChoices(
            "DATABASE_REQUIRED_ON_STARTUP",
            "DB_REQUIRED_ON_STARTUP",
        ),
    )
    database_init_retry_interval_seconds: int = Field(
        default=5,
        ge=1,
        validation_alias=AliasChoices(
            "DATABASE_INIT_RETRY_INTERVAL_SECONDS",
            "DB_INIT_RETRY_INTERVAL_SECONDS",
        ),
    )
    database_connect_timeout_seconds: int = Field(
        default=10,
        ge=1,
        validation_alias=AliasChoices(
            "DATABASE_CONNECT_TIMEOUT_SECONDS",
            "DB_CONNECT_TIMEOUT_SECONDS",
        ),
    )
    # Rate limiting
    rate_limit_requests: int = Field(
        default=100,
        ge=1,
        description="Number of requests allowed per time window",
    )
    rate_limit_window_seconds: int = Field(
        default=60,
        ge=1,
        description="Time window in seconds for rate limiting",
    )

    internal_user_email_domains: list[str] = Field(
        default=["mutx.dev"],
        validation_alias=AliasChoices(
            "INTERNAL_USER_EMAIL_DOMAINS",
            "ADMIN_EMAIL_DOMAINS",
        ),
        description="Email domains allowed to access internal-only endpoints.",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        raw_value = value.strip()
        if not raw_value:
            return []

        if raw_value.startswith("["):
            try:
                parsed_value = loads(raw_value)
            except JSONDecodeError as exc:
                raise ValueError(
                    "CORS_ORIGINS must be a JSON array or comma-separated list"
                ) from exc
            if not isinstance(parsed_value, list):
                raise ValueError("CORS_ORIGINS JSON value must be an array")
            return [
                origin.strip()
                for origin in parsed_value
                if isinstance(origin, str) and origin.strip()
            ]

        return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
