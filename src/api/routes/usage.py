"""Usage event tracking API"""
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.models import UsageEvent, User
from src.api.models.schemas import UsageEventCreate, UsageEventResponse
from src.api.middleware.auth import get_current_user

router = APIRouter(prefix="/usage", tags=["usage"])
logger = logging.getLogger(__name__)


class UsageEventListResponse(BaseModel):
    """Paginated response for usage events"""
    items: list[UsageEventResponse]
    total: int
    skip: int
    limit: int


@router.post("/events", response_model=UsageEventResponse, status_code=201)
async def create_usage_event(
    event_data: UsageEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a usage event for tracking API usage and quotas."""
    usage_event = UsageEvent(
        event_type=event_data.event_type,
        user_id=current_user.id,
        resource_id=event_data.resource_id,
        event_metadata=(
            json.dumps(event_data.metadata) 
            if event_data.metadata 
            else None
        ),
        created_at=datetime.now(timezone.utc),
    )
    db.add(usage_event)
    await db.commit()
    await db.refresh(usage_event)
    logger.info(f"Created usage event: {usage_event.id} type={usage_event.event_type}")
    return usage_event


@router.get("/events", response_model=UsageEventListResponse)
async def list_usage_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List usage events for the authenticated user."""
    # Filter by current user's events
    query = select(UsageEvent).where(UsageEvent.user_id == current_user.id)
    
    if event_type:
        query = query.where(UsageEvent.event_type == event_type)
    if resource_id:
        query = query.where(UsageEvent.resource_id == resource_id)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Apply pagination
    query = query.order_by(UsageEvent.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    
    return UsageEventListResponse(
        items=events,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/events/{event_id}", response_model=UsageEventResponse)
async def get_usage_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific usage event."""
    query = select(UsageEvent).where(
        UsageEvent.id == event_id,
        UsageEvent.user_id == current_user.id
    )
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usage event not found")
    
    return event
