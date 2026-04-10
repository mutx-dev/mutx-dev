from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import User, UserSetting

PICO_PROGRESS_KEY = 'pico.progress'
PICO_PROGRESS_VERSION = 1


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _default_progress() -> dict[str, Any]:
    now = _utcnow().isoformat()
    return {
        'version': PICO_PROGRESS_VERSION,
        'started_at': now,
        'updated_at': now,
        'effective_plan': 'starter',
        'plan_source': 'alpha_override',
        'focus_track_id': 'track-a-first-agent',
        'xp': 25,
        'started_lesson_ids': [],
        'completed_lesson_ids': [],
        'earned_badge_ids': ['account-created'],
        'unlocked_level_ids': [0],
        'milestone_ids': ['account-created'],
        'events': [
            {
                'id': 'account-created',
                'type': 'account_created',
                'summary': 'Account created and Pico workspace unlocked.',
                'created_at': now,
                'status': 'completed',
                'metadata': {},
            }
        ],
        'alert_config': {
            'enabled': False,
            'monthly_budget_usd': 25,
            'notify_email': True,
            'notify_webhook': False,
        },
        'approval_gate': {
            'enabled': False,
            'risky_action': 'deployment_change',
            'pending_requests': [],
            'last_reviewed_at': None,
        },
        'tutor': {
            'free_questions_remaining': 5,
            'questions_asked': 0,
            'escalations': 0,
            'history': [],
        },
    }


def _deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    deduped: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip() and item not in deduped:
            deduped.append(item)
    return deduped


def _normalize_int_list(value: Any) -> list[int]:
    if not isinstance(value, list):
        return []

    deduped: list[int] = []
    for item in value:
        try:
            normalized = int(item)
        except (TypeError, ValueError):
            continue
        if normalized not in deduped:
            deduped.append(normalized)
    return deduped


def _normalize_progress(payload: dict[str, Any] | None) -> dict[str, Any]:
    progress = _default_progress()
    if payload:
        progress = _deep_merge(progress, payload)

    progress['version'] = PICO_PROGRESS_VERSION
    progress['updated_at'] = _utcnow().isoformat()
    progress['started_at'] = (
        progress.get('started_at') if isinstance(progress.get('started_at'), str) else _utcnow().isoformat()
    )
    progress['focus_track_id'] = (
        progress.get('focus_track_id') if isinstance(progress.get('focus_track_id'), str) else 'track-a-first-agent'
    )
    progress['xp'] = max(int(progress.get('xp') or 0), 0)
    progress['started_lesson_ids'] = _normalize_string_list(progress.get('started_lesson_ids'))
    progress['completed_lesson_ids'] = _normalize_string_list(progress.get('completed_lesson_ids'))
    progress['earned_badge_ids'] = _normalize_string_list(progress.get('earned_badge_ids'))
    progress['milestone_ids'] = _normalize_string_list(progress.get('milestone_ids'))
    progress['unlocked_level_ids'] = _normalize_int_list(progress.get('unlocked_level_ids')) or [0]
    progress['events'] = [
        item for item in (progress.get('events') or []) if isinstance(item, dict) and item.get('type')
    ]

    default_autopilot = _default_progress()['alert_config']
    progress['alert_config'] = _deep_merge(
        default_autopilot,
        progress.get('alert_config') if isinstance(progress.get('alert_config'), dict) else {},
    )
    progress['alert_config']['monthly_budget_usd'] = max(
        int(progress['alert_config'].get('monthly_budget_usd') or 25),
        1,
    )

    default_gate = _default_progress()['approval_gate']
    progress['approval_gate'] = _deep_merge(
        default_gate,
        progress.get('approval_gate') if isinstance(progress.get('approval_gate'), dict) else {},
    )
    progress['approval_gate']['enabled'] = bool(progress['approval_gate'].get('enabled'))
    progress['approval_gate']['pending_requests'] = [
        item
        for item in progress['approval_gate'].get('pending_requests', [])
        if isinstance(item, dict)
    ]

    default_tutor = _default_progress()['tutor']
    progress['tutor'] = _deep_merge(
        default_tutor,
        progress.get('tutor') if isinstance(progress.get('tutor'), dict) else {},
    )
    progress['tutor']['questions_asked'] = max(int(progress['tutor'].get('questions_asked') or 0), 0)
    progress['tutor']['free_questions_remaining'] = max(
        int(progress['tutor'].get('free_questions_remaining') or 0),
        0,
    )
    progress['tutor']['escalations'] = max(int(progress['tutor'].get('escalations') or 0), 0)
    progress['tutor']['history'] = [
        item for item in progress['tutor'].get('history', []) if isinstance(item, dict)
    ]

    return progress


async def _get_setting(db: AsyncSession, *, user_id, key: str) -> UserSetting | None:
    result = await db.execute(
        select(UserSetting).where(UserSetting.user_id == user_id, UserSetting.key == key)
    )
    return result.scalar_one_or_none()


async def get_pico_progress(db: AsyncSession, *, user: User) -> dict[str, Any]:
    setting = await _get_setting(db, user_id=user.id, key=PICO_PROGRESS_KEY)
    return _normalize_progress(setting.value if setting else None)


async def upsert_pico_progress(
    db: AsyncSession,
    *,
    user: User,
    payload: dict[str, Any],
    replace: bool = False,
) -> dict[str, Any]:
    existing = await _get_setting(db, user_id=user.id, key=PICO_PROGRESS_KEY)
    current_progress = _normalize_progress(existing.value if existing else None)
    next_progress = _normalize_progress(payload if replace else _deep_merge(current_progress, payload))

    if existing is None:
        existing = UserSetting(user_id=user.id, key=PICO_PROGRESS_KEY, value=next_progress)
        db.add(existing)
    else:
        existing.value = next_progress

    await db.commit()
    await db.refresh(existing)
    return _normalize_progress(existing.value)
