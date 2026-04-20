"""Canonical SDK event ingestion endpoint at /v1/events.

SDK adapters (LangChain, CrewAI, AutoGen) POST to ``/v1/events``.
This module registers the route at the path the adapters already use,
delegating to the same ingestion logic that lives on the ingest router
at ``/v1/ingest/events``.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
import json
import logging

from src.api.database import get_db
from src.api.models import Agent, AgentLog, User
from src.api.models.schemas import IngestEvent
from src.api.middleware.auth import get_current_user_or_api_key
from src.api.time_utils import utc_now

router = APIRouter(tags=["events"])
logger = logging.getLogger(__name__)


async def _events_auth(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_db),
    *,
    request: Request,
) -> User:
    user = await get_current_user_or_api_key(
        request=request,
        authorization=authorization,
        x_api_key=x_api_key,
        session=session,
    )
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication. Provide valid JWT Bearer token or X-API-Key header.",
        )
    return user


@router.post("/events")
async def ingest_event(
    event_data: IngestEvent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_events_auth),
):
    """Accept structured events from SDK adapters (LangChain, CrewAI, AutoGen).

    When ``agent_id`` is provided the event is persisted as an ``AgentLog``
    for audit trail; otherwise it is accepted and logged without persistent
    storage.
    """
    resolved_agent_id = event_data.agent_id

    if resolved_agent_id is not None:
        result = await db.execute(select(Agent).where(Agent.id == resolved_agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        if agent.user_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Not authorized to ingest events for this agent"
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
