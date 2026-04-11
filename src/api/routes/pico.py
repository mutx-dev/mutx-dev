from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.pico_progress import get_pico_progress, upsert_pico_progress

router = APIRouter(prefix="/pico", tags=["pico"])


class PicoProgressPayload(BaseModel):
    model_config = ConfigDict(extra="allow")


@router.get("/progress", response_model=dict[str, Any])
async def pico_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_pico_progress(db, user=current_user)


@router.post("/progress", response_model=dict[str, Any])
async def pico_progress_update(
    payload: PicoProgressPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await upsert_pico_progress(
        db,
        user=current_user,
        payload=payload.model_dump(),
        replace=False,
    )
