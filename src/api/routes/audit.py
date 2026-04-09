"""
Audit Log Routes.

Provides REST API endpoints for querying audit events and traces.
All routes require authentication.
"""

import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict

from src.api.dependencies import get_current_user, require_role, SSOTokenUser
from src.api.services.audit_log import (
    AuditEvent,
    AuditEventType,
    AuditQuery,
    get_audit_log,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/audit",
    tags=["audit"],
    dependencies=[Depends(require_role(["ADMIN", "AUDIT_ADMIN"]))],
)


class AuditEventResponse(BaseModel):
    """Response model for an audit event."""

    model_config = ConfigDict(from_attributes=True)

    event_id: str
    agent_id: str
    session_id: str
    span_id: str | None = None
    event_type: str
    payload: dict
    timestamp: datetime
    trace_id: str | None = None

    @classmethod
    def from_audit_event(cls, event: AuditEvent) -> "AuditEventResponse":
        """Create response from AuditEvent model."""
        return cls(
            event_id=str(event.event_id),
            agent_id=event.agent_id,
            session_id=event.session_id,
            span_id=event.span_id,
            event_type=event.event_type.value,
            payload=event.payload,
            timestamp=event.timestamp,
            trace_id=event.trace_id,
        )


class AuditEventsResponse(BaseModel):
    """Response model for a list of audit events."""

    events: list[AuditEventResponse]
    total: int | None = None


@router.get("/events", response_model=AuditEventsResponse)
async def query_audit_events(
    current_user: Annotated[SSOTokenUser, Depends(get_current_user)],
    agent_id: Annotated[str | None, Query(description="Filter by agent ID")] = None,
    session_id: Annotated[str | None, Query(description="Filter by session ID")] = None,
    time_range_start: Annotated[
        datetime | None,
        Query(
            description="Filter events after this timestamp (ISO 8601 format)",
        ),
    ] = None,
    time_range_end: Annotated[
        datetime | None,
        Query(
            description="Filter events before this timestamp (ISO 8601 format)",
        ),
    ] = None,
    event_type: Annotated[
        AuditEventType | None,
        Query(description="Filter by event type"),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=1000, description="Maximum events to return")] = 100,
    skip: Annotated[int, Query(ge=0, description="Number of events to skip")] = 0,
) -> AuditEventsResponse:
    """Query audit events with filters.

    Requires authentication. Results are ordered by timestamp descending.

    Args:
        current_user: The authenticated user.
        agent_id: Optional agent ID filter.
        session_id: Optional session ID filter.
        time_range_start: Optional start time filter.
        time_range_end: Optional end time filter.
        event_type: Optional event type filter.
        limit: Maximum number of events to return (1-1000, default 100).
        skip: Number of events to skip for pagination.

    Returns:
        AuditEventsResponse containing list of matching events.
    """
    filters = AuditQuery(
        agent_id=agent_id,
        session_id=session_id,
        time_range_start=time_range_start,
        time_range_end=time_range_end,
        event_type=event_type,
        limit=limit,
        skip=skip,
    )

    try:
        audit_log = await get_audit_log()
        events = await audit_log.query(filters)
        event_responses = [AuditEventResponse.from_audit_event(e) for e in events]
        return AuditEventsResponse(events=event_responses)
    except Exception as e:
        logger.exception("Failed to query audit events")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query audit events: {str(e)}",
        )


@router.get("/traces/{trace_id}", response_model=AuditEventsResponse)
async def get_trace_events(
    trace_id: str,
    current_user: Annotated[SSOTokenUser, Depends(get_current_user)],
) -> AuditEventsResponse:
    """Get all events for a specific trace.

    Requires authentication. Results are ordered by timestamp ascending.

    Args:
        trace_id: The trace ID to look up.
        current_user: The authenticated user.

    Returns:
        AuditEventsResponse containing all events for the trace.
    """
    try:
        audit_log = await get_audit_log()
        events = await audit_log.get_trace(trace_id)
        event_responses = [AuditEventResponse.from_audit_event(e) for e in events]
        return AuditEventsResponse(events=event_responses)
    except Exception as e:
        logger.exception("Failed to get trace events")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trace events: {str(e)}",
        )
