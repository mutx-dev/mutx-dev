import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import assert_internal_user, get_current_user
from src.api.models.models import Lead, User
from src.api.models.schemas import LeadCreate, LeadListResponse, LeadResponse, LeadUpdate

router = APIRouter(prefix="/leads", tags=["leads"])
contacts_router = APIRouter(prefix="/contacts", tags=["contacts"])


def _assert_internal_user(current_user: User) -> None:
    """Restrict internal lead access to configured internal email domains."""
    assert_internal_user(current_user)


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
@contacts_router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def capture_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Capture a new contact lead.
    Public endpoint for landing pages and onboarding.
    Writes to the DB then fires async notifications (Discord, Resend).
    """
    lead = Lead(
        email=payload.email.lower().strip(),
        name=_normalize_optional_text(payload.name),
        company=_normalize_optional_text(payload.company),
        message=_normalize_optional_text(payload.message),
        source=_normalize_optional_text(payload.source) or "direct",
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    # Fire notifications asynchronously — best-effort, never blocks response
    from src.api.services.leads_service import notify_new_lead

    asyncio.create_task(
        notify_new_lead(
            email=lead.email,
            source=lead.source,
            name=lead.name,
            company=lead.company,
            message=lead.message,
        )
    )

    return lead


@router.get("", response_model=LeadListResponse)
@contacts_router.get("", response_model=LeadListResponse)
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

    base_query = select(Lead)
    count_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(base_query.order_by(Lead.created_at.desc()).offset(skip).limit(limit))
    leads = result.scalars().all()

    return LeadListResponse(
        items=leads,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + len(leads)) < total,
    )


@router.get("/{lead_id}", response_model=LeadResponse)
@contacts_router.get("/{lead_id}", response_model=LeadResponse)
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


@router.patch("/{lead_id}", response_model=LeadResponse)
@contacts_router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a specific lead/contact."""
    _assert_internal_user(current_user)

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if "email" in updates and updates["email"] is not None:
        lead.email = updates["email"].lower().strip()
    if "name" in updates:
        lead.name = _normalize_optional_text(updates["name"])
    if "company" in updates:
        lead.company = _normalize_optional_text(updates["company"])
    if "message" in updates:
        lead.message = _normalize_optional_text(updates["message"])
    if "source" in updates:
        lead.source = _normalize_optional_text(updates["source"])

    await db.commit()
    await db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
@contacts_router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific lead/contact."""
    _assert_internal_user(current_user)

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    await db.commit()
    return None
