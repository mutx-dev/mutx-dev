from __future__ import annotations

import json
import logging
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from src.api.models import Agent, AgentType
from src.api.services.gateway_runtime import (
    get_detected_gateway_port,
    get_detected_gateway_token,
    get_detected_openclaw_config_path,
    get_detected_openclaw_state_dir,
)

DEFAULT_TEMPLATE_ID = "personal_assistant"
DEFAULT_ASSISTANT_MODEL = "openai/gpt-5"
logger = logging.getLogger(__name__)


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
            "port": 18789,
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


def _candidate_skill_roots() -> list[Path]:
    state_dir = get_detected_openclaw_state_dir()
    roots = [
        Path.home() / ".hermes" / "skills",
        Path.home() / ".openclaw" / "skills",
    ]
    if state_dir is not None:
        roots.extend(
            [
                state_dir / "skills",
                state_dir / "workspace" / "skills",
                state_dir / "workspaces",
            ]
        )

    env_root = os.environ.get("OPENCLAW_SKILLS_DIR")
    if env_root:
        roots.insert(0, Path(env_root).expanduser())

    deduped: list[Path] = []
    seen: set[str] = set()
    for root in roots:
        resolved = str(root.expanduser())
        if resolved not in seen:
            deduped.append(root.expanduser())
            seen.add(resolved)
    return deduped


def discover_workspace_skills() -> list[SkillCatalogItem]:
    discovered: dict[str, SkillCatalogItem] = {}
    for root in _candidate_skill_roots():
        if not root.exists():
            continue
        for skill_file in root.rglob("SKILL.md"):
            item = _extract_skill_metadata(skill_file)
            if item is not None:
                discovered.setdefault(item.id, item)
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


def _normalize_timestamp(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, datetime):
        return int(value.timestamp())
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return 0
        if stripped.isdigit():
            return int(stripped)
        try:
            return int(datetime.fromisoformat(stripped.replace("Z", "+00:00")).timestamp())
        except ValueError:
            return 0
    return 0


def _format_age(last_activity: int, start_time: int) -> str:
    baseline = last_activity or start_time or int(time.time())
    age_seconds = max(0, int(time.time()) - baseline)
    if age_seconds < 60:
        return f"{age_seconds}s"
    if age_seconds < 3600:
        return f"{age_seconds // 60}m"
    if age_seconds < 86400:
        return f"{age_seconds // 3600}h"
    return f"{age_seconds // 86400}d"


def _session_matches_assistant(raw: dict[str, Any], assistant_id: str | None) -> bool:
    if not assistant_id:
        return True

    needle = assistant_id.strip().lower()
    candidates = [
        raw.get("assistant_id"),
        raw.get("assistant"),
        raw.get("agent"),
        raw.get("workspace"),
        raw.get("name"),
        raw.get("key"),
        raw.get("session_key"),
        raw.get("id"),
    ]
    return any(needle in str(candidate).lower() for candidate in candidates if candidate)


def _normalize_flags(raw: dict[str, Any]) -> list[str]:
    flags: list[str] = []
    raw_flags = raw.get("flags")
    if isinstance(raw_flags, list):
        flags.extend(str(flag) for flag in raw_flags if flag)

    for key in ("thinking", "verbose", "reasoning", "label"):
        value = raw.get(key)
        if value in (None, "", False):
            continue
        flags.append(key if value is True else f"{key}:{value}")

    return list(dict.fromkeys(flags))


