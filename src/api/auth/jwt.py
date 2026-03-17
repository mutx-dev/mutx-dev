import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.config import get_settings
from src.api.services.user_service import UserService

settings = get_settings()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days
REFRESH_TOKEN_MAX_SLIDING_DAYS = settings.refresh_token_max_sliding_days


def create_access_token(user_id: UUID) -> tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)
    return encoded_jwt, expire


def create_refresh_token(
    user_id: UUID,
    original_iat: Optional[datetime] = None,
) -> tuple[str, datetime]:
    """
    Create a refresh token with optional sliding expiry.

    If original_iat is provided, the token expiry will be calculated from that
    time instead of now, enabling sliding expiry up to REFRESH_TOKEN_MAX_SLIDING_DAYS.

    Args:
        user_id: The user's UUID
        original_iat: Original issue time for calculating sliding expiry

    Returns:
        Tuple of (encoded JWT, expiry datetime)
    """
    now = datetime.now(timezone.utc)

    if original_iat is not None:
        # Sliding expiry: calculate expiry from original issue time
        original_iat = (
            original_iat.replace(tzinfo=timezone.utc)
            if original_iat.tzinfo is None
            else original_iat
        )
        max_expire = original_iat + timedelta(days=REFRESH_TOKEN_MAX_SLIDING_DAYS)
        expire = min(now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), max_expire)
        iat = original_iat  # Keep original issue time for future sliding
    else:
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        iat = now

    to_encode = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
        "iat": iat,
        "nonce": secrets.token_hex(8),
    }
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)
    return encoded_jwt, expire


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[UUID]:
    payload = verify_token(token)
    if not payload:
        return None
    if payload.get("type") != "access":
        return None
    try:
        return UUID(payload.get("sub"))
    except (ValueError, TypeError):
        return None


def verify_refresh_token(token: str) -> Optional[UUID]:
    payload = verify_token(token)
    if not payload:
        return None
    if payload.get("type") != "refresh":
        return None
    try:
        return UUID(payload.get("sub"))
    except (ValueError, TypeError):
        return None


def get_refresh_token_iat(token: str) -> Optional[datetime]:
    """Extract the original issue time from a refresh token."""
    payload = verify_token(token)
    if not payload or payload.get("type") != "refresh":
        return None

    iat = payload.get("iat")
    if not iat:
        return None

    # Handle both string and numeric timestamps
    if isinstance(iat, str):
        # Parse ISO format string
        return datetime.fromisoformat(iat.replace("Z", "+00:00"))
    elif isinstance(iat, (int, float)):
        return datetime.fromtimestamp(iat, tz=timezone.utc)

    return None


async def refresh_access_token(
    refresh_token: str, session: AsyncSession
) -> Optional[tuple[str, datetime, str]]:
    """
    Refresh access token with sliding expiry.

    When a refresh token is used, the new refresh token will have its expiry
    calculated from the ORIGINAL issue time of the old token (sliding window),
    capped at REFRESH_TOKEN_MAX_SLIDING_DAYS.
    """
    user_id = verify_refresh_token(refresh_token)
    if not user_id:
        return None

    user_service = UserService(session)
    user = await user_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        return None

    # Get original issue time for sliding expiry
    original_iat = get_refresh_token_iat(refresh_token)

    access_token, access_token_expires_at = create_access_token(user_id)
    # Pass original_iat to implement sliding expiry
    new_refresh_token, _ = create_refresh_token(user_id, original_iat=original_iat)

    return access_token, access_token_expires_at, new_refresh_token
