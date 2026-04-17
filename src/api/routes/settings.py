from __future__ import annotations

from typing import Any, Literal, cast
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User, UserSetting

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_INTERFACE_MODE: Literal["essential", "full"] = "full"
INTERFACE_MODE_SETTING_KEY = "ui.interface_mode"
VALID_INTERFACE_MODES = {"essential", "full"}
VALID_SUBSCRIPTION_PLANS = {"free", "starter", "pro", "enterprise"}

SubscriptionPlan = Literal["free", "starter", "pro", "enterprise"]


class SettingsResponse(BaseModel):
    subscription: SubscriptionPlan
    interface_mode: Literal["essential", "full"]
    org_name: str


class SettingsUpdateRequest(BaseModel):
    interface_mode: Literal["essential", "full"] = Field(
        ...,
        description="Operator interface density to persist for this account.",
    )


def _normalize_interface_mode(value: Any) -> Literal["essential", "full"]:
    if isinstance(value, dict):
        candidate = value.get("interface_mode")
        if isinstance(candidate, str) and candidate in VALID_INTERFACE_MODES:
            return cast(Literal["essential", "full"], candidate)

    if isinstance(value, str) and value in VALID_INTERFACE_MODES:
        return cast(Literal["essential", "full"], value)

    return DEFAULT_INTERFACE_MODE


def _normalize_subscription_plan(value: Any) -> SubscriptionPlan:
    if not isinstance(value, str):
        return "free"

    normalized = value.strip().lower()
    if normalized in VALID_SUBSCRIPTION_PLANS:
        return cast(SubscriptionPlan, normalized)

    return "free"


async def _load_interface_mode(
    db: AsyncSession,
    user_id: UUID,
) -> Literal["essential", "full"]:
    result = await db.execute(
        select(UserSetting).where(
            UserSetting.user_id == user_id,
            UserSetting.key == INTERFACE_MODE_SETTING_KEY,
        )
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        return DEFAULT_INTERFACE_MODE

    return _normalize_interface_mode(setting.value)


async def _persist_interface_mode(
    db: AsyncSession,
    *,
    user_id: UUID,
    interface_mode: str,
) -> None:
    result = await db.execute(
        select(UserSetting).where(
            UserSetting.user_id == user_id,
            UserSetting.key == INTERFACE_MODE_SETTING_KEY,
        )
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        db.add(
            UserSetting(
                user_id=user_id,
                key=INTERFACE_MODE_SETTING_KEY,
                value={"interface_mode": interface_mode},
            )
        )
    else:
        setting.value = {"interface_mode": interface_mode}

    await db.commit()


async def _build_settings_response(
    db: AsyncSession,
    current_user: User,
) -> SettingsResponse:
    interface_mode = await _load_interface_mode(db, current_user.id)
    return SettingsResponse(
        subscription=_normalize_subscription_plan(current_user.plan),
        interface_mode=interface_mode,
        org_name=current_user.name,
    )


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _build_settings_response(db, current_user)


@router.patch("", response_model=SettingsResponse)
async def update_settings(
    payload: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _persist_interface_mode(
        db,
        user_id=current_user.id,
        interface_mode=payload.interface_mode,
    )
    return await _build_settings_response(db, current_user)
