from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.models.models import WaitlistSignup
from src.api.models.schemas import (
    WaitlistCountResponse,
    WaitlistSignupCreate,
    WaitlistSignupResponse,
)

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.get("", response_model=WaitlistCountResponse)
async def get_waitlist_count(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(WaitlistSignup))
    count = result.scalar_one()
    return WaitlistCountResponse(count=count)


@router.post("", response_model=WaitlistSignupResponse)
async def create_waitlist_signup(
    payload: WaitlistSignupCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    BACKEND WAITLIST API (DEPRECATED/SECONDARY)
    Prefer app/api/newsletter/route.ts for web submissions to ensure Turnstile validation.
    """
    normalized_email = payload.email.lower().strip()
    normalized_source = (payload.source or "coming-soon").strip()[:120]

    existing = await db.execute(
        select(WaitlistSignup).where(WaitlistSignup.email == normalized_email)
    )
    signup = existing.scalar_one_or_none()

    if signup is not None:
        return WaitlistSignupResponse(
            message="You're already on the list!",
            duplicate=True,
        )

    signup = WaitlistSignup(
        email=normalized_email,
        source=normalized_source,
    )
    db.add(signup)
    await db.commit()

    return WaitlistSignupResponse(message="You're on the list!", duplicate=False)
