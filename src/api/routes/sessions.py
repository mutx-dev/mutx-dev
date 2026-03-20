"""Sessions API routes."""

from __future__ import annotations

import logging
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.ownership import get_owned_agent
from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.assistant_control_plane import collect_assistant_overview, list_gateway_sessions

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)

VALID_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"]
VALID_VERBOSE_LEVELS = ["off", "on", "full"]
VALID_REASONING_LEVELS = ["off", "on", "stream"]


class SessionListResponse(BaseModel):
    sessions: list[dict[str, Any]]


def get_local_claude_sessions() -> list[dict[str, Any]]:
    return []


def get_local_codex_sessions() -> list[dict[str, Any]]:
    return []


def get_local_hermes_sessions() -> list[dict[str, Any]]:
    return []


def merge_and_dedupe_sessions(
    gateway_sessions: list[dict[str, Any]],
    claude_sessions: list[dict[str, Any]],
    codex_sessions: list[dict[str, Any]],
    hermes_sessions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    all_sessions = gateway_sessions + claude_sessions + codex_sessions + hermes_sessions

    seen: dict[str, dict[str, Any]] = {}
    for session in all_sessions:
        key = f"{session.get('source', 'unknown')}:{session.get('id', '')}"
        if not session.get("id"):
            continue
        existing = seen.get(key)
        current_activity = session.get("last_activity", 0)
        existing_activity = existing.get("last_activity", 0) if existing else 0
        if not existing or current_activity > existing_activity:
            seen[key] = session

    return sorted(seen.values(), key=lambda session: session.get("last_activity", 0), reverse=True)[:100]


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    agent_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionListResponse:
    """List assistant sessions discovered from OpenClaw state plus local sources."""
    try:
        assistant_id = None
        if agent_id is not None:
            agent = await get_owned_agent(agent_id, db, current_user)
            await db.refresh(agent, attribute_names=["deployments"])
            overview = collect_assistant_overview(agent, list(agent.deployments))
            assistant_id = overview["assistant_id"]

        gateway_sessions = list_gateway_sessions(assistant_id=assistant_id)
        merged = merge_and_dedupe_sessions(
            gateway_sessions,
            get_local_claude_sessions(),
            get_local_codex_sessions(),
            get_local_hermes_sessions(),
        )
        return SessionListResponse(sessions=merged)
    except Exception as exc:
        logger.exception("Sessions API error: %s", exc)
        return SessionListResponse(sessions=[])


class SessionActionRequest(BaseModel):
    session_key: str
    level: Optional[str] = None
    label: Optional[str] = None


@router.post("")
async def session_action(
    request: SessionActionRequest,
    action: str = Query(...),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Validate session action input, but do not mutate gateway state yet."""
    valid_actions = ["set-thinking", "set-verbose", "set-reasoning", "set-label"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be: {', '.join(valid_actions)}",
        )

    if action == "set-thinking" and request.level not in VALID_THINKING_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid thinking level. Must be: {', '.join(VALID_THINKING_LEVELS)}",
        )
    if action == "set-verbose" and request.level not in VALID_VERBOSE_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verbose level. Must be: {', '.join(VALID_VERBOSE_LEVELS)}",
        )
    if action == "set-reasoning" and request.level not in VALID_REASONING_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reasoning level. Must be: {', '.join(VALID_REASONING_LEVELS)}",
        )
    if action == "set-label" and (request.label is None or len(request.label) > 100):
        raise HTTPException(
            status_code=400,
            detail="Label must be a string up to 100 characters",
        )

    raise HTTPException(
        status_code=501,
        detail="Session mutation endpoints are not wired to the OpenClaw gateway yet",
    )


@router.delete("")
async def delete_session(
    request: SessionActionRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    raise HTTPException(
        status_code=501,
        detail="Session deletion is not wired to the OpenClaw gateway yet",
    )
