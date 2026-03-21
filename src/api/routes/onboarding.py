from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.models.schemas import OnboardingStateResponse, OnboardingUpdateRequest
from src.api.services.operator_state import get_onboarding_state, update_onboarding_state

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("", response_model=OnboardingStateResponse)
async def onboarding_state(
    provider: str = "openclaw",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_onboarding_state(db, user=current_user, provider=provider)


@router.post("", response_model=OnboardingStateResponse)
async def onboarding_update(
    request: OnboardingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await update_onboarding_state(
            db,
            user=current_user,
            action=request.action,
            provider=request.provider,
            step=request.step,
            payload=request.payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

