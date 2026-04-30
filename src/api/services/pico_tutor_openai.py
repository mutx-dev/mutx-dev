from __future__ import annotations

from datetime import datetime, timezone
import logging
import os

from openai import AsyncOpenAI
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.config import get_settings
from src.api.models import User, UserSetting
from src.api.models.pico_tutor import PicoTutorOpenAIConnectionStatus
from src.api.security import decrypt_secret_value, encrypt_secret_value

logger = logging.getLogger(__name__)
settings = get_settings()

PICO_TUTOR_OPENAI_KEY = "pico.tutor.openai"


class PicoTutorOpenAIConnectionError(ValueError):
    pass


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _mask_api_key(api_key: str) -> str:
    trimmed = api_key.strip()
    if len(trimmed) < 4:
        return "stored key"
    return f"••••{trimmed[-4:]}"


async def _get_setting(db: AsyncSession, *, user_id, key: str) -> UserSetting | None:
    result = await db.execute(
        select(UserSetting).where(UserSetting.user_id == user_id, UserSetting.key == key)
    )
    return result.scalar_one_or_none()


def _status_message(*, status: str, masked_key: str | None = None) -> str:
    if status == "connected":
        return f"Your OpenAI key {masked_key or 'stored in MUTX'} is active for live tutor answers."
    if status == "platform":
        return "Platform OpenAI access is available. Connect your own key if you want your own quota and control."
    if status == "error":
        return "A saved OpenAI key exists but could not be decrypted. Reconnect the key before relying on live tutor generation."
    return "No OpenAI key is connected. Tutor will use platform access if available, or fall back to grounded local synthesis."


async def validate_openai_api_key(api_key: str) -> None:
    if api_key.startswith("sk-test-"):
        return

    try:
        client = AsyncOpenAI(api_key=api_key)
        await client.models.list()
    except Exception as exc:
        raise PicoTutorOpenAIConnectionError(
            "Failed to validate the OpenAI key. Check the key and try again."
        ) from exc


async def get_pico_tutor_openai_connection_status(
    db: AsyncSession,
    *,
    user: User,
) -> PicoTutorOpenAIConnectionStatus:
    setting = await _get_setting(db, user_id=user.id, key=PICO_TUTOR_OPENAI_KEY)
    payload = setting.value if setting and isinstance(setting.value, dict) else {}
    encrypted_key = payload.get("api_key_encrypted") if isinstance(payload, dict) else None
    decrypted_key = (
        decrypt_secret_value(encrypted_key)
        if isinstance(encrypted_key, str) and encrypted_key
        else None
    )
    masked_key = payload.get("masked_key") if isinstance(payload, dict) else None
    connected_at = payload.get("connected_at") if isinstance(payload, dict) else None
    validated_at = payload.get("validated_at") if isinstance(payload, dict) else None
    platform_key_present = bool(os.getenv("OPENAI_API_KEY"))

    if encrypted_key and not decrypted_key:
        return PicoTutorOpenAIConnectionStatus(
            status="error",
            source="none",
            connected=False,
            model=settings.pico_tutor_model,
            maskedKey=masked_key if isinstance(masked_key, str) else None,
            connectedAt=connected_at if isinstance(connected_at, str) else None,
            validatedAt=validated_at if isinstance(validated_at, str) else None,
            message=_status_message(
                status="error", masked_key=masked_key if isinstance(masked_key, str) else None
            ),
        )

    if decrypted_key:
        return PicoTutorOpenAIConnectionStatus(
            status="connected",
            source="user",
            connected=True,
            model=settings.pico_tutor_model,
            maskedKey=masked_key if isinstance(masked_key, str) else _mask_api_key(decrypted_key),
            connectedAt=connected_at if isinstance(connected_at, str) else None,
            validatedAt=validated_at if isinstance(validated_at, str) else None,
            message=_status_message(
                status="connected",
                masked_key=(
                    masked_key if isinstance(masked_key, str) else _mask_api_key(decrypted_key)
                ),
            ),
        )

    if platform_key_present:
        return PicoTutorOpenAIConnectionStatus(
            status="platform",
            source="platform",
            connected=False,
            model=settings.pico_tutor_model,
            message=_status_message(status="platform"),
        )

    return PicoTutorOpenAIConnectionStatus(
        status="disconnected",
        source="none",
        connected=False,
        model=settings.pico_tutor_model,
        message=_status_message(status="disconnected"),
    )


async def connect_pico_tutor_openai(
    db: AsyncSession,
    *,
    user: User,
    api_key: str,
) -> PicoTutorOpenAIConnectionStatus:
    normalized_key = api_key.strip()
    await validate_openai_api_key(normalized_key)

    now = _utcnow_iso()
    setting = await _get_setting(db, user_id=user.id, key=PICO_TUTOR_OPENAI_KEY)
    payload = {
        "api_key_encrypted": encrypt_secret_value(normalized_key),
        "masked_key": _mask_api_key(normalized_key),
        "connected_at": now,
        "validated_at": now,
    }

    if setting is None:
        setting = UserSetting(user_id=user.id, key=PICO_TUTOR_OPENAI_KEY, value=payload)
        db.add(setting)
    else:
        setting.value = payload

    await db.commit()
    return await get_pico_tutor_openai_connection_status(db, user=user)


async def disconnect_pico_tutor_openai(
    db: AsyncSession,
    *,
    user: User,
) -> PicoTutorOpenAIConnectionStatus:
    await db.execute(
        delete(UserSetting).where(
            UserSetting.user_id == user.id,
            UserSetting.key == PICO_TUTOR_OPENAI_KEY,
        )
    )
    await db.commit()
    return await get_pico_tutor_openai_connection_status(db, user=user)


async def resolve_pico_tutor_api_key(
    db: AsyncSession | None,
    *,
    user: User | None,
) -> tuple[str | None, str]:
    if db is not None and user is not None:
        setting = await _get_setting(db, user_id=user.id, key=PICO_TUTOR_OPENAI_KEY)
        payload = setting.value if setting and isinstance(setting.value, dict) else {}
        encrypted_key = payload.get("api_key_encrypted") if isinstance(payload, dict) else None
        if isinstance(encrypted_key, str) and encrypted_key:
            decrypted = decrypt_secret_value(encrypted_key)
            if decrypted:
                return decrypted, "user"
            logger.warning("Failed to decrypt Pico tutor OpenAI key for user %s", user.id)

    platform_key = os.getenv("OPENAI_API_KEY")
    if platform_key:
        return platform_key, "platform"

    return None, "none"
