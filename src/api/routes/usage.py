"""Usage tracking routes for quota and billing."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.database import get_db
from src.api.models import User, UsageEvent
from src.api.models.schemas import UsageEventCreate, UsageEventResponse
from src.api.routes.auth import get_current_user

router = APIRouter(prefix="/usage", tags=["usage"])


@router.post("/events", response_model=UsageEventResponse, status_code=201)
async def create_usage_event(
    event_data: UsageEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Track a usage event for quota and billing purposes."""
    import json

    event = UsageEvent(
        user_id=current_user.id,
        event_type=event_data.event_type,
        resource_type=event_data.resource_type,
        resource_id=event_data.resource_id,
        event_metadata=json.dumps(event_data.event_metadata) if event_data.event_metadata else None,
        credits_used=event_data.credits_used,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/events", response_model=list[UsageEventResponse])
async def list_usage_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List usage events for the authenticated user."""
    query = select(UsageEvent).where(UsageEvent.user_id == current_user.id)

    if event_type:
        query = query.where(UsageEvent.event_type == event_type)

    query = query.order_by(UsageEvent.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    return events
