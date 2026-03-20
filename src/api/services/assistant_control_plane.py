from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from src.api.models import Agent, AgentType
from src.api.services.gateway_runtime import (
    get_detected_gateway_port,
    get_detected_gateway_token,
    get_detected_openclaw_config_path,
    get_detected_openclaw_state_dir,
)

DEFAULT_TEMPLATE_ID = "personal_assistant"
DEFAULT_ASSISTANT_MODEL = "openai/gpt-5"
LOCAL_SESSION_ACTIVE_WINDOW_MS = 90 * 60 * 1000


@dataclass(frozen=True, slots=True)
class SkillCatalogItem:
    id: str
    name: str
    description: str
    author: str
    category: str
    source: str
    is_official: bool = False
    tags: tuple[str, ...] = ()
    path: str | None = None


OFFICIAL_SKILL_CATALOG: tuple[SkillCatalogItem, ...] = (
    SkillCatalogItem(
        id="web_search",
        name="Web Search",
        description="Search the live web and synthesize results into assistant replies.",
        author="mutx",
        category="Research",
        source="catalog",
        is_official=True,
        tags=("web", "search", "research"),
    ),
    SkillCatalogItem(
        id="browser_control",
        name="Browser Control",
        description="Drive a managed browser session for operator workflows and web tasks.",
        author="mutx",
        category="Tools",
        source="catalog",
        is_official=True,
        tags=("browser", "automation"),
    ),
    SkillCatalogItem(
        id="workspace_memory",
        name="Workspace Memory",
        description="Persist working notes and memory into the assistant workspace.",
        author="mutx",
        category="Productivity",
        source="catalog",
        is_official=True,
        tags=("memory", "workspace"),
    ),
    SkillCatalogItem(
        id="inbox_triage",
        name="Inbox Triage",
        description="Summarize, categorize, and draft responses for inbox workflows.",
        author="mutx",
        category="Communication",
        source="catalog",
        is_official=False,
        tags=("email", "triage"),
    ),
    SkillCatalogItem(
        id="cron_manager",
        name="Wakeups And Cron",
        description="Manage timed reminders, recurring check-ins, and wakeup actions.",
        author="mutx",
        category="Automation",
        source="catalog",
        is_official=True,
        tags=("cron", "wakeups", "automation"),
    ),
)

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


def deserialize_config(raw_config: Any) -> dict[str, Any]:
    if isinstance(raw_config, dict):
        return dict(raw_config)
    if isinstance(raw_config, str):
        try:
            parsed = json.loads(raw_config)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return dict(parsed)
    return {}


def serialize_config(config: dict[str, Any]) -> str:
    return json.dumps(config, sort_keys=True)


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


def build_personal_assistant_config(
    *,
    name: str = "Personal Assistant",
    description: str | None = None,
    model: str | None = None,
    workspace: str | None = None,
    skills: list[str] | None = None,
    channels: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    assistant_id = slugify_assistant_id(name)
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
        "assistant_id": assistant_id,
        "workspace": workspace or assistant_id,
        "model": model or DEFAULT_ASSISTANT_MODEL,
        "safety_mode": "pairing",
        "skills": list(dict.fromkeys(skills or ["web_search", "workspace_memory"])),
        "channels": normalized_channels,
        "wakeups": [],
        "metadata": {
            "starter": True,
            "description": description,
            "starter_template": DEFAULT_TEMPLATE_ID,
        },
        "gateway": {
            "port": get_detected_gateway_port() or 18789,
            "auth_mode": "token",
            "dashboard_allowed_origins": [],
        },
    }


def assistant_template_catalog() -> list[dict[str, Any]]:
    default_config = build_personal_assistant_config()
    return [
        {
            "id": DEFAULT_TEMPLATE_ID,
            "name": "Personal Assistant",
            "summary": "Deploy an OpenClaw-backed assistant as the first MUTX agent.",
            "description": (
                "A branded starter template for a single-operator assistant with safe channel "
                "defaults, workspace memory, and a control-plane-friendly runtime surface."
            ),
            "agent_type": AgentType.OPENCLAW,
            "starter_prompt": "Authenticate, deploy the assistant, then connect channels and skills.",
            "default_config": default_config,
        }
    ]


def is_assistant_agent(agent: Agent) -> bool:
    return agent.type == AgentType.OPENCLAW


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def _extract_skill_metadata(skill_file: Path) -> SkillCatalogItem | None:
    text = _read_text(skill_file).strip()
    if not text:
        return None

    first_heading = next(
        (
            line.strip().lstrip("#").strip()
            for line in text.splitlines()
            if line.strip().startswith("#")
        ),
        None,
    )
    description = ""
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("---"):
            continue
        description = stripped
        break

    slug = skill_file.parent.name
    author = skill_file.parent.parent.name if skill_file.parent.parent else "workspace"
    return SkillCatalogItem(
        id=slug,
        name=first_heading or slug.replace("-", " ").title(),
        description=description or "Workspace skill discovered from local OpenClaw state.",
        author=author,
        category="Workspace",
        source="workspace",
        tags=("workspace",),
        path=str(skill_file.parent),
    )


