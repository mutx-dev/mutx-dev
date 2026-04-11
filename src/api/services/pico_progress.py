from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
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
TUTOR_SESSION_LIMITS: dict[str, int | None] = {
    "FREE": 3,
    "STARTER": 25,
    "PRO": 100,
    "ENTERPRISE": None,
}
TUTOR_RESET_POLICY = "lifetime"
PICO_LESSON_CATALOG: dict[str, dict[str, str]] = {
    "install-hermes-locally": {
        "level_id": "level-0",
        "track_id": "track-a",
        "badge_id": "first-boot",
    },
    "run-your-first-agent": {
        "level_id": "level-0",
        "track_id": "track-a",
        "badge_id": "first-boot",
    },
    "deploy-hermes-on-a-vps": {
        "level_id": "level-1",
        "track_id": "track-b",
        "badge_id": "deployed",
    },
    "keep-your-agent-alive-between-sessions": {
        "level_id": "level-1",
        "track_id": "track-b",
        "badge_id": "deployed",
    },
    "connect-a-messaging-or-interface-layer": {
        "level_id": "level-1",
        "track_id": "track-b",
        "badge_id": "interface-online",
    },
    "add-your-first-skill-tool": {
        "level_id": "level-2",
        "track_id": "track-c",
        "badge_id": "capable",
    },
    "create-a-scheduled-workflow": {
        "level_id": "level-3",
        "track_id": "track-c",
        "badge_id": "automation-online",
    },
    "see-your-agent-activity": {
        "level_id": "level-4",
        "track_id": "track-d",
        "badge_id": "operator-aware",
    },
    "set-a-cost-threshold": {
        "level_id": "level-5",
        "track_id": "track-d",
        "badge_id": "guarded",
    },
    "add-an-approval-gate": {
        "level_id": "level-5",
        "track_id": "track-d",
        "badge_id": "guarded",
    },
    "build-a-lead-response-style-agent": {
        "level_id": "level-6",
        "track_id": "track-e",
        "badge_id": "production-ready",
    },
    "build-a-document-processing-style-agent": {
        "level_id": "level-6",
        "track_id": "track-e",
        "badge_id": "production-ready",
    },
}
TRACK_REQUIREMENTS: dict[str, tuple[str, ...]] = {}
BADGE_REQUIREMENTS: dict[str, tuple[str, ...]] = {}
for lesson_slug, lesson_meta in PICO_LESSON_CATALOG.items():
    TRACK_REQUIREMENTS.setdefault(lesson_meta["track_id"], tuple())
    TRACK_REQUIREMENTS[lesson_meta["track_id"]] = (*TRACK_REQUIREMENTS[lesson_meta["track_id"]], lesson_slug)
    BADGE_REQUIREMENTS.setdefault(lesson_meta["badge_id"], tuple())
    BADGE_REQUIREMENTS[lesson_meta["badge_id"]] = (*BADGE_REQUIREMENTS[lesson_meta["badge_id"]], lesson_slug)
TOTAL_PICO_LESSONS = len(PICO_LESSON_CATALOG)


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



def _coerce_nonnegative_float(value: Any) -> float | None:
    if value in {None, ""}:
        return None
    try:
        coerced = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, coerced)



def _dedupe_strings(values: Any) -> list[str]:
    deduped: list[str] = []
    for value in values or []:
        item = str(value).strip()
        if item and item not in deduped:
            deduped.append(item)
    return deduped



def _normalize_plan(plan: Any) -> str:
    normalized = str(plan or "FREE").strip().upper()
    return normalized if normalized in TUTOR_SESSION_LIMITS else "FREE"



def _level_from_xp(xp_total: int) -> int:
    level = 1
    for threshold in LEVEL_THRESHOLDS:
        if xp_total >= threshold:
            level += 1
    return max(1, level - 1)



def _level_floor_xp(level: int) -> int:
    index = max(0, min(level - 1, len(LEVEL_THRESHOLDS) - 1))
    return LEVEL_THRESHOLDS[index]



