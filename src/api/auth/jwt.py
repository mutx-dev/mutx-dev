import secrets
from datetime import datetime, timedelta, UTC
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


def create_access_token(user_id: UUID) -> tuple[str, datetime]:
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)
    return encoded_jwt, expire


def create_refresh_token(user_id: UUID) -> tuple[str, datetime]:
    expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(UTC),
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


async def refresh_access_token(
    refresh_token: str, session: AsyncSession
) -> Optional[tuple[str, datetime, str]]:
    user_id = verify_refresh_token(refresh_token)
    if not user_id:
        return None

    user_service = UserService(session)
    user = await user_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        return None

    access_token, access_token_expires_at = create_access_token(user_id)
    new_refresh_token, _ = create_refresh_token(user_id)

    return access_token, access_token_expires_at, new_refresh_token
