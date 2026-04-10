from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.models.schemas import PicoEventRequest, PicoStateResponse
from src.api.services.pico_state import get_pico_state, record_pico_event

router = APIRouter(prefix="/pico", tags=["pico"])


@router.get("/state", response_model=PicoStateResponse)
async def pico_state(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_pico_state(db, user=current_user)


@router.post("/events", response_model=PicoStateResponse)
async def pico_event(
    request: PicoEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await record_pico_event(
        db,
        user=current_user,
        event=request.event,
        lesson_id=request.lesson_id,
        track_id=request.track_id,
        badge_id=request.badge_id,
        milestone_id=request.milestone_id,
        tutor_sessions=request.tutor_sessions,
        xp=request.xp,
        metadata=request.metadata,
    )