def discover_workspace_skills() -> list[SkillCatalogItem]:
    state_dir = get_detected_openclaw_state_dir()
    if not state_dir:
        return []

    discovered: dict[str, SkillCatalogItem] = {}
    patterns = (
        "workspace*/skills/*/SKILL.md",
        "workspace*/**/skills/*/SKILL.md",
    )
    for pattern in patterns:
        for skill_file in state_dir.glob(pattern):
            metadata = _extract_skill_metadata(skill_file)
            if metadata is not None and metadata.id not in discovered:
                discovered[metadata.id] = metadata
    return sorted(discovered.values(), key=lambda item: item.name.lower())


def list_skill_catalog() -> list[SkillCatalogItem]:
    catalog: dict[str, SkillCatalogItem] = {item.id: item for item in OFFICIAL_SKILL_CATALOG}
    for item in discover_workspace_skills():
        catalog.setdefault(item.id, item)
    return sorted(catalog.values(), key=lambda item: item.name.lower())


def list_installed_skill_ids(agent: Agent) -> list[str]:
    config = deserialize_config(agent.config)
    raw_skills = config.get("skills") or []
    return [str(skill_id) for skill_id in raw_skills if isinstance(skill_id, str)]


def list_assistant_skills(agent: Agent) -> list[dict[str, Any]]:
    installed = set(list_installed_skill_ids(agent))
    entries = []
    for item in list_skill_catalog():
        entries.append(
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "author": item.author,
                "category": item.category,
                "source": item.source,
                "is_official": item.is_official,
                "installed": item.id in installed,
                "tags": list(item.tags),
                "path": item.path,
            }
        )
    return sorted(entries, key=lambda entry: (not entry["installed"], entry["name"].lower()))


def update_assistant_skills(agent: Agent, *, skill_id: str, install: bool) -> dict[str, Any]:
    config = deserialize_config(agent.config)
    skills = list_installed_skill_ids(agent)
    if install and skill_id not in skills:
        skills.append(skill_id)
    if not install:
        skills = [existing for existing in skills if existing != skill_id]
    config["skills"] = skills
    agent.config = serialize_config(config)
    return config


