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
from src.api.services.assistant_control_plane import (
    collect_assistant_overview,
    list_gateway_sessions,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)

VALID_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"]
VALID_VERBOSE_LEVELS = ["off", "on", "full"]
VALID_REASONING_LEVELS = ["off", "on", "stream"]

DEFAULT_GATEWAY_HOST = "127.0.0.1"
DEFAULT_GATEWAY_PORT = 18789


# --- Gateway client ---


async def _call_gateway(
    method: str,
    path: str,
    json: Optional[dict[str, Any]] = None,
    params: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Make an HTTP request to the local OpenClaw gateway.

    Returns parsed JSON response.
    Raises HTTPException on gateway errors or connection failure.
    """
    import os
    import aiohttp

    host = os.environ.get("OPENCLAW_GATEWAY_HOST", DEFAULT_GATEWAY_HOST)
    port = int(os.environ.get("OPENCLAW_GATEWAY_PORT", str(DEFAULT_GATEWAY_PORT)))
    base_url = f"http://{host}:{port}"

    try:
        async with aiohttp.ClientSession() as session:
            kwargs: dict[str, Any] = {"timeout": aiohttp.ClientTimeout(total=10)}
            if json is not None:
                kwargs["json"] = json
            if params is not None:
                kwargs["params"] = params

            async with session.request(method, f"{base_url}{path}", **kwargs) as resp:
                if resp.status == 404:
                    raise HTTPException(status_code=404, detail="Session not found on gateway")
                if resp.status >= 500:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gateway error: {resp.status}",
                    )
                if resp.content_type and "application/json" in resp.content_type:
                    return await resp.json()
                return {"status": resp.status}
    except aiohttp.ClientConnectorError:
        raise HTTPException(
            status_code=503,
            detail="OpenClaw gateway is not reachable. Ensure the gateway is running on the operator host.",
        )
    except aiohttp.ClientError as exc:
        raise HTTPException(status_code=502, detail=f"Gateway request failed: {exc}") from exc


# --- Local session stubs (Claude/Codex/Hermes — require external tooling) ---


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

    return sorted(seen.values(), key=lambda session: session.get("last_activity", 0), reverse=True)[
        :100
    ]


# --- Schemas ---


class SessionActionRequest(BaseModel):
    session_key: str
    level: Optional[str] = None
    label: Optional[str] = None


class SessionActionResponse(BaseModel):
    session_key: str
    action: str
    applied: bool
    detail: Optional[str] = None


# --- Routes ---


class SessionListResponse(BaseModel):
    sessions: list[dict[str, Any]]


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


@router.post("", response_model=SessionActionResponse)
async def session_action(
    request: SessionActionRequest,
    action: str = Query(...),
    current_user: User = Depends(get_current_user),
) -> SessionActionResponse:
    """Apply a session action (set-thinking, set-verbose, set-reasoning, set-label).

    Validates input, then forwards the action to the OpenClaw gateway.
    """
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

    # Map action to gateway endpoint
    gateway_path_map = {
        "set-thinking": "/api/sessions/thinking",
        "set-verbose": "/api/sessions/verbose",
        "set-reasoning": "/api/sessions/reasoning",
        "set-label": "/api/sessions/label",
    }

    # Forge payload for gateway
    body: dict[str, Any] = {"session": request.session_key}
    if action == "set-label":
        body["label"] = request.label
    else:
        body["level"] = request.level

    try:
        result = await _call_gateway("PATCH", gateway_path_map[action], json=body)
        return SessionActionResponse(
            session_key=request.session_key,
            action=action,
            applied=True,
            detail=result.get("message") or result.get("detail"),
        )
    except HTTPException:
        # If gateway isn't running, return structured 501-style response
        # describing the action that *would* be applied
        logger.warning(
            f"Gateway unreachable — session action '{action}' recorded for "
            f"session {request.session_key} but not applied"
        )
        return SessionActionResponse(
            session_key=request.session_key,
            action=action,
            applied=False,
            detail="Gateway unreachable — action recorded but not applied",
        )


@router.delete("", response_model=SessionActionResponse)
async def delete_session(
    request: SessionActionRequest,
    current_user: User = Depends(get_current_user),
) -> SessionActionResponse:
    """Delete a session from the OpenClaw gateway.

    Requires session_key to identify the session to delete.
    """
    if not request.session_key:
        raise HTTPException(status_code=400, detail="session_key is required")

    try:
        await _call_gateway(
            "DELETE",
            f"/api/sessions/{request.session_key}",
        )
        return SessionActionResponse(
            session_key=request.session_key,
            action="delete",
            applied=True,
        )
    except HTTPException as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=404, detail="Session not found on gateway")
        # Gateway unreachable — surface the error but include detail
        return SessionActionResponse(
            session_key=request.session_key,
            action="delete",
            applied=False,
            detail=f"Gateway error: {exc.detail}",
        )
