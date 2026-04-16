from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user, get_current_user_optional, require_plan
from src.api.models import User
from src.api.models.pico_onboarding import (
    CoachMessage,
    GeneratePackageRequest as OnboardingGeneratePackageRequest,
    OnboardingState,
    PicoChatRequest,
    PicoChatResponse,
)
from src.api.models.pico_tutor import (
    PicoTutorOpenAIConnectionRequest,
    PicoTutorOpenAIConnectionStatus,
    PicoTutorRequest,
    PicoTutorResponse,
)
from src.api.services.pico_coach import handle_coach_chat
from src.api.services.pico_package_builder import build_onboarding_package
from src.api.services.pico_package_generator import generate_package_zip
from src.api.services.pico_progress import get_pico_progress, upsert_pico_progress
from src.api.services.pico_tutor import generate_pico_tutor_reply
from src.api.services.pico_tutor_openai import (
    PicoTutorOpenAIConnectionError,
    connect_pico_tutor_openai,
    disconnect_pico_tutor_openai,
    get_pico_tutor_openai_connection_status,
    resolve_pico_tutor_api_key,
)

router = APIRouter(prefix="/pico", tags=["pico"])

# ---------------------------------------------------------------------------
# In-memory session store (v1 — upgrade to DB-backed later)
# ---------------------------------------------------------------------------
_sessions: dict[str, dict[str, Any]] = {}


def _get_or_create_session(session_id: str | None) -> tuple[str, dict[str, Any]]:
    """Return (session_id, session_data), creating if needed."""
    if session_id and session_id in _sessions:
        return session_id, _sessions[session_id]
    new_id = session_id or str(uuid.uuid4())
    if new_id not in _sessions:
        _sessions[new_id] = {"history": [], "state": OnboardingState()}
    return new_id, _sessions[new_id]


# ---------------------------------------------------------------------------
# Progress (existing — unchanged)
# ---------------------------------------------------------------------------


class PicoProgressPayload(BaseModel):
    model_config = ConfigDict(extra="allow")


@router.get("/progress", response_model=dict[str, Any])
async def pico_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_pico_progress(db, user=current_user)


@router.post("/progress", response_model=dict[str, Any])
async def pico_progress_update(
    payload: PicoProgressPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await upsert_pico_progress(
        db,
        user=current_user,
        payload=payload.model_dump(),
        replace=False,
    )


# ---------------------------------------------------------------------------
# Tutor (existing — unchanged)
# ---------------------------------------------------------------------------


@router.post("/tutor", response_model=PicoTutorResponse)
async def pico_tutor(
    payload: PicoTutorRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    return await generate_pico_tutor_reply(
        payload,
        db=db,
        current_user=current_user,
        trace_id=getattr(request.state, "trace_id", None),
    )


@router.get(
    "/tutor/openai",
    response_model=PicoTutorOpenAIConnectionStatus,
    dependencies=[Depends(require_plan("starter"))],
)
async def pico_tutor_openai_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_pico_tutor_openai_connection_status(db, user=current_user)


@router.put(
    "/tutor/openai",
    response_model=PicoTutorOpenAIConnectionStatus,
    dependencies=[Depends(require_plan("starter"))],
)
async def pico_tutor_openai_connect(
    payload: PicoTutorOpenAIConnectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await connect_pico_tutor_openai(
            db,
            user=current_user,
            api_key=payload.apiKey,
        )
    except PicoTutorOpenAIConnectionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/tutor/openai",
    response_model=PicoTutorOpenAIConnectionStatus,
    dependencies=[Depends(require_plan("starter"))],
)
async def pico_tutor_openai_disconnect(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await disconnect_pico_tutor_openai(db, user=current_user)


# ---------------------------------------------------------------------------
# Onboarding coach (NEW)
# ---------------------------------------------------------------------------


@router.post("/chat", response_model=PicoChatResponse)
async def pico_coach_chat(
    payload: PicoChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Conversation with the onboarding coach. Extracts state, returns reply."""
    session_id, session_data = _get_or_create_session(payload.session_id)
    history: list[CoachMessage] = session_data["history"]

    # Resolve API key — user's own key or platform key
    api_key, _ = await resolve_pico_tutor_api_key(db, user=current_user)

    response = await handle_coach_chat(
        request=payload,
        history=history,
        api_key=api_key,
    )

    # Override session_id with the resolved one
    response.session_id = session_id

    # Persist to in-memory session
    history.append(CoachMessage(role="user", content=payload.message))
    history.append(
        CoachMessage(
            role="assistant",
            content=response.reply,
            onboarding_state=response.onboarding_state,
        )
    )
    session_data["history"] = history
    if response.onboarding_state:
        session_data["state"] = response.onboarding_state

    return response


# ---------------------------------------------------------------------------
# Package generation (REWRITTEN — real packages)
# ---------------------------------------------------------------------------


@router.post("/generate-package", dependencies=[Depends(require_plan("starter"))])
async def pico_generate_package(
    payload: OnboardingGeneratePackageRequest,
    current_user: User = Depends(get_current_user),
) -> Response:
    """Generate a real, stack-specific config ZIP from the onboarding session."""
    session_data = _sessions.get(payload.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    state: OnboardingState = session_data.get("state", OnboardingState())
    if not state.ready:
        raise HTTPException(
            status_code=422,
            detail="Not enough information to generate a package. "
            "Complete the onboarding chat first.",
        )

    zip_bytes, filename = build_onboarding_package(state)

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Legacy package generation (kept for backward compat, will deprecate)
# ---------------------------------------------------------------------------


class LegacyGeneratePackageRequest(BaseModel):
    agent_name: str
    pain_points: list[str] | None = None
    model: str | None = None


@router.post("/generate-package-legacy", dependencies=[Depends(require_plan("starter"))])
async def pico_generate_package_legacy(
    payload: LegacyGeneratePackageRequest,
    current_user: User = Depends(get_current_user),
) -> Response:
    """Legacy package generator — kept for backward compatibility."""
    if not payload.agent_name.strip():
        raise HTTPException(status_code=422, detail="agent_name is required")

    zip_bytes = generate_package_zip(
        agent_name=payload.agent_name.strip(),
        pain_points=payload.pain_points,
        model=payload.model,
        user_email=current_user.email if hasattr(current_user, "email") else None,
    )

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{payload.agent_name.strip()}.zip"',
        },
    )
