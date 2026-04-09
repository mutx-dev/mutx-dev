"""
OIDC Token Validation Helper.

Provides JWKS fetching and JWT token validation for external OIDC
Identity Providers.  Configure via environment variables:

  OIDC_ISSUER     – Expected ``iss`` claim (e.g. https://accounts.google.com)
  OIDC_CLIENT_ID  – Expected ``aud`` claim
  OIDC_JWKS_URI   – Full JWKS endpoint URL (optional; derived from issuer
                     when using a provider that exposes discovery)
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
from jose import JWTError, jwt

# ---------------------------------------------------------------------------
# Configuration (read once at import; can be refreshed via get_oidc_settings)
# ---------------------------------------------------------------------------


class OIDCSettings:
    """Lightweight container for OIDC configuration values."""

    __slots__ = ("issuer", "client_id", "jwks_uri")

    def __init__(self, issuer: str, client_id: str, jwks_uri: str) -> None:
        self.issuer = issuer
        self.client_id = client_id
        self.jwks_uri = jwks_uri

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"OIDCSettings(issuer={self.issuer!r}, "
            f"client_id={self.client_id!r}, "
            f"jwks_uri={self.jwks_uri!r})"
        )


def get_oidc_settings() -> OIDCSettings | None:
    """Return an OIDCSettings instance from environment variables.

    Returns ``None`` if ``OIDC_ISSUER`` is not set (OIDC validation
    is effectively disabled).
    """
    issuer = os.environ.get("OIDC_ISSUER", "")
    client_id = os.environ.get("OIDC_CLIENT_ID", "")
    jwks_uri = os.environ.get("OIDC_JWKS_URI", "")

    if not issuer:
        return None

    # Derive JWKS URI from issuer when not explicitly set
    if not jwks_uri:
        jwks_uri = f"{issuer.rstrip('/')}/.well-known/jwks.json"

    return OIDCSettings(issuer=issuer, client_id=client_id, jwks_uri=jwks_uri)


# ---------------------------------------------------------------------------
# JWKS Fetcher with simple in-memory cache
# ---------------------------------------------------------------------------

_JWKS_CACHE: dict[str, Any] = {}
_JWKS_CACHE_EXPIRY: float = 0.0
_JWKS_CACHE_TTL: int = 3600  # 1 hour


async def fetch_jwks(jwks_uri: str) -> dict[str, Any]:
    """Fetch the JWKS document from the given URI with caching.

    Args:
        jwks_uri: URL of the JWKS endpoint.

    Returns:
        Parsed JWKS JSON document.

    Raises:
        httpx.HTTPError: On network failures.
    """
    global _JWKS_CACHE, _JWKS_CACHE_EXPIRY

    now = time.monotonic()
    if _JWKS_CACHE and now < _JWKS_CACHE_EXPIRY:
        return _JWKS_CACHE

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_uri)
        response.raise_for_status()
        data = response.json()

    _JWKS_CACHE = data
    _JWKS_CACHE_EXPIRY = now + _JWKS_CACHE_TTL
    return data


def _find_key_by_kid(jwks: dict[str, Any], kid: str | None) -> dict[str, Any] | None:
    """Find the matching JWK by key ID (``kid``)."""
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


# ---------------------------------------------------------------------------
# Token Validation
# ---------------------------------------------------------------------------


class OIDCTokenValidationError(Exception):
    """Raised when OIDC token validation fails."""


async def validate_oidc_token(
    token: str,
    *,
    settings: OIDCSettings | None = None,
) -> dict[str, Any]:
    """Validate an OIDC JWT against the configured provider's JWKS.

    This verifies:
    - Token signature (via JWKS)
    - ``iss`` claim matches ``OIDC_ISSUER``
    - ``aud`` claim matches ``OIDC_CLIENT_ID`` (when configured)
    - Token has not expired (``exp`` claim)

    Args:
        token: Raw JWT string.
        settings: Optional pre-built settings.  When ``None``, reads from
                  environment via :func:`get_oidc_settings`.

    Returns:
        Decoded token payload as a dictionary.

    Raises:
        OIDCTokenValidationError: On any validation failure.
    """
    if settings is None:
        settings = get_oidc_settings()
    if settings is None:
        raise OIDCTokenValidationError(
            "OIDC validation is not configured (OIDC_ISSUER not set)"
        )

    # Decode header without verification to extract kid
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise OIDCTokenValidationError(f"Malformed token header: {exc}") from exc

    kid = unverified_header.get("kid")

    # Fetch JWKS and find the signing key
    try:
        jwks = await fetch_jwks(settings.jwks_uri)
    except httpx.HTTPError as exc:
        raise OIDCTokenValidationError(
            f"Failed to fetch JWKS from {settings.jwks_uri}: {exc}"
        ) from exc

    signing_key = _find_key_by_kid(jwks, kid)
    if signing_key is None:
        raise OIDCTokenValidationError(
            f"No matching key found for kid={kid!r} in JWKS"
        )

    # Verify and decode the token
    decode_kwargs: dict[str, Any] = {
        "algorithms": ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
        "issuer": settings.issuer,
    }
    if settings.client_id:
        decode_kwargs["audience"] = settings.client_id

    try:
        payload = jwt.decode(token, signing_key, **decode_kwargs)
    except jwt.ExpiredSignatureError as exc:
        raise OIDCTokenValidationError("Token has expired") from exc
    except JWTError as exc:
        raise OIDCTokenValidationError(f"Token validation failed: {exc}") from exc

    return payload


def clear_jwks_cache() -> None:
    """Clear the in-memory JWKS cache (useful for testing)."""
    global _JWKS_CACHE, _JWKS_CACHE_EXPIRY
    _JWKS_CACHE = {}
    _JWKS_CACHE_EXPIRY = 0.0
