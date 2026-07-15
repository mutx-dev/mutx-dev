"""Internal JWT creation and role-based access control helpers.

OIDC validation lives in :mod:`src.api.auth.oidc`. Its public types are
re-exported here to preserve compatibility for existing SDK and route imports.
"""

from datetime import datetime, timedelta, timezone
from enum import Enum

from jose import JWTError, jwt

from src.api.auth import oidc

PROVIDER_JWKS_URLS = oidc.PROVIDER_JWKS_URLS
PROVIDER_OIDC_CONFIG = oidc.PROVIDER_OIDC_CONFIG
PROVIDER_USERINFO_URLS = oidc.PROVIDER_USERINFO_URLS
SSOProvider = oidc.SSOProvider
TokenPayload = oidc.TokenPayload
verify_oauth_token = oidc.verify_oauth_token

ALGORITHM = "HS256"


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