def _build_level_progress(xp_total: int) -> dict[str, Any]:
    current_level = _level_from_xp(xp_total)
    current_level_floor_xp = _level_floor_xp(current_level)
    next_level = current_level + 1 if current_level < len(LEVEL_THRESHOLDS) else None
    next_level_target_xp = LEVEL_THRESHOLDS[current_level] if current_level < len(LEVEL_THRESHOLDS) else None
    xp_into_level = max(0, xp_total - current_level_floor_xp)
    xp_to_next_level = (
        max(0, next_level_target_xp - xp_total) if next_level_target_xp is not None else None
    )
    if next_level_target_xp is None:
        progress_percent = 100
    else:
        span = max(1, next_level_target_xp - current_level_floor_xp)
        progress_percent = min(100, round((xp_into_level / span) * 100))
    return {
        "current_level": current_level,
        "current_level_floor_xp": current_level_floor_xp,
        "next_level": next_level,
        "next_level_target_xp": next_level_target_xp,
        "xp_into_level": xp_into_level,
        "xp_to_next_level": xp_to_next_level,
        "progress_percent": progress_percent,
    }



def _build_tutor_access(plan: str, used: int) -> dict[str, Any]:
    limit = TUTOR_SESSION_LIMITS.get(plan, TUTOR_SESSION_LIMITS["FREE"])
    remaining = None if limit is None else max(0, limit - used)
    limit_reached = limit is not None and used >= limit
    note = (
        "Enterprise tutor lookups are currently unmetered because reset windows and billing are not implemented yet."
        if limit is None
        else (
            f"{plan.title()} currently includes {limit} grounded tutor lookups total. "
            "Counts do not reset automatically yet."
        )
    )
    return {
        "plan": plan,
        "limit": limit,
        "remaining": remaining,
        "used": used,
        "limit_reached": limit_reached,
        "reset_policy": TUTOR_RESET_POLICY,
        "note": note,
    }



def _normalize_event_name(event: str) -> str:
    normalized = str(event).strip().lower().replace("-", "_").replace(" ", "_")
    return EVENT_ALIASES.get(normalized, normalized)



