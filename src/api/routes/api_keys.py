import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models.models import APIKey, User
from src.api.models.schemas import APIKeyCreate, APIKeyCreateResponse, APIKeyResponse
from src.api.services.user_service import hash_api_key

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


MAX_ACTIVE_API_KEYS_PER_USER = 10


def generate_api_key() -> str:
    """Generate a new API key with 'mutx_live_' prefix."""
    random_part = secrets.token_urlsafe(32)
    return f"mutx_live_{random_part}"


async def get_owned_api_key(
    db: AsyncSession, user_id: uuid.UUID, key_id: uuid.UUID
) -> APIKey | None:
    result = await db.execute(select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user_id))
    return result.scalar_one_or_none()


async def count_active_api_keys(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(select(APIKey).where(APIKey.user_id == user_id, APIKey.is_active))
    return len(result.scalars().all())


@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for the current user, including revoked keys for auditability."""
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key."""
    active_key_count = await count_active_api_keys(db, current_user.id)
    if active_key_count >= MAX_ACTIVE_API_KEYS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Active API key limit reached ({MAX_ACTIVE_API_KEYS_PER_USER})",
        )

    plain_key = generate_api_key()
    key_hash = hash_api_key(plain_key)

    expires_at = None
    if key_data.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=key_data.expires_in_days)

    api_key = APIKey(
        id=uuid.uuid4(),
        user_id=current_user.id,
        key_hash=key_hash,
        name=key_data.name,
        expires_at=expires_at,
        is_active=True,
    )

    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return APIKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key=plain_key,
        created_at=api_key.created_at,
        expires_at=api_key.expires_at,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an API key without deleting its record."""
    api_key = await get_owned_api_key(db, current_user.id, key_id)

    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    if not api_key.is_active:
        return None

    api_key.is_active = False
    await db.commit()

    return None


@router.post("/{key_id}/rotate", response_model=APIKeyCreateResponse)
async def rotate_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rotate an active API key by revoking the old one and issuing a new one."""
    old_key = await get_owned_api_key(db, current_user.id, key_id)

    if not old_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    if not old_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="API key is already revoked and cannot be rotated",
        )

    plain_key = generate_api_key()
    key_hash = hash_api_key(plain_key)

    old_key.is_active = False

    new_key = APIKey(
        id=uuid.uuid4(),
        user_id=current_user.id,
        key_hash=key_hash,
        name=old_key.name,
        expires_at=old_key.expires_at,
        is_active=True,
    )

    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return APIKeyCreateResponse(
        id=new_key.id,
        name=new_key.name,
        key=plain_key,
        created_at=new_key.created_at,
        expires_at=new_key.expires_at,
    )
