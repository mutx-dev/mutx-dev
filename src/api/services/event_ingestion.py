"""Shared event ingestion logic for SDK adapter events.

Used by both ``/v1/events`` and ``/v1/ingest/events`` route handlers so
that the ingestion contract, ownership checks, and audit-log persistence
stay in one place.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, AgentLog, User
from src.api.models.schemas import IngestEvent

logger = logging.getLogger(__name__)


async def process_ingest_event(
    event_data: IngestEvent,
    current_user: User,
    db: AsyncSession,
) -> Dict[str, Any]:
    """Validate, authorize, and persist an SDK adapter event.

    Returns a JSON-serializable dict suitable as the route response.
    """
    resolved_agent_id = event_data.agent_id

    # If an agent_id is provided, verify ownership and persist as AgentLog
    if resolved_agent_id is not None:
        result = await db.execute(select(Agent).where(Agent.id == resolved_agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Agent not found")
        if agent.user_id != current_user.id:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=403,
                detail="Not authorized to ingest events for this agent",
            )

        log = AgentLog(
            agent_id=resolved_agent_id,
            level="info",
            message=f"Adapter event: {event_data.event_type}",
            extra_data=json.dumps(event_data.payload, default=str),
            meta_data={
                "event_type": event_data.event_type,
                "adapter_timestamp": event_data.timestamp,
                "agent_id": str(resolved_agent_id),
            },
        )
        db.add(log)
        await db.commit()

    logger.info(
        f"Ingested event type={event_data.event_type} user={current_user.id}"
        + (f" agent={resolved_agent_id}" if resolved_agent_id else " (no agent)")
    )
    return {"status": "accepted", "event_type": event_data.event_type}
