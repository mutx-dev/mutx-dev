from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from src.api.config import get_settings
from src.api.database import get_db
from src.api.models.models import Lead, User
from src.api.models.schemas import LeadCreate, LeadResponse
from src.api.middleware.auth import get_current_user

router = APIRouter(prefix="/leads", tags=["leads"])


def _assert_internal_user(current_user: User) -> None:
    """Restrict internal lead access to configured internal email domains."""
    if not current_user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    settings = get_settings()
    allowed_domains = {
        domain.strip().lower()
        for domain in settings.internal_user_email_domains
        if domain and domain.strip()
    }

    user_domain = current_user.email.rsplit("@", 1)[-1].lower() if "@" in current_user.email else ""
    if user_domain not in allowed_domains:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def capture_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Capture a new contact lead.
    Public endpoint for landing pages and onboarding.
    """
    lead = Lead(
        email=payload.email.lower().strip(),
        name=payload.name.strip() if payload.name else None,
        company=payload.company.strip() if payload.company else None,
        message=payload.message.strip() if payload.message else None,
        source=payload.source.strip() if payload.source else "direct",
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("", response_model=List[LeadResponse])
async def list_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List captured leads.
    Restricted to internal/admin users.
    """
    _assert_internal_user(current_user)
    result = await db.execute(
        select(Lead).order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    )
    leads = result.scalars().all()
    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific lead by ID."""
    _assert_internal_user(current_user)
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead
