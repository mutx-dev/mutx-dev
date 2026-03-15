"""Usage tracking service for quota and billing."""
import json
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import UsageEvent


async def track_usage(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_type: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[uuid.UUID] = None,
    metadata: Optional[dict] = None,
    credits_used: float = 1.0,
) -> UsageEvent:
    """Track a usage event for quota and billing purposes."""
    event = UsageEvent(
        user_id=user_id,
        event_type=event_type,
        resource_type=resource_type,
        resource_id=resource_id,
        event_metadata=json.dumps(metadata) if metadata else None,
        credits_used=credits_used,
    )
    db.add(event)
    return event
