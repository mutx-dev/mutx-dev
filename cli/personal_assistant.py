from __future__ import annotations

import re
from typing import Any


DEFAULT_TEMPLATE_ID = "personal_assistant"
DEFAULT_ASSISTANT_MODEL = "openai/gpt-5"
DEFAULT_GATEWAY_PORT = 18789
DEFAULT_CHANNELS: tuple[dict[str, str], ...] = (
    {"id": "webchat", "label": "WebChat"},
    {"id": "telegram", "label": "Telegram"},
    {"id": "discord", "label": "Discord"},
    {"id": "slack", "label": "Slack"},
    {"id": "whatsapp", "label": "WhatsApp"},
)


def slugify_assistant_id(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "personal-assistant"


def default_channel_map() -> dict[str, dict[str, Any]]:
    return {
        item["id"]: {
            "label": item["label"],
            "enabled": False,
            "mode": "pairing",
            "allow_from": [],
        }
        for item in DEFAULT_CHANNELS
    }


def detect_gateway_port() -> int:
    try:
        from src.api.services.gateway_runtime import get_detected_gateway_port
    except ModuleNotFoundError:
        return DEFAULT_GATEWAY_PORT

    try:
        return get_detected_gateway_port() or DEFAULT_GATEWAY_PORT
    except Exception:
        return DEFAULT_GATEWAY_PORT


def build_personal_assistant_config(
    *,
    name: str = "Personal Assistant",
    description: str | None = None,
    model: str | None = None,
    workspace: str | None = None,
    assistant_id: str | None = None,
    skills: list[str] | None = None,
    channels: dict[str, dict[str, Any]] | None = None,
    runtime_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    resolved_assistant_id = assistant_id or slugify_assistant_id(name)
    normalized_channels = default_channel_map()
    for channel_id, payload in (channels or {}).items():
        existing = normalized_channels.get(
            channel_id,
            {
                "label": channel_id.replace("_", " ").title(),
                "enabled": False,
                "mode": "pairing",
                "allow_from": [],
            },
        )
        if isinstance(payload, dict):
            existing.update(payload)
        normalized_channels[channel_id] = existing

    return {
        "name": name,
        "system_prompt": (
            "You are the MUTX Personal Assistant. Operate as a proactive, safe, channel-aware "
            "assistant for a single operator. Prefer concise, operationally useful responses."
        ),
        "version": 1,
        "runtime": DEFAULT_TEMPLATE_ID,
        "template": DEFAULT_TEMPLATE_ID,
        "assistant_id": resolved_assistant_id,
        "workspace": workspace or resolved_assistant_id,
        "model": model or DEFAULT_ASSISTANT_MODEL,
        "safety_mode": "pairing",
        "skills": list(dict.fromkeys(skills or ["web_search", "workspace_memory"])),
        "channels": normalized_channels,
        "wakeups": [],
        "metadata": {
            "starter": True,
            "description": description,
            "starter_template": DEFAULT_TEMPLATE_ID,
            "runtime": dict(runtime_metadata or {}),
        },
        "gateway": {
            "port": detect_gateway_port(),
            "auth_mode": "token",
            "dashboard_allowed_origins": [],
        },
    }
