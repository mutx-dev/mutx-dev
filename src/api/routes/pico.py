from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.models.schemas import PicoStateResponse, PicoStateUpdateRequest
from src.api.services.pico_progress import get_pico_progress, upsert_pico_progress

router = APIRouter(prefix='/pico', tags=['pico'])


@router.get('/state', response_model=PicoStateResponse)
@router.get('/progress', response_model=PicoStateResponse)
async def pico_state(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {'state': await get_pico_progress(db, user=current_user)}


@router.put('/state', response_model=PicoStateResponse)
@router.post('/progress', response_model=PicoStateResponse)
async def pico_state_update(
    request: PicoStateUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        'state': await upsert_pico_progress(
            db,
            user=current_user,
            payload=request.patch if request.replace else request.patch,
            replace=request.replace,
        )
    }
