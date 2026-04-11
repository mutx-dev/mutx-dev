from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import User
from src.api.services.operator_state import _get_setting, _upsert_setting

PICO_PROGRESS_KEY = "pico.progress"

DEFAULT_PICO_PROGRESS: dict[str, Any] = {
    "version": 1,
    "startedAt": None,
    "updatedAt": None,
    "selectedTrack": None,
    "startedLessons": [],
    "completedLessons": [],
    "milestoneEvents": [],
    "tutorQuestions": 0,
    "supportRequests": 0,
    "helpfulResponses": 0,
    "sharedProjects": [],
    "autopilot": {
        "costThresholdPercent": 75,
        "alertChannel": "in_app",
        "approvalGateEnabled": False,
        "approvalRequestIds": [],
        "lastThresholdBreachAt": None,
    },
}


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _dedupe_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    deduped: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip() and item not in deduped:
            deduped.append(item)
    return deduped


def _deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _normalize_progress(payload: dict[str, Any] | None) -> dict[str, Any]:
    progress = deepcopy(DEFAULT_PICO_PROGRESS)
    if payload:
        progress = _deep_merge(progress, payload)

    now = _utcnow_iso()
    progress["version"] = 1
    progress["startedAt"] = (
        progress.get("startedAt") if isinstance(progress.get("startedAt"), str) else now
    )
    progress["updatedAt"] = (
        progress.get("updatedAt") if isinstance(progress.get("updatedAt"), str) else now
    )
    progress["selectedTrack"] = (
        progress.get("selectedTrack") if isinstance(progress.get("selectedTrack"), str) else None
    )
    progress["startedLessons"] = _dedupe_string_list(progress.get("startedLessons"))
    progress["completedLessons"] = _dedupe_string_list(progress.get("completedLessons"))
    progress["milestoneEvents"] = _dedupe_string_list(progress.get("milestoneEvents"))
    progress["sharedProjects"] = _dedupe_string_list(progress.get("sharedProjects"))
    progress["tutorQuestions"] = max(int(progress.get("tutorQuestions") or 0), 0)
    progress["supportRequests"] = max(int(progress.get("supportRequests") or 0), 0)
    progress["helpfulResponses"] = max(int(progress.get("helpfulResponses") or 0), 0)

    autopilot = progress.get("autopilot") if isinstance(progress.get("autopilot"), dict) else {}
    normalized_autopilot = deepcopy(DEFAULT_PICO_PROGRESS["autopilot"])
    normalized_autopilot.update(autopilot)
    normalized_autopilot["approvalRequestIds"] = _dedupe_string_list(
        normalized_autopilot.get("approvalRequestIds")
    )

    threshold = normalized_autopilot.get("costThresholdPercent")
    if isinstance(threshold, (int, float)):
        normalized_autopilot["costThresholdPercent"] = max(1, min(100, round(float(threshold))))
    else:
        normalized_autopilot["costThresholdPercent"] = DEFAULT_PICO_PROGRESS["autopilot"][
            "costThresholdPercent"
        ]

    alert_channel = normalized_autopilot.get("alertChannel")
    normalized_autopilot["alertChannel"] = (
        alert_channel if alert_channel in {"in_app", "email", "webhook"} else "in_app"
    )
    normalized_autopilot["approvalGateEnabled"] = bool(
        normalized_autopilot.get("approvalGateEnabled")
    )
    normalized_autopilot["lastThresholdBreachAt"] = (
        normalized_autopilot.get("lastThresholdBreachAt")
        if isinstance(normalized_autopilot.get("lastThresholdBreachAt"), str)
        else None
    )

    progress["autopilot"] = normalized_autopilot
    return progress


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
    next_progress = _normalize_progress(
        payload if replace else _deep_merge(current_progress, payload)
    )
    next_progress["updatedAt"] = _utcnow_iso()

    await _upsert_setting(db, user=user, key=PICO_PROGRESS_KEY, value=next_progress)
    await db.commit()
    return _normalize_progress(next_progress)