def _default_pico_state(plan: str) -> dict[str, Any]:
    normalized_plan = _normalize_plan(plan)
    return {
        "plan": normalized_plan,
        "xp_total": 0,
        "current_level": 1,
        "level_progress": _build_level_progress(0),
        "cost_threshold_usd": None,
        "approval_gate_enabled": False,
        "completed_lessons": [],
        "completed_tracks": [],
        "badges": [],
        "milestones": [],
        "event_counts": {},
        "recent_events": [],
        "tutor_sessions_used": 0,
        "tutor_access": _build_tutor_access(normalized_plan, 0),
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
    normalized_plan = _normalize_plan(plan)
    state = _default_pico_state(normalized_plan)
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

    tutor_sessions_used = _coerce_nonnegative_int(state.get("tutor_sessions_used"), default=0)
    level_progress = _build_level_progress(xp_total)

    state["plan"] = normalized_plan
    state["xp_total"] = xp_total
    state["current_level"] = level_progress["current_level"]
    state["level_progress"] = level_progress
    state["cost_threshold_usd"] = _coerce_nonnegative_float(state.get("cost_threshold_usd"))
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
    state["tutor_sessions_used"] = tutor_sessions_used
    state["tutor_access"] = _build_tutor_access(normalized_plan, tutor_sessions_used)
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



def _append_unique(values: list[str], item_id: str | None) -> bool:
    if item_id and item_id not in values:
        values.append(item_id)
        return True
    return False



def _award_milestone(
    state: dict[str, Any],
    milestone_id: str,
    auto_progress: dict[str, list[str]],
) -> int:
    if _append_unique(state["milestones"], milestone_id):
        auto_progress["milestones"].append(milestone_id)
        return EVENT_XP_MAP["milestone_reached"]
    return 0



def _award_badge(state: dict[str, Any], badge_id: str, auto_progress: dict[str, list[str]]) -> int:
    if _append_unique(state["badges"], badge_id):
        auto_progress["badges"].append(badge_id)
        return EVENT_XP_MAP["badge_earned"]
    return 0



def _award_track(state: dict[str, Any], track_id: str, auto_progress: dict[str, list[str]]) -> int:
    if _append_unique(state["completed_tracks"], track_id):
        auto_progress["completed_tracks"].append(track_id)
        return EVENT_XP_MAP["track_completed"]
    return 0



def _apply_auto_progression(
    state: dict[str, Any],
    *,
    canonical_event: str,
    lesson_id: str | None,
) -> tuple[int, dict[str, list[str]]]:
    auto_progress = {
        "completed_tracks": [],
        "badges": [],
        "milestones": [],
    }
    bonus_xp = 0
    completed_lessons = state["completed_lessons"]

    if canonical_event == "lesson_completed":
        if completed_lessons:
            bonus_xp += _award_milestone(state, "first_lesson_finished", auto_progress)

        lesson_meta = PICO_LESSON_CATALOG.get(lesson_id or "")
        if lesson_meta:
            badge_id = lesson_meta["badge_id"]
            badge_requirements = BADGE_REQUIREMENTS.get(badge_id, ())
            if badge_requirements and all(slug in completed_lessons for slug in badge_requirements):
                bonus_xp += _award_badge(state, badge_id, auto_progress)

            track_id = lesson_meta["track_id"]
            track_requirements = TRACK_REQUIREMENTS.get(track_id, ())
            if track_requirements and all(slug in completed_lessons for slug in track_requirements):
                bonus_xp += _award_track(state, track_id, auto_progress)

        if state["completed_tracks"]:
            bonus_xp += _award_milestone(state, "first_track_finished", auto_progress)

        if TOTAL_PICO_LESSONS and len(completed_lessons) >= TOTAL_PICO_LESSONS:
            bonus_xp += _award_milestone(state, "academy_completed", auto_progress)
    elif canonical_event == "track_completed" and state["completed_tracks"]:
        bonus_xp += _award_milestone(state, "first_track_finished", auto_progress)
    elif canonical_event == "tutor_session_used" and state["tutor_sessions_used"] > 0:
        bonus_xp += _award_milestone(state, "grounded_tutor_used", auto_progress)
    elif canonical_event == "starter_agent_deployed":
        bonus_xp += _award_milestone(state, "starter_agent_live", auto_progress)
    elif canonical_event == "cost_threshold_set":
        bonus_xp += _award_milestone(state, "budget_guardrail_set", auto_progress)
    elif canonical_event == "approval_gate_enabled":
        bonus_xp += _award_milestone(state, "approval_guardrail_live", auto_progress)

    return bonus_xp, auto_progress



def _enforce_tutor_limit(*, state: dict[str, Any], plan: str, requested_sessions: int) -> None:
    limit = TUTOR_SESSION_LIMITS.get(plan, TUTOR_SESSION_LIMITS["FREE"])
    if limit is None:
        return

    used = _coerce_nonnegative_int(state.get("tutor_sessions_used"), default=0)
    remaining = max(0, limit - used)
    if requested_sessions > remaining:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"{plan.title()} currently includes {limit} grounded tutor lookups total. "
                f"You have {remaining} remaining and requested {requested_sessions}. "
                "Counts do not reset automatically yet."
            ),
        )


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
    event_metadata = dict(metadata or {})

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
        plan = _normalize_plan(user.plan)
        _enforce_tutor_limit(state=state, plan=plan, requested_sessions=sessions_used)
        state["tutor_sessions_used"] += sessions_used
        tutor_sessions = sessions_used
        if xp is None:
            xp_awarded = EVENT_XP_MAP[canonical_event] * sessions_used
    elif canonical_event == "cost_threshold_set":
        threshold = event_metadata.get("threshold_usd")
        normalized_threshold = _coerce_nonnegative_float(threshold)
        if normalized_threshold is not None:
            state["cost_threshold_usd"] = normalized_threshold
    elif canonical_event == "approval_gate_enabled":
        state["approval_gate_enabled"] = True

    bonus_xp, auto_progress = _apply_auto_progression(
        state,
        canonical_event=canonical_event,
        lesson_id=lesson_id,
    )
    if any(auto_progress.values()):
        event_metadata["auto_progress"] = auto_progress
    xp_awarded += bonus_xp

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
            "metadata": event_metadata,
        },
    ][-RECENT_EVENTS_LIMIT:]
    state["updated_at"] = now
    state = _normalize_state(state, plan=user.plan)
    await _upsert_setting(db, user=user, key=PICO_STATE_KEY, value=state)
    await db.commit()
    return state
