import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.config import get_settings
from src.api.models.models import RefreshTokenSession
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
    *,
    family_id: Optional[str] = None,
    token_jti: Optional[str] = None,
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

    resolved_family_id = family_id or secrets.token_hex(16)
    resolved_token_jti = token_jti or secrets.token_hex(16)
    to_encode = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
        "iat": iat,
        "nonce": secrets.token_hex(8),
        "family_id": resolved_family_id,
        "jti": resolved_token_jti,
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


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def get_refresh_token_claims(token: str) -> Optional[dict]:
    payload = verify_token(token)
    if not payload or payload.get("type") != "refresh":
        return None

    try:
        payload["user_id"] = UUID(payload.get("sub"))
    except (ValueError, TypeError):
        return None

    return payload


async def issue_refresh_token(
    session: AsyncSession,
    user_id: UUID,
    *,
    original_iat: Optional[datetime] = None,
    family_id: Optional[str] = None,
) -> tuple[str, datetime, RefreshTokenSession]:
    resolved_family_id = family_id or secrets.token_hex(16)
    token_jti = secrets.token_hex(16)
    refresh_token, expires_at = create_refresh_token(
        user_id,
        original_iat=original_iat,
        family_id=resolved_family_id,
        token_jti=token_jti,
    )
    token_session = RefreshTokenSession(
        user_id=user_id,
        token_jti=token_jti,
        family_id=resolved_family_id,
        expires_at=expires_at,
    )
    session.add(token_session)
    await session.flush()
    return refresh_token, expires_at, token_session


async def issue_token_pair(
    session: AsyncSession,
    user_id: UUID,
    *,
    refresh_original_iat: Optional[datetime] = None,
    refresh_family_id: Optional[str] = None,
) -> tuple[str, datetime, str]:
    access_token, access_token_expires_at = create_access_token(user_id)
    refresh_token, _, _ = await issue_refresh_token(
        session,
        user_id,
        original_iat=refresh_original_iat,
        family_id=refresh_family_id,
    )
    return access_token, access_token_expires_at, refresh_token


async def revoke_refresh_token_family(
    session: AsyncSession,
    family_id: str,
    *,
    user_id: Optional[UUID] = None,
) -> None:
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(RefreshTokenSession).where(RefreshTokenSession.family_id == family_id)
    )
    token_sessions = result.scalars().all()

    for token_session in token_sessions:
        if user_id is not None and token_session.user_id != user_id:
            continue
        if token_session.revoked_at is None:
            token_session.revoked_at = now

    await session.commit()


async def revoke_refresh_token(
    session: AsyncSession,
    refresh_token: str,
    *,
    user_id: Optional[UUID] = None,
) -> bool:
    claims = get_refresh_token_claims(refresh_token)
    if not claims:
        return False

    token_user_id = claims["user_id"]
    if user_id is not None and token_user_id != user_id:
        return False

    family_id = claims.get("family_id")
    if family_id:
        await revoke_refresh_token_family(session, family_id, user_id=token_user_id)
        return True

    user_service = UserService(session)
    await user_service.revoke_all_refresh_tokens(token_user_id)
    return True


async def refresh_access_token(
    refresh_token: str, session: AsyncSession
) -> Optional[tuple[str, datetime, str]]:
    """
    Refresh access token with sliding expiry.

    When a refresh token is used, the new refresh token will have its expiry
    calculated from the ORIGINAL issue time of the old token (sliding window),
    capped at REFRESH_TOKEN_MAX_SLIDING_DAYS.
    """
    claims = get_refresh_token_claims(refresh_token)
    if not claims:
        return None
    user_id = claims["user_id"]

    user_service = UserService(session)
    user = await user_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        return None

    original_iat = get_refresh_token_iat(refresh_token)
    token_jti = claims.get("jti")
    family_id = claims.get("family_id")

    if not token_jti or not family_id:
        access_token, access_token_expires_at, new_refresh_token = await issue_token_pair(
            session,
            user_id,
            refresh_original_iat=original_iat,
        )
        await session.commit()
        return access_token, access_token_expires_at, new_refresh_token

    result = await session.execute(
        select(RefreshTokenSession).where(RefreshTokenSession.token_jti == token_jti)
    )
    current_session = result.scalar_one_or_none()
    if not current_session:
        return None

    if current_session.user_id != user_id or current_session.family_id != family_id:
        return None

    now = datetime.now(timezone.utc)
    if _as_utc(current_session.expires_at) < now:
        current_session.revoked_at = current_session.revoked_at or now
        await session.commit()
        return None

    if current_session.revoked_at is not None:
        await revoke_refresh_token_family(session, current_session.family_id, user_id=user_id)
        return None

    access_token, access_token_expires_at, new_refresh_token = await issue_token_pair(
        session,
        user_id,
        refresh_original_iat=original_iat,
        refresh_family_id=current_session.family_id,
    )
    result = await session.execute(
        select(RefreshTokenSession)
        .where(
            RefreshTokenSession.user_id == user_id,
            RefreshTokenSession.family_id == current_session.family_id,
            RefreshTokenSession.revoked_at.is_(None),
            RefreshTokenSession.token_jti != current_session.token_jti,
        )
        .order_by(RefreshTokenSession.created_at.desc())
    )
    replacement_session = result.scalars().first()
    current_session.last_used_at = now
    current_session.revoked_at = now
    current_session.replaced_by_token_jti = (
        replacement_session.token_jti if replacement_session is not None else None
    )
    await session.commit()

    return access_token, access_token_expires_at, new_refresh_token
