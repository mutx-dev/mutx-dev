from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import User, UserSetting


STALE_AFTER_SECONDS = 900

ONBOARDING_STEPS: tuple[dict[str, str], ...] = (
    {"id": "auth", "title": "Authenticate operator"},
    {"id": "provider", "title": "Select provider"},
    {"id": "install", "title": "Install runtime"},
    {"id": "onboard", "title": "Onboard gateway"},
    {"id": "track", "title": "Track local runtime"},
    {"id": "bind", "title": "Bind assistant"},
    {"id": "governance", "title": "Configure governance"},
    {"id": "deploy", "title": "Deploy starter assistant"},
    {"id": "verify", "title": "Verify local health"},
)

PROVIDER_OPTIONS: tuple[dict[str, Any], ...] = (
    {
        "id": "openclaw",
        "label": "OpenClaw",
        "summary": "External local runtime with dedicated assistant bindings and gateway health.",
        "enabled": True,
        "cue": "🦞",
    },
    {
        "id": "langchain",
        "label": "LangChain",
        "summary": "Future runtime provider for chain-orchestrated agents.",
        "enabled": False,
        "cue": "⋯",
    },
    {
        "id": "n8n",
        "label": "n8n",
        "summary": "Future runtime provider for automation-first agent flows.",
        "enabled": False,
        "cue": "⋯",
    },
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _onboarding_key(provider: str) -> str:
    return f"onboarding.{provider}"


def _runtime_key(provider: str) -> str:
    return f"runtime.provider.{provider}"


def _default_onboarding_state(provider: str = "openclaw") -> dict[str, Any]:
    return {
        "provider": provider,
        "status": "pending",
        "current_step": ONBOARDING_STEPS[0]["id"],
        "completed_steps": [],
        "failed_step": None,
        "last_error": None,
        "checklist_dismissed": False,
        "assistant_name": None,
        "assistant_id": None,
        "workspace": None,
        "gateway_url": None,
        "updated_at": _utcnow().isoformat(),
        "steps": [
            {"id": item["id"], "title": item["title"], "completed": False}
            for item in ONBOARDING_STEPS
        ],
        "providers": [dict(item) for item in PROVIDER_OPTIONS],
    }


def _normalize_onboarding_state(
    payload: dict[str, Any] | None, *, provider: str = "openclaw"
) -> dict[str, Any]:
    state = _default_onboarding_state(provider)
    if payload:
        state.update(payload)
    completed_steps = [str(item) for item in (state.get("completed_steps") or [])]
    deduped: list[str] = []
    valid_steps = {item["id"] for item in ONBOARDING_STEPS}
    for step_id in completed_steps:
        if step_id in valid_steps and step_id not in deduped:
            deduped.append(step_id)
    state["completed_steps"] = deduped
    state["steps"] = [
        {
            "id": item["id"],
            "title": item["title"],
            "completed": item["id"] in deduped,
        }
        for item in ONBOARDING_STEPS
    ]
    state["providers"] = [dict(item) for item in PROVIDER_OPTIONS]
    updated_raw = state.get("updated_at")
    if not isinstance(updated_raw, str):
        state["updated_at"] = _utcnow().isoformat()
    return state


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


def _normalize_runtime_snapshot(
    payload: dict[str, Any] | None, *, provider: str = "openclaw"
) -> dict[str, Any]:
    state = {
        "provider": provider,
        "runtime_key": provider,
        "label": "OpenClaw",
        "cue": "🦞",
        "status": "client_required",
        "install_method": None,
        "gateway": {
            "status": "client_required",
            "doctor_summary": "Live runtime inspection must come from the operator host. This is the last synced snapshot.",
        },
        "gateway_url": None,
        "gateway_port": None,
        "binding_count": 0,
        "bindings": [],
        "current_binding": None,
        "provider_root": None,
        "wizard_state_path": None,
        "binary_path": None,
        "home_path": None,
        "config_path": None,
        "state_dir": None,
        "version": None,
        "observed_source": "last_seen",
        "last_seen_at": None,
        "last_synced_at": None,
    }
    if payload:
        state.update(payload)

    last_seen_at = _parse_datetime(state.get("last_seen_at"))
    last_synced_at = _parse_datetime(state.get("last_synced_at"))
    stale = True
    if last_seen_at is not None:
        stale = _utcnow() - last_seen_at > timedelta(seconds=STALE_AFTER_SECONDS)
        state["last_seen_at"] = last_seen_at.isoformat()
    else:
        state["last_seen_at"] = None
    if last_synced_at is not None:
        state["last_synced_at"] = last_synced_at.isoformat()
    else:
        state["last_synced_at"] = None
    state["stale"] = stale
    state["stale_after_seconds"] = STALE_AFTER_SECONDS
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


async def get_onboarding_state(
    db: AsyncSession,
    *,
    user: User,
    provider: str = "openclaw",
) -> dict[str, Any]:
    setting = await _get_setting(db, user_id=user.id, key=_onboarding_key(provider))
    return _normalize_onboarding_state(setting.value if setting else None, provider=provider)


async def update_onboarding_state(
    db: AsyncSession,
    *,
    user: User,
    action: str,
    provider: str = "openclaw",
    step: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    state = await get_onboarding_state(db, user=user, provider=provider)
    if payload:
        state.update(payload)
        state = _normalize_onboarding_state(state, provider=provider)

    valid_step_ids = {item["id"] for item in ONBOARDING_STEPS}
    if step is not None and step not in valid_step_ids:
        raise ValueError("Invalid step")

    if action == "reset":
        state = _default_onboarding_state(provider)
    elif action == "dismiss_checklist":
        state["checklist_dismissed"] = True
    elif action == "skip":
        state["status"] = "skipped"
        state["updated_at"] = _utcnow().isoformat()
    elif action == "complete":
        state["status"] = "completed"
        state["completed_steps"] = [item["id"] for item in ONBOARDING_STEPS]
        state["current_step"] = ONBOARDING_STEPS[-1]["id"]
        state["failed_step"] = None
        state["last_error"] = None
    elif action == "complete_step":
        completed_steps = [str(item) for item in (state.get("completed_steps") or [])]
        if step and state.get("status") != "failed" and step not in completed_steps:
            completed_steps.append(step)
        state["completed_steps"] = completed_steps
        if state.get("status") not in {"failed", "skipped"}:
            state["status"] = (
                "completed" if len(completed_steps) == len(ONBOARDING_STEPS) else "in_progress"
            )
            for item in ONBOARDING_STEPS:
                if item["id"] not in completed_steps:
                    state["current_step"] = item["id"]
                    break
            else:
                state["current_step"] = ONBOARDING_STEPS[-1]["id"]
            state["failed_step"] = None
            state["last_error"] = None
    else:
        raise ValueError("Invalid action")

    state["updated_at"] = _utcnow().isoformat()
    state = _normalize_onboarding_state(state, provider=provider)
    await _upsert_setting(db, user=user, key=_onboarding_key(provider), value=state)
    await db.commit()
    return state


async def get_runtime_provider_snapshot(
    db: AsyncSession,
    *,
    user: User,
    provider: str = "openclaw",
) -> dict[str, Any]:
    setting = await _get_setting(db, user_id=user.id, key=_runtime_key(provider))
    return _normalize_runtime_snapshot(setting.value if setting else None, provider=provider)


async def upsert_runtime_provider_snapshot(
    db: AsyncSession,
    *,
    user: User,
    provider: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    snapshot = _normalize_runtime_snapshot(payload, provider=provider)
    snapshot["last_synced_at"] = _utcnow().isoformat()
    await _upsert_setting(db, user=user, key=_runtime_key(provider), value=snapshot)
    await db.commit()
    return _normalize_runtime_snapshot(snapshot, provider=provider)
