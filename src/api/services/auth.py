"""
SSO/RBAC Authentication Service.

Provides OAuth/OIDC token verification for multiple SSO providers and
JWT access token management with RBAC support.
"""

import httpx
from datetime import datetime, timedelta, timezone
from enum import Enum

from jose import jwt, JWTError
from pydantic import BaseModel

from src.api.config import get_settings

settings = get_settings()

ALGORITHM = "HS256"


class SSOProvider(str, Enum):
    """Supported SSO providers."""

    OKTA = "okta"
    AUTH0 = "auth0"
    KEYCLOAK = "keycloak"
    GOOGLE = "google"


class TokenPayload(BaseModel):
    """Token payload model for SSO and internal JWT tokens."""

    sub: str
    email: str
    roles: list[str]
    exp: datetime


# Provider OIDC configuration endpoints
PROVIDER_OIDC_CONFIG: dict[SSOProvider, str] = {
    SSOProvider.OKTA: "{domain}/.well-known/openid-configuration",
    SSOProvider.AUTH0: "{domain}/.well-known/openid-configuration",
    SSOProvider.KEYCLOAK: "{domain}/realms/{realm}/.well-known/openid-configuration",
    SSOProvider.GOOGLE: "https://accounts.google.com/.well-known/openid-configuration",
}

# Provider token verification endpoints (JWKS)
PROVIDER_JWKS_URLS: dict[SSOProvider, str] = {
    SSOProvider.OKTA: "{domain}/oauth2/v1/keys",
    SSOProvider.AUTH0: "{domain}/.well-known/jwks.json",
    SSOProvider.KEYCLOAK: "{domain}/realms/{realm}/protocol/openid-connect/certs",
    SSOProvider.GOOGLE: "https://www.googleapis.com/oauth2/v3/certs",
}

# Provider token introspection/userinfo endpoints
PROVIDER_USERINFO_URLS: dict[SSOProvider, str] = {
    SSOProvider.OKTA: "{domain}/oauth2/v1/userinfo",
    SSOProvider.AUTH0: "{domain}/userinfo",
    SSOProvider.KEYCLOAK: "{domain}/realms/{realm}/protocol/openid-connect/userinfo",
    SSOProvider.GOOGLE: "https://openidconnect.googleapis.com/v1/userinfo",
}


def _get_provider_config(provider: SSOProvider, domain: str, realm: str | None = None) -> dict:
    """Get OIDC configuration for a provider."""
    return {
        "issuer": domain,
        "userinfo_endpoint": PROVIDER_USERINFO_URLS[provider].format(
            domain=domain, realm=realm or ""
        ),
        "jwks_uri": PROVIDER_JWKS_URLS[provider].format(domain=domain, realm=realm or ""),
    }


async def verify_oauth_token(
    token: str,
    provider: SSOProvider,
    domain: str | None = None,
    realm: str | None = None,
) -> TokenPayload:
    """
    Verify an OAuth/OIDC token from an SSO provider.

    This function validates the token signature using the provider's JWKS
    and extracts the user information.

    Args:
        token: The OAuth/OIDC access token or ID token
        provider: The SSO provider enum
        domain: Provider domain (required for OKTA, AUTH0, KEYCLOAK)
        realm: Provider realm (required for KEYCLOAK)

    Returns:
        TokenPayload with user information

    Raises:
        HTTPException: If token verification fails
    """
    from fastapi import HTTPException, status

    # Build provider configuration
    if domain is None:
        # Use configured defaults based on provider
        domain = getattr(settings, f"{provider.value}_domain", None)
        if domain is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No domain configured for SSO provider: {provider.value}",
            )

    config = _get_provider_config(provider, domain, realm)
    jwks_uri = config["jwks_uri"]
    userinfo_uri = config["userinfo_endpoint"]

    # For ID tokens (JWTs), we can verify locally using JWKS
    # For access tokens, we may need to call userinfo endpoint

    try:
        # Try to fetch JWKS and verify as JWT
        async with httpx.AsyncClient(timeout=10.0) as client:
            jwks_response = await client.get(jwks_uri)
            jwks_response.raise_for_status()
            jwks_data = jwks_response.json()

        # Get the key from JWKS
        jwks_key = jwks_data.get("keys", [])
        if not jwks_key:
            # Fall back to userinfo endpoint for access token verification
            return await _verify_via_userinfo(token, userinfo_uri)

        # For Google, keys are in a different format
        # Google JWKS uses a different response structure

        # Decode and verify the JWT header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        rsa_key = None
        for key in jwks_key:
            if key.get("kid") == kid:
                rsa_key = key
                break

        if rsa_key is None:
            # Try to verify without kid match for keys that don't use kid
            if jwks_key:
                rsa_key = jwks_key[0]
            else:
                return await _verify_via_userinfo(token, userinfo_uri)

        # Verify and decode the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
            audience=None,  # May need to be set based on provider
            issuer=domain,
        )

        # Extract roles - these may be in different locations depending on provider
        roles = _extract_roles_from_payload(payload, provider)

        return TokenPayload(
            sub=payload.get("sub", ""),
            email=payload.get("email", payload.get("preferred_username", "")),
            roles=roles,
            exp=datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc),
        )

    except JWTError:
        # Token is not a JWT or verification failed, try userinfo endpoint
        return await _verify_via_userinfo(token, userinfo_uri)
    except httpx.HTTPError:
        # Network error, try userinfo endpoint as fallback
        return await _verify_via_userinfo(token, userinfo_uri)


