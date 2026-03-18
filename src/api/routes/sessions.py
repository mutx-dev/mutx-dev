"""Sessions API routes."""

import logging
import re
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from src.api.middleware.auth import get_current_user
from src.api.models import User

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)

SESSION_KEY_RE = re.compile(r"^[a-zA-Z0-9:_.-]+$")
VALID_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"]
VALID_VERBOSE_LEVELS = ["off", "on", "full"]
VALID_REASONING_LEVELS = ["off", "on", "stream"]
LOCAL_SESSION_ACTIVE_WINDOW_MS = 90 * 60 * 1000  # 90 minutes


class SessionResponse(BaseModel):
    id: str
    key: str
    agent: str
    kind: str
    age: str
    model: str
    tokens: str
    channel: str
    flags: list[str]
    active: bool
    start_time: int
    last_activity: int
    source: str


class SessionListResponse(BaseModel):
    sessions: list[dict[str, Any]]


def format_tokens(n: int) -> str:
    """Format token count."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}m"
    if n >= 1000:
        return f"{round(n / 1000)}k"
    return str(n)


def format_age(timestamp: int) -> str:
    """Format session age from timestamp."""
    if not timestamp:
        return "-"
    diff = datetime.now().timestamp() * 1000 - timestamp
    if diff <= 0:
        return "now"
    mins = int(diff / 60000)
    hours = int(mins / 60)
    days = int(hours / 24)
    if days > 0:
        return f"{days}d"
    if hours > 0:
        return f"{hours}h"
    return f"{mins}m"


# Placeholder functions - integrate with actual implementations
def get_gateway_sessions() -> list[dict[str, Any]]:
    """Get sessions from OpenClaw gateway."""
    # TODO: Integrate with gateway
    return []


def get_local_claude_sessions() -> list[dict[str, Any]]:
    """Get local Claude Code sessions."""
    # TODO: Integrate with local session scanner
    return []


def get_local_codex_sessions() -> list[dict[str, Any]]:
    """Get local Codex CLI sessions."""
    # TODO: Integrate with local session scanner
    return []


def get_local_hermes_sessions() -> list[dict[str, Any]]:
    """Get local Hermes sessions."""
    # TODO: Integrate with local session scanner
    return []


def map_gateway_session(s: dict[str, Any]) -> dict[str, Any]:
    """Map gateway session to response format."""
    total = s.get("totalTokens", 0)
    context = s.get("contextTokens", 35000)
    pct = round((total / context) * 100) if context > 0 else 0

    return {
        "id": s.get("sessionId") or f"{s.get('agent')}:{s.get('key')}",
        "key": s.get("key"),
        "agent": s.get("agent"),
        "kind": s.get("chatType") or "unknown",
        "age": format_age(s.get("updatedAt", 0)),
        "model": s.get("model"),
        "tokens": f"{format_tokens(total)}/{format_tokens(context)} ({pct}%)",
        "channel": s.get("channel"),
        "flags": [],
        "active": s.get("active", False),
        "start_time": s.get("updatedAt", 0),
        "last_activity": s.get("updatedAt", 0),
        "source": "gateway",
    }


def merge_and_dedupe_sessions(
    gateway_sessions: list[dict],
    claude_sessions: list[dict],
    codex_sessions: list[dict],
    hermes_sessions: list[dict],
) -> list[dict[str, Any]]:
    """Merge and deduplicate sessions from multiple sources."""
    all_sessions = gateway_sessions + claude_sessions + codex_sessions + hermes_sessions

    # Dedupe by key
    seen: dict[str, dict] = {}
    for session in all_sessions:
        key = f"{session.get('source', 'unknown')}:{session.get('id', '')}"
        if not session.get("id"):
            continue
        existing = seen.get(key)
        current_activity = session.get("last_activity", 0)
        existing_activity = existing.get("last_activity", 0) if existing else 0
        if not existing or current_activity > existing_activity:
            seen[key] = session

    # Sort by last activity and limit
    sorted_sessions = sorted(
        seen.values(),
        key=lambda s: s.get("last_activity", 0),
        reverse=True,
    )
    return sorted_sessions[:100]


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    current_user: User = Depends(get_current_user),
) -> SessionListResponse:
    """List all sessions from gateway and local sources."""
    # Note: Using viewer role for GET - adjust as needed
    # if current_user.role not in ["viewer", "operator", "admin"]:
    #     raise HTTPException(status_code=403, detail="Viewer role required")

    try:
        # Get gateway sessions
        gateway_sessions = get_gateway_sessions()
        mapped_gateway = [map_gateway_session(s) for s in gateway_sessions]

        # Get local sessions
        claude_sessions = get_local_claude_sessions()
        codex_sessions = get_local_codex_sessions()
        hermes_sessions = get_local_hermes_sessions()

        # Merge all sessions
        merged = merge_and_dedupe_sessions(
            mapped_gateway, claude_sessions, codex_sessions, hermes_sessions
        )

        if not merged:
            return SessionListResponse(sessions=[])

        return SessionListResponse(sessions=merged)

    except Exception as e:
        logger.error({"err": e}, "Sessions API error")
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
) -> dict:
    """Perform action on a session (set-thinking, set-verbose, set-reasoning, set-label)."""
    # Check operator role
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Operator role required")

    if not request.session_key or not SESSION_KEY_RE.match(request.session_key):
        raise HTTPException(status_code=400, detail="Invalid session key")

    # Validate action
    valid_actions = ["set-thinking", "set-verbose", "set-reasoning", "set-label"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be: {', '.join(valid_actions)}",
        )

    # Validate level based on action
    if action == "set-thinking":
        if request.level not in VALID_THINKING_LEVELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid thinking level. Must be: {', '.join(VALID_THINKING_LEVELS)}",
            )
    elif action == "set-verbose":
        if request.level not in VALID_VERBOSE_LEVELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid verbose level. Must be: {', '.join(VALID_VERBOSE_LEVELS)}",
            )
    elif action == "set-reasoning":
        if request.level not in VALID_REASONING_LEVELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid reasoning level. Must be: {', '.join(VALID_REASONING_LEVELS)}",
            )
    elif action == "set-label":
        if request.label is None or len(request.label) > 100:
            raise HTTPException(
                status_code=400,
                detail="Label must be a string up to 100 characters",
            )

    # TODO: Call OpenClaw gateway RPC
    # result = await call_openclaw_gateway(rpc_method, rpc_params)

    return {
        "success": True,
        "action": action,
        "session_key": request.session_key,
        "result": {},
    }


@router.delete("")
async def delete_session(
    request: SessionActionRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a session."""
    # Check operator role
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Operator role required")

    if not request.session_key or not SESSION_KEY_RE.match(request.session_key):
        raise HTTPException(status_code=400, detail="Invalid session key")

    # TODO: Call OpenClaw gateway to delete session
    # result = await call_openclaw_gateway('session_delete', {'session_key': request.session_key})

    return {
        "success": True,
        "session_key": request.session_key,
        "result": {},
    }
