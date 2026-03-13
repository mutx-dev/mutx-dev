from functools import wraps
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.jwt import verify_access_token
from src.api.database import get_db
from src.api.models.models import User
from src.api.services.user_service import UserService


async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    user_id = verify_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_service = UserService(session)
    user = await user_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    user_id = verify_access_token(token)
    if not user_id:
        return None

    user_service = UserService(session)
    user = await user_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        return None

    return user


async def get_api_key_user(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Authenticate using any active user-owned API key."""
    if not x_api_key:
        return None

    user_service = UserService(session)
    return await user_service.get_user_for_api_key(x_api_key)


async def get_user_from_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Authenticate using any active user-owned API key."""
    if not x_api_key:
        return None

    user_service = UserService(session)
    return await user_service.get_user_for_api_key(x_api_key)


async def get_current_user_or_api_key(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate using either JWT Bearer token or API key."""
    # Try JWT first
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            user_id = verify_access_token(token)
            if user_id:
                user_service = UserService(session)
                user = await user_service.get_user_by_id(user_id)
                if user and user.is_active:
                    return user

    # Try API key
    if x_api_key:
        user_service = UserService(session)
        user = await user_service.get_user_for_api_key(x_api_key)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_agent(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
):
    """Authenticate an agent using its API key in the Authorization header."""
    from sqlalchemy import select
    from src.api.models.models import Agent

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    # In a real app, we'd hash the token or use a faster lookup
    # For now, we match the logic used in the existing verify_agent_api_key
    result = await session.execute(select(Agent).where(Agent.api_key == token))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return agent


async def get_authenticated_user(
    user: User = Depends(get_current_user),
) -> User:
    return user


def require_auth(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await func(*args, **kwargs)

    return wrapper