def list_assistant_channels(agent: Agent) -> list[dict[str, Any]]:
    config = deserialize_config(agent.config)
    raw_channels = config.get("channels")
    normalized = default_channel_map()
    if isinstance(raw_channels, dict):
        for channel_id, payload in raw_channels.items():
            existing = normalized.get(
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
            normalized[channel_id] = existing

    return [
        {
            "id": channel_id,
            "label": str(payload.get("label") or channel_id.replace("_", " ").title()),
            "enabled": bool(payload.get("enabled", False)),
            "mode": str(payload.get("mode") or "pairing"),
            "allow_from": [
                str(item) for item in (payload.get("allow_from") or []) if isinstance(item, str)
            ],
        }
        for channel_id, payload in sorted(normalized.items())
    ]


def list_assistant_wakeups(agent: Agent) -> list[dict[str, Any]]:
    config = deserialize_config(agent.config)
    wakeups = config.get("wakeups") or []
    items: list[dict[str, Any]] = []
    for wakeup in wakeups:
        if isinstance(wakeup, dict):
            items.append(
                {
                    "enabled": bool(wakeup.get("enabled", False)),
                    "schedule": wakeup.get("schedule"),
                    "timezone": wakeup.get("timezone"),
                    "label": wakeup.get("label"),
                }
            )
    return items


def _session_store_files() -> list[Path]:
    state_dir = get_detected_openclaw_state_dir()
    if not state_dir:
        return []

    agents_dir = state_dir / "agents"
    if not agents_dir.exists():
        return []

    files: list[Path] = []
    for agent_dir in agents_dir.iterdir():
        sessions_file = agent_dir / "sessions" / "sessions.json"
        if sessions_file.exists() and sessions_file.is_file():
            files.append(sessions_file)
    return files


def _format_tokens(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}m"
    if n >= 1000:
        return f"{round(n / 1000)}k"
    return str(n)


def _format_age(timestamp: int) -> str:
    if not timestamp:
        return "-"
    diff = datetime.now(timezone.utc).timestamp() * 1000 - timestamp
    if diff <= 0:
        return "now"
    mins = int(diff / 60000)
    hours = int(mins / 60)
    days = int(hours / 24)
    if days > 0:
        return f"{days}d"
    if hours > 0:
        return f"{hours}h"
    return f"{mins}m"


def list_gateway_sessions(*, assistant_id: str | None = None) -> list[dict[str, Any]]:
    now = int(datetime.now(timezone.utc).timestamp() * 1000)
    sessions: list[dict[str, Any]] = []
    for sessions_file in _session_store_files():
        agent_name = sessions_file.parent.parent.name
        if assistant_id and agent_name != assistant_id:
            continue
        try:
            payload = json.loads(_read_text(sessions_file))
        except json.JSONDecodeError:
            continue
        if not isinstance(payload, dict):
            continue

        for key, entry in payload.items():
            if not isinstance(entry, dict):
                continue
            updated_at = int(entry.get("updatedAt") or 0)
            total = int(entry.get("totalTokens") or 0)
            context = int(entry.get("contextTokens") or 0)
            pct = round((total / context) * 100) if context > 0 else 0
            sessions.append(
                {
                    "id": entry.get("sessionId") or f"{agent_name}:{key}",
                    "key": str(key),
                    "agent": agent_name,
                    "kind": str(entry.get("chatType") or "unknown"),
                    "age": _format_age(updated_at),
                    "model": str(entry.get("model") or ""),
                    "tokens": f"{_format_tokens(total)}/{_format_tokens(context)} ({pct}%)",
                    "channel": str(
                        (entry.get("deliveryContext") or {}).get("channel")
                        or entry.get("lastChannel")
                        or entry.get("channel")
                        or ""
                    ),
                    "flags": [],
                    "active": (now - updated_at) < LOCAL_SESSION_ACTIVE_WINDOW_MS if updated_at else False,
                    "start_time": updated_at,
                    "last_activity": updated_at,
                    "source": "gateway",
                }
            )
    return sorted(sessions, key=lambda item: item["last_activity"], reverse=True)


def collect_gateway_health() -> dict[str, Any]:
    config_path = get_detected_openclaw_config_path()
    state_dir = get_detected_openclaw_state_dir()
    gateway_port = get_detected_gateway_port()
    gateway_url = f"http://127.0.0.1:{gateway_port}" if gateway_port else None
    cli_available = shutil.which("openclaw") is not None
    credential_detected = bool(get_detected_gateway_token())
    gateway_configured = config_path is not None or (state_dir is not None and state_dir.exists())

    gateway_reachable = False
    if gateway_url:
        try:
            response = httpx.get(f"{gateway_url}/health", timeout=0.75)
            gateway_reachable = response.status_code < 500
        except httpx.HTTPError:
            gateway_reachable = False

    if gateway_reachable:
        status = "healthy"
        doctor_summary = "Gateway is reachable and ready for assistant operations."
    elif gateway_configured and cli_available:
        status = "degraded"
        doctor_summary = "OpenClaw is configured locally, but the gateway is not reachable yet."
    elif gateway_configured:
        status = "degraded"
        doctor_summary = "OpenClaw state is present, but the CLI runtime is not available on this host."
    else:
        status = "missing"
        doctor_summary = "No local OpenClaw runtime was detected. Run onboarding or connect a hosted runtime."

    return {
        "status": status,
        "cli_available": cli_available,
        "gateway_configured": gateway_configured,
        "gateway_reachable": gateway_reachable,
        "gateway_port": gateway_port,
        "gateway_url": gateway_url,
        "credential_detected": credential_detected,
        "config_path": str(config_path) if config_path else None,
        "state_dir": str(state_dir) if state_dir else None,
        "doctor_summary": doctor_summary,
    }


def collect_assistant_overview(agent: Agent, deployments: list[Any]) -> dict[str, Any]:
    config = deserialize_config(agent.config)
    assistant_id = str(config.get("assistant_id") or slugify_assistant_id(agent.name))
    sessions = list_gateway_sessions(assistant_id=assistant_id)
    last_activity = None
    if sessions and sessions[0]["last_activity"]:
        last_activity = datetime.fromtimestamp(
            sessions[0]["last_activity"] / 1000,
            tz=timezone.utc,
        )

    onboarding_status = "ready"
    if not deployments:
        onboarding_status = "needs_deployment"
    elif not sessions:
        onboarding_status = "deployed"

    return {
        "agent_id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "runtime": str(config.get("runtime") or DEFAULT_TEMPLATE_ID),
        "template_id": str(config.get("template") or DEFAULT_TEMPLATE_ID),
        "status": agent.status,
        "onboarding_status": onboarding_status,
        "assistant_id": assistant_id,
        "workspace": str(config.get("workspace") or assistant_id),
        "last_activity": last_activity,
        "session_count": len(sessions),
        "installed_skills": [item for item in list_assistant_skills(agent) if item["installed"]],
        "channels": list_assistant_channels(agent),
        "wakeups": list_assistant_wakeups(agent),
        "gateway": collect_gateway_health(),
        "deployments": deployments,
        "config": config,
    }