def _normalize_gateway_session(raw: dict[str, Any]) -> dict[str, Any] | None:
    key = str(
        raw.get("key") or raw.get("session_key") or raw.get("session") or raw.get("id") or ""
    ).strip()
    if not key:
        return None

    start_time = _normalize_timestamp(
        raw.get("start_time") or raw.get("created_at") or raw.get("started_at")
    )
    last_activity = _normalize_timestamp(
        raw.get("last_activity") or raw.get("updated_at") or raw.get("timestamp")
    )
    total_tokens = raw.get("tokens") or raw.get("total_tokens")
    if total_tokens is None:
        input_tokens = int(raw.get("input_tokens") or 0)
        output_tokens = int(raw.get("output_tokens") or 0)
        total_tokens = input_tokens + output_tokens if input_tokens or output_tokens else ""

    status = str(raw.get("status") or "").lower()
    active = bool(raw.get("active", status in {"active", "running", "open", "available"}))
    agent = str(
        raw.get("agent")
        or raw.get("assistant")
        or raw.get("assistant_id")
        or raw.get("workspace")
        or "unknown"
    )

    return {
        "id": str(raw.get("id") or key),
        "key": key,
        "agent": agent,
        "kind": str(raw.get("kind") or raw.get("type") or "session"),
        "age": _format_age(last_activity, start_time),
        "model": str(raw.get("model") or raw.get("provider_model") or "unknown"),
        "tokens": str(total_tokens),
        "channel": str(raw.get("channel") or raw.get("source") or "direct"),
        "flags": _normalize_flags(raw),
        "active": active,
        "start_time": start_time,
        "last_activity": last_activity or start_time,
        "source": str(raw.get("source") or "openclaw"),
    }


def _gateway_base_url() -> tuple[int | None, str | None]:
    port = get_detected_gateway_port()
    host = os.environ.get("OPENCLAW_GATEWAY_HOST", "127.0.0.1")
    if port is None:
        return None, None
    return port, f"http://{host}:{port}"


def _gateway_headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    token = get_detected_gateway_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _request_gateway_json(paths: tuple[str, ...]) -> Any | None:
    _port, base_url = _gateway_base_url()
    if not base_url:
        return None

    for path in paths:
        request = urllib.request.Request(f"{base_url}{path}", headers=_gateway_headers())
        try:
            with urllib.request.urlopen(request, timeout=3) as response:
                payload = response.read().decode("utf-8")
                if not payload:
                    return None
                return json.loads(payload)
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                continue
            logger.debug("Gateway request failed for %s: %s", path, exc)
            return None
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.debug("Gateway request failed for %s: %s", path, exc)
            return None
    return None


def _load_sessions_from_json_store(
    state_dir: Path,
    assistant_id: str | None = None,
) -> list[dict[str, Any]]:
    agents_dir = state_dir / "agents"
    if not agents_dir.exists():
        return []

    discovered: list[dict[str, Any]] = []
    for agent_dir in agents_dir.iterdir():
        sessions_file = agent_dir / "sessions" / "sessions.json"
        if not sessions_file.is_file():
            continue

        agent_name = agent_dir.name
        if assistant_id and agent_name != assistant_id:
            continue

        try:
            payload = json.loads(sessions_file.read_text())
        except (OSError, json.JSONDecodeError):
            continue

        if not isinstance(payload, dict):
            continue

        for key, entry in payload.items():
            if not isinstance(entry, dict):
                continue

            updated_at = _normalize_timestamp(
                entry.get("updatedAt") or entry.get("updated_at") or entry.get("last_activity")
            )
            created_at = _normalize_timestamp(
                entry.get("startedAt")
                or entry.get("createdAt")
                or entry.get("created_at")
                or updated_at
            )
            channel = (
                (entry.get("deliveryContext") or {}).get("channel")
                or entry.get("lastChannel")
                or entry.get("channel")
                or "direct"
            )
            total_tokens = entry.get("totalTokens")
            if total_tokens is None:
                total_tokens = int(entry.get("inputTokens") or 0) + int(entry.get("outputTokens") or 0)

            raw = {
                "id": entry.get("sessionId") or f"{agent_name}:{key}",
                "key": str(key),
                "assistant_id": agent_name,
                "agent": agent_name,
                "kind": entry.get("chatType") or entry.get("kind") or "session",
                "created_at": created_at,
                "updated_at": updated_at,
                "model": entry.get("model"),
                "channel": channel,
                "total_tokens": total_tokens,
                "active": bool(updated_at and (int(time.time()) - updated_at) < (90 * 60)),
                "source": "openclaw-local",
            }
            normalized = _normalize_gateway_session(raw)
            if normalized is not None:
                discovered.append(normalized)

    return discovered


