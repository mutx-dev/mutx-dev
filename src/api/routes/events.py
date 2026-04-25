"""Canonical SDK event ingestion endpoint at /v1/events.

SDK adapters (LangChain, CrewAI, AutoGen) POST to ``/v1/events``.
This module registers the route at the path the adapters already use,
delegating to the shared ingestion service.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from src.api.database import get_db
from src.api.models import User
from src.api.models.schemas import IngestEvent
from src.api.middleware.auth import get_current_user_or_api_key
from src.api.services.event_ingestion import process_ingest_event

router = APIRouter(tags=["events"])
logger = logging.getLogger(__name__)


@router.post("/events")
async def ingest_event(
    event_data: IngestEvent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_or_api_key),
):
    """Accept structured events from SDK adapters (LangChain, CrewAI, AutoGen)."""
    return await process_ingest_event(event_data, current_user, db)
