from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import User, UserSetting

PICO_STATE_KEY = "pico.state"
RECENT_EVENTS_LIMIT = 20
LEVEL_THRESHOLDS: tuple[int, ...] = (0, 100, 250, 500, 900, 1400)
EVENT_XP_MAP: dict[str, int] = {
    "lesson_completed": 50,
    "track_completed": 100,
    "badge_earned": 50,
    "milestone_reached": 75,
    "tutor_session_used": 10,
    "starter_agent_deployed": 120,
    "first_agent_run": 80,
    "cost_threshold_set": 70,
    "approval_gate_enabled": 90,
    "xp_granted": 0,
}
EVENT_ALIASES: dict[str, str] = {
    "complete_lesson": "lesson_completed",
    "lesson_complete": "lesson_completed",
    "lesson.completed": "lesson_completed",
    "tutorial_completed": "lesson_completed",
    "complete_track": "track_completed",
    "track_complete": "track_completed",
    "track.completed": "track_completed",
    "badge_unlocked": "badge_earned",
    "badge.earned": "badge_earned",
    "milestone_completed": "milestone_reached",
    "milestone_earned": "milestone_reached",
    "milestone.reached": "milestone_reached",
    "tutor_used": "tutor_session_used",
    "tutor_session": "tutor_session_used",
    "tutor_question_asked": "tutor_session_used",
    "first_agent_deployed": "starter_agent_deployed",
    "budget_threshold_set": "cost_threshold_set",
    "approval_enabled": "approval_gate_enabled",
    "xp_awarded": "xp_granted",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)



def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    if isinstance(value, str) and value.strip():
        normalized = value.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(normalized)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    return None



def _coerce_nonnegative_int(value: Any, *, default: int = 0) -> int:
    try:
        coerced = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, coerced)



def _dedupe_strings(values: Any) -> list[str]:
    deduped: list[str] = []
    for value in values or []:
        item = str(value).strip()
        if item and item not in deduped:
            deduped.append(item)
    return deduped



def _level_from_xp(xp_total: int) -> int:
    level = 1
    for threshold in LEVEL_THRESHOLDS:
        if xp_total >= threshold:
            level += 1
    return max(1, level - 1)



def _normalize_event_name(event: str) -> str:
    normalized = str(event).strip().lower().replace("-", "_").replace(" ", "_")
    return EVENT_ALIASES.get(normalized, normalized)



def _default_pico_state(plan: str) -> dict[str, Any]:
    return {
        "plan": plan,
        "xp_total": 0,
        "current_level": 1,
        "cost_threshold_usd": None,
        "approval_gate_enabled": False,
        "completed_lessons": [],
        "completed_tracks": [],
        "badges": [],
        "milestones": [],
        "event_counts": {},
        "recent_events": [],
        "tutor_sessions_used": 0,
        "updated_at": _utcnow().isoformat(),
    }



def _normalize_recent_event(payload: dict[str, Any] | None) -> dict[str, Any]:
    event = payload or {}
    created_at = _parse_datetime(event.get("created_at"))
    return {
        "event": str(event.get("event") or "unknown"),
        "xp_awarded": _coerce_nonnegative_int(event.get("xp_awarded"), default=0),
        "lesson_id": str(event["lesson_id"]).strip() if event.get("lesson_id") else None,
        "track_id": str(event["track_id"]).strip() if event.get("track_id") else None,
        "badge_id": str(event["badge_id"]).strip() if event.get("badge_id") else None,
        "milestone_id": str(event["milestone_id"]).strip() if event.get("milestone_id") else None,
        "tutor_sessions": _coerce_nonnegative_int(event.get("tutor_sessions"), default=0),
        "created_at": (created_at or _utcnow()).isoformat(),
        "metadata": dict(event.get("metadata") or {}),
    }



def _normalize_state(payload: dict[str, Any] | None, *, plan: str) -> dict[str, Any]:
    state = _default_pico_state(plan)
    if payload:
        state.update(payload)

    xp_total = _coerce_nonnegative_int(state.get("xp_total"), default=0)
    event_counts_raw = state.get("event_counts") or {}
    recent_events_raw = state.get("recent_events") or []
    updated_at = _parse_datetime(state.get("updated_at"))

    normalized_counts: dict[str, int] = {}
    if isinstance(event_counts_raw, dict):
        for key, value in event_counts_raw.items():
            name = _normalize_event_name(str(key))
            normalized_counts[name] = _coerce_nonnegative_int(value, default=0)

    state["plan"] = plan
    state["xp_total"] = xp_total
    state["current_level"] = _level_from_xp(xp_total)
    state["cost_threshold_usd"] = (
        float(state["cost_threshold_usd"])
        if state.get("cost_threshold_usd") not in {None, ""}
        else None
    )
    state["approval_gate_enabled"] = bool(state.get("approval_gate_enabled", False))
    state["completed_lessons"] = _dedupe_strings(state.get("completed_lessons"))
    state["completed_tracks"] = _dedupe_strings(state.get("completed_tracks"))
    state["badges"] = _dedupe_strings(state.get("badges"))
    state["milestones"] = _dedupe_strings(state.get("milestones"))
    state["event_counts"] = normalized_counts
    state["recent_events"] = [
        _normalize_recent_event(item if isinstance(item, dict) else None)
        for item in recent_events_raw[-RECENT_EVENTS_LIMIT:]
    ]
    state["tutor_sessions_used"] = _coerce_nonnegative_int(
        state.get("tutor_sessions_used"),
        default=0,
    )
    state["updated_at"] = (updated_at or _utcnow()).isoformat()
    return state


