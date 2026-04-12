from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user, get_current_user_optional
from src.api.models import User
from src.api.models.pico_tutor import (
    PicoTutorOpenAIConnectionRequest,
    PicoTutorOpenAIConnectionStatus,
    PicoTutorRequest,
    PicoTutorResponse,
)
from src.api.services.pico_progress import get_pico_progress, upsert_pico_progress
from src.api.services.pico_tutor import generate_pico_tutor_reply
from src.api.services.pico_tutor_openai import (
    PicoTutorOpenAIConnectionError,
    connect_pico_tutor_openai,
    disconnect_pico_tutor_openai,
    get_pico_tutor_openai_connection_status,
)

router = APIRouter(prefix="/pico", tags=["pico"])


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


@router.get("/tutor/openai", response_model=PicoTutorOpenAIConnectionStatus)
async def pico_tutor_openai_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_pico_tutor_openai_connection_status(db, user=current_user)


@router.put("/tutor/openai", response_model=PicoTutorOpenAIConnectionStatus)
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


@router.delete("/tutor/openai", response_model=PicoTutorOpenAIConnectionStatus)
async def pico_tutor_openai_disconnect(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await disconnect_pico_tutor_openai(db, user=current_user)