def _load_sessions_from_state_dir(assistant_id: str | None = None) -> list[dict[str, Any]]:
    state_dir = get_detected_openclaw_state_dir()
    if state_dir is None or not state_dir.exists():
        return []

    discovered: list[dict[str, Any]] = _load_sessions_from_json_store(state_dir, assistant_id)

    candidates = [
        state_dir / "sessions",
        state_dir / "gateway" / "sessions",
        state_dir / "state" / "sessions",
    ]
    for root in candidates:
        if not root.exists():
            continue
        for path in root.rglob("*.json*"):
            try:
                stat = path.stat()
            except OSError:
                continue
            raw = {
                "id": path.stem,
                "key": path.stem,
                "assistant_id": assistant_id or root.name,
                "agent": assistant_id or root.name,
                "kind": path.suffix.lstrip(".") or "session",
                "created_at": int(stat.st_ctime),
                "updated_at": int(stat.st_mtime),
                "source": "openclaw-state",
            }
            if not _session_matches_assistant(raw, assistant_id):
                continue
            normalized = _normalize_gateway_session(raw)
            if normalized is not None:
                discovered.append(normalized)

    deduped: dict[str, dict[str, Any]] = {}
    for session in discovered:
        key = str(session.get("key") or session.get("id") or "")
        if not key:
            continue
        existing = deduped.get(key)
        if existing is None or session.get("last_activity", 0) >= existing.get("last_activity", 0):
            deduped[key] = session

    return sorted(deduped.values(), key=lambda item: item.get("last_activity", 0), reverse=True)


def list_gateway_sessions(*, assistant_id: str | None = None) -> list[dict[str, Any]]:
    payload = _request_gateway_json(("/api/sessions", "/sessions"))
    raw_sessions: list[dict[str, Any]] = []

    if isinstance(payload, dict):
        items = payload.get("sessions") or payload.get("items") or payload.get("data") or []
        if isinstance(items, list):
            raw_sessions = [item for item in items if isinstance(item, dict)]
    elif isinstance(payload, list):
        raw_sessions = [item for item in payload if isinstance(item, dict)]

    sessions = [
        normalized
        for normalized in (
            _normalize_gateway_session(item)
            for item in raw_sessions
            if _session_matches_assistant(item, assistant_id)
        )
        if normalized is not None
    ]

    if not sessions:
        sessions = _load_sessions_from_state_dir(assistant_id)

    sessions.sort(key=lambda item: item.get("last_activity", 0), reverse=True)
    return sessions


def collect_gateway_health() -> dict[str, Any]:
    config_path = get_detected_openclaw_config_path()
    detected_state_dir = get_detected_openclaw_state_dir()
    state_dir = detected_state_dir if detected_state_dir and detected_state_dir.exists() else None
    port, gateway_url = _gateway_base_url()
    credential_detected = bool(get_detected_gateway_token())
    gateway_reachable = _request_gateway_json(("/health", "/api/health")) is not None
    gateway_configured = any([config_path, credential_detected, port is not None])
    cli_available = config_path is not None or state_dir is not None

    if gateway_reachable:
        status = "healthy"
        doctor_summary = "OpenClaw gateway is reachable and returning health data."
    elif gateway_configured:
        status = "configured"
        doctor_summary = (
            "OpenClaw configuration was detected, but the local gateway is not reachable from this process. "
            "Start the operator runtime or check gateway auth and port settings."
        )
    else:
        status = "client_required"
        doctor_summary = (
            "Local OpenClaw runtime state is resolved from the operator host. "
            "Use the MUTX CLI or TUI on that machine to inspect live health and sessions."
        )

    return {
        "status": status,
        "cli_available": cli_available,
        "gateway_configured": gateway_configured,
        "gateway_reachable": gateway_reachable,
        "gateway_port": port,
        "gateway_url": gateway_url,
        "credential_detected": credential_detected,
        "config_path": str(config_path) if config_path else None,
        "state_dir": str(state_dir) if state_dir else None,
        "doctor_summary": doctor_summary,
    }


def collect_assistant_overview(agent: Agent, deployments: list[Any]) -> dict[str, Any]:
    config = deserialize_config(agent.config)
    assistant_id = str(config.get("assistant_id") or slugify_assistant_id(agent.name))
    onboarding_status = "needs_deployment" if not deployments else "deployed"

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
        "last_activity": None,
        "session_count": 0,
        "installed_skills": [item for item in list_assistant_skills(agent) if item["installed"]],
        "channels": list_assistant_channels(agent),
        "wakeups": list_assistant_wakeups(agent),
        "gateway": collect_gateway_health(),
        "deployments": deployments,
        "config": config,
    }