async def _verify_via_userinfo(token: str, userinfo_uri: str) -> TokenPayload:
    """Verify token via userinfo endpoint and extract payload."""
    from fastapi import HTTPException, status

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                userinfo_uri,
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            userinfo = response.json()

        # Extract roles from userinfo if present
        roles = []
        if "roles" in userinfo:
            roles = userinfo["roles"]
        elif "groups" in userinfo:
            roles = userinfo["groups"]
        elif "custom:roles" in userinfo:
            roles = userinfo["custom:roles"]

        return TokenPayload(
            sub=userinfo.get("sub", userinfo.get("user_id", "")),
            email=userinfo.get("email", userinfo.get("preferred_username", "")),
            roles=roles,
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )


def _extract_roles_from_payload(payload: dict, provider: SSOProvider) -> list[str]:
    """Extract roles from token payload based on provider format."""
    roles = []

    # Common role locations across providers
    role_locations = [
        "roles",
        "groups",
        "custom:roles",
        "realm_access.roles",  # Keycloak
        "resource_access.roles",  # Keycloak
    ]

    for loc in role_locations:
        if "." in loc:
            # Handle nested fields like "realm_access.roles"
            parts = loc.split(".")
            value = payload
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part, [])
                else:
                    value = []
            if isinstance(value, list):
                roles.extend(value)
        elif loc in payload:
            value = payload[loc]
            if isinstance(value, list):
                roles.extend(value)
            elif isinstance(value, str):
                roles.append(value)

    # Provider-specific role extraction
    if provider == SSOProvider.GOOGLE:
        # Google uses custom claims for roles
        if "mutable-roles" in payload:
            roles.extend(payload["mutable-roles"])

    return list(set(roles))  # Deduplicate


def create_access_token(
    payload: TokenPayload,
    secret: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token (HS256) with the given payload.

    Args:
        payload: TokenPayload containing sub, email, roles, exp
        secret: JWT secret key for signing
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT string
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=24)

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode = {
        "sub": payload.sub,
        "email": payload.email,
        "roles": payload.roles,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str, secret: str) -> TokenPayload:
    """
    Verify and decode an access token.

    Args:
        token: JWT string to verify
        secret: JWT secret key for verification

    Returns:
        TokenPayload with decoded data

    Raises:
        HTTPException: If token is invalid or expired
    """
    from fastapi import HTTPException, status

    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])

        return TokenPayload(
            sub=payload.get("sub", ""),
            email=payload.get("email", ""),
            roles=payload.get("roles", []),
            exp=datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


class Role(str, Enum):
    """User roles for RBAC."""

    ADMIN = "ADMIN"  # Full access
    DEVELOPER = "DEVELOPER"  # Read/write agents, no billing
    VIEWER = "VIEWER"  # Read-only access
    AUDIT_ADMIN = "AUDIT_ADMIN"  # Audit logs only


def check_role(user_roles: list[str], required_roles: list[Role]) -> bool:
    """
    Check if user has any of the required roles.

    Args:
        user_roles: List of user's roles
        required_roles: List of roles that grant access

    Returns:
        True if user has at least one required role
    """
    user_roles_upper = [r.upper() for r in user_roles]
    required_roles_upper = [r.value.upper() for r in required_roles]

    # ADMIN has access to everything
    if Role.ADMIN.value.upper() in user_roles_upper:
        return True

    return any(role.upper() in required_roles_upper for role in user_roles_upper)
