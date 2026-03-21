from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.models.schemas import RuntimeProviderSnapshotResponse, RuntimeProviderSnapshotUpsert
from src.api.services.operator_state import (
    get_runtime_provider_snapshot,
    upsert_runtime_provider_snapshot,
)

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.get("/providers/{provider}", response_model=RuntimeProviderSnapshotResponse)
async def runtime_provider_state(
    provider: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_runtime_provider_snapshot(db, user=current_user, provider=provider)


@router.put("/providers/{provider}", response_model=RuntimeProviderSnapshotResponse)
async def upsert_runtime_provider_state(
    provider: str,
    request: RuntimeProviderSnapshotUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = request.model_dump(mode="json", exclude_none=True)
    payload["provider"] = provider
    return await upsert_runtime_provider_snapshot(
        db,
        user=current_user,
        provider=provider,
        payload=payload,
    )

