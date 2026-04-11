from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.models.schemas import PicoStateResponse, PicoStateUpdateRequest
from src.api.services.pico_progress import get_pico_progress, upsert_pico_progress

router = APIRouter(prefix='/pico', tags=['pico'])


class PicoLegacyProgressPayload(BaseModel):
    model_config = ConfigDict(extra='allow')


def _to_legacy_progress(state: dict[str, Any]) -> dict[str, Any]:
    pending_requests = state.get('approval_gate', {}).get('pending_requests', [])
    notify_email = bool(state.get('alert_config', {}).get('notify_email'))
    notify_webhook = bool(state.get('alert_config', {}).get('notify_webhook'))
    if notify_webhook:
        alert_channel = 'webhook'
    elif notify_email:
        alert_channel = 'email'
    else:
        alert_channel = 'in_app'

    selected_track = state.get('focus_track_id')
    if selected_track == 'track-a-first-agent' and not state.get('started_lesson_ids') and not state.get('completed_lesson_ids'):
        selected_track = None

    threshold_percent = state.get('alert_config', {}).get('monthly_budget_usd', 25)
    if selected_track is None and threshold_percent == 25:
        threshold_percent = 75

    return {
        'version': state.get('version', 1),
        'startedAt': state.get('started_at'),
        'updatedAt': state.get('updated_at'),
        'selectedTrack': selected_track,
        'startedLessons': state.get('started_lesson_ids', []),
        'completedLessons': state.get('completed_lesson_ids', []),
        'milestoneEvents': state.get('milestone_ids', []),
        'tutorQuestions': state.get('tutor', {}).get('questions_asked', 0),
        'supportRequests': state.get('tutor', {}).get('escalations', 0),
        'helpfulResponses': 0,
        'sharedProjects': [],
        'autopilot': {
            'costThresholdPercent': threshold_percent,
            'alertChannel': alert_channel,
            'approvalGateEnabled': state.get('approval_gate', {}).get('enabled', False),
            'approvalRequestIds': [
                item.get('id') for item in pending_requests if isinstance(item, dict) and item.get('id')
            ],
            'lastThresholdBreachAt': None,
        },
    }


def _from_legacy_progress(payload: dict[str, Any]) -> dict[str, Any]:
    autopilot = payload.get('autopilot') if isinstance(payload.get('autopilot'), dict) else {}
    alert_channel = autopilot.get('alertChannel')
    pending_request_ids = autopilot.get('approvalRequestIds') if isinstance(autopilot.get('approvalRequestIds'), list) else []

    return {
        'focus_track_id': payload.get('selectedTrack'),
        'started_lesson_ids': payload.get('startedLessons', []),
        'completed_lesson_ids': payload.get('completedLessons', []),
        'milestone_ids': payload.get('milestoneEvents', []),
        'tutor': {
            'questions_asked': payload.get('tutorQuestions', 0),
            'escalations': payload.get('supportRequests', 0),
        },
        'alert_config': {
            'monthly_budget_usd': autopilot.get('costThresholdPercent', 25),
            'notify_email': alert_channel == 'email',
            'notify_webhook': alert_channel == 'webhook',
        },
        'approval_gate': {
            'enabled': autopilot.get('approvalGateEnabled', False),
            'pending_requests': [
                {'id': request_id, 'status': 'pending'}
                for request_id in pending_request_ids
                if isinstance(request_id, str) and request_id.strip()
            ],
        },
    }


@router.get('/state', response_model=PicoStateResponse)
async def pico_state(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {'state': await get_pico_progress(db, user=current_user)}


@router.put('/state', response_model=PicoStateResponse)
async def pico_state_update(
    request: PicoStateUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        'state': await upsert_pico_progress(
            db,
            user=current_user,
            payload=request.patch,
            replace=request.replace,
        )
    }


@router.get('/progress', response_model=dict[str, Any])
async def pico_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_legacy_progress(await get_pico_progress(db, user=current_user))


@router.post('/progress', response_model=dict[str, Any])
async def pico_progress_update(
    payload: PicoLegacyProgressPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_legacy_progress(
        await upsert_pico_progress(
            db,
            user=current_user,
            payload=_from_legacy_progress(payload.model_dump()),
            replace=False,
        )
    )