async def _get_setting(
    db: AsyncSession,
    *,
    user_id,
    key: str,
) -> UserSetting | None:
    result = await db.execute(
        select(UserSetting).where(UserSetting.user_id == user_id, UserSetting.key == key)
    )
    return result.scalar_one_or_none()


async def _upsert_setting(
    db: AsyncSession,
    *,
    user: User,
    key: str,
    value: dict[str, Any],
) -> UserSetting:
    existing = await _get_setting(db, user_id=user.id, key=key)
    if existing is None:
        existing = UserSetting(user_id=user.id, key=key, value=value)
        db.add(existing)
    else:
        existing.value = value
    await db.flush()
    return existing


async def get_pico_state(
    db: AsyncSession,
    *,
    user: User,
) -> dict[str, Any]:
    setting = await _get_setting(db, user_id=user.id, key=PICO_STATE_KEY)
    return _normalize_state(setting.value if setting else None, plan=user.plan)


async def record_pico_event(
    db: AsyncSession,
    *,
    user: User,
    event: str,
    lesson_id: str | None = None,
    track_id: str | None = None,
    badge_id: str | None = None,
    milestone_id: str | None = None,
    tutor_sessions: int = 0,
    xp: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    state = await get_pico_state(db, user=user)
    canonical_event = _normalize_event_name(event)
    now = _utcnow().isoformat()

    completed_lessons = state["completed_lessons"]
    completed_tracks = state["completed_tracks"]
    badges = state["badges"]
    milestones = state["milestones"]

    lesson_id = str(lesson_id).strip() if lesson_id else None
    track_id = str(track_id).strip() if track_id else None
    badge_id = str(badge_id).strip() if badge_id else None
    milestone_id = str(milestone_id).strip() if milestone_id else None
    tutor_sessions = _coerce_nonnegative_int(tutor_sessions, default=0)

    xp_awarded = EVENT_XP_MAP.get(canonical_event, 0) if xp is None else _coerce_nonnegative_int(xp)

    if canonical_event == "lesson_completed" and lesson_id:
        if lesson_id not in completed_lessons:
            completed_lessons.append(lesson_id)
        else:
            xp_awarded = 0
    elif canonical_event == "track_completed" and track_id:
        if track_id not in completed_tracks:
            completed_tracks.append(track_id)
        else:
            xp_awarded = 0
    elif canonical_event == "badge_earned" and badge_id:
        if badge_id not in badges:
            badges.append(badge_id)
        else:
            xp_awarded = 0
    elif canonical_event == "milestone_reached" and milestone_id:
        if milestone_id not in milestones:
            milestones.append(milestone_id)
        else:
            xp_awarded = 0
    elif canonical_event == "tutor_session_used":
        sessions_used = max(1, tutor_sessions or 1)
        state["tutor_sessions_used"] += sessions_used
        if xp is None:
            xp_awarded = EVENT_XP_MAP[canonical_event] * sessions_used
    elif canonical_event == "cost_threshold_set":
        threshold = metadata.get("threshold_usd") if isinstance(metadata, dict) else None
        if threshold is not None:
            state["cost_threshold_usd"] = float(threshold)
    elif canonical_event == "approval_gate_enabled":
        state["approval_gate_enabled"] = True

    if lesson_id and canonical_event != "lesson_completed" and lesson_id not in completed_lessons:
        completed_lessons.append(lesson_id)
    if track_id and canonical_event != "track_completed" and track_id not in completed_tracks:
        completed_tracks.append(track_id)
    if badge_id and canonical_event != "badge_earned" and badge_id not in badges:
        badges.append(badge_id)
    if milestone_id and canonical_event != "milestone_reached" and milestone_id not in milestones:
        milestones.append(milestone_id)

    state["xp_total"] = _coerce_nonnegative_int(state.get("xp_total"), default=0) + xp_awarded
    state["current_level"] = _level_from_xp(state["xp_total"])
    state["event_counts"][canonical_event] = state["event_counts"].get(canonical_event, 0) + 1
    state["recent_events"] = [
        *state["recent_events"],
        {
            "event": canonical_event,
            "xp_awarded": xp_awarded,
            "lesson_id": lesson_id,
            "track_id": track_id,
            "badge_id": badge_id,
            "milestone_id": milestone_id,
            "tutor_sessions": tutor_sessions,
            "created_at": now,
            "metadata": dict(metadata or {}),
        },
    ][-RECENT_EVENTS_LIMIT:]
    state["updated_at"] = now
    state = _normalize_state(state, plan=user.plan)
    await _upsert_setting(db, user=user, key=PICO_STATE_KEY, value=state)
    await db.commit()
    return state
