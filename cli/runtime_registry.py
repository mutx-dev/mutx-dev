from __future__ import annotations

import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


WIZARD_STEPS: tuple[dict[str, str], ...] = (
    {"id": "auth", "title": "Authenticate operator"},
    {"id": "provider", "title": "Select provider"},
    {"id": "install", "title": "Install runtime"},
    {"id": "onboard", "title": "Onboard gateway"},
    {"id": "track", "title": "Track local runtime"},
    {"id": "bind", "title": "Bind assistant"},
    {"id": "deploy", "title": "Deploy starter assistant"},
    {"id": "verify", "title": "Verify local health"},
)

PROVIDER_CATALOG: tuple[dict[str, Any], ...] = (
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


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def mutx_home_dir() -> Path:
    return Path(os.environ.get("MUTX_HOME", "~/.mutx")).expanduser()


def providers_root() -> Path:
    return mutx_home_dir() / "providers"


def provider_root(provider: str) -> Path:
    return providers_root() / provider


def provider_bindings_dir(provider: str) -> Path:
    return provider_root(provider) / "bindings"


def provider_pointers_dir(provider: str) -> Path:
    return provider_root(provider) / "pointers"


def provider_manifest_path(provider: str) -> Path:
    return provider_root(provider) / "manifest.json"


def provider_wizard_state_path(provider: str) -> Path:
    return provider_root(provider) / "wizard-state.json"


def ensure_provider_registry(provider: str) -> Path:
    root = provider_root(provider)
    (root / "bindings").mkdir(parents=True, exist_ok=True)
    (root / "pointers").mkdir(parents=True, exist_ok=True)
    return root


def _read_json_file(path: Path, *, default: dict[str, Any] | None = None) -> dict[str, Any]:
    if not path.exists():
        return dict(default or {})
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return dict(default or {})
    if isinstance(payload, dict):
        return payload
    return dict(default or {})


def _write_json_file(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def _relative_target(target: Path, base: Path) -> str:
    try:
        return os.path.relpath(target, start=base.parent)
    except ValueError:
        return str(target)


def _remove_pointer_path(path: Path) -> None:
    if path.is_symlink() or path.is_file():
        path.unlink(missing_ok=True)
        return
    if path.exists() and path.is_dir():
        shutil.rmtree(path)


def write_pointer(provider: str, name: str, target: str | Path | None) -> None:
    if not target:
        return
    target_path = Path(target).expanduser()
    link_path = provider_pointers_dir(provider) / name
    link_path.parent.mkdir(parents=True, exist_ok=True)

    if link_path.exists() or link_path.is_symlink():
        _remove_pointer_path(link_path)

    try:
        os.symlink(_relative_target(target_path, link_path), link_path)
    except FileExistsError:
        _remove_pointer_path(link_path)
        os.symlink(_relative_target(target_path, link_path), link_path)
    except OSError:
        _remove_pointer_path(link_path)
        link_path.write_text(str(target_path), encoding="utf-8")


def provider_catalog() -> list[dict[str, Any]]:
    return [dict(item) for item in PROVIDER_CATALOG]


def default_wizard_state(*, provider: str = "openclaw") -> dict[str, Any]:
    return {
        "provider": provider,
        "status": "pending",
        "mode": None,
        "action_type": None,
        "import_source": {},
        "current_step": WIZARD_STEPS[0]["id"],
        "completed_steps": [],
        "failed_step": None,
        "last_error": None,
        "checklist_dismissed": False,
        "assistant_name": None,
        "assistant_id": None,
        "workspace": None,
        "gateway_url": None,
        "updated_at": _utcnow(),
        "steps": [
            {"id": item["id"], "title": item["title"], "completed": False} for item in WIZARD_STEPS
        ],
        "providers": provider_catalog(),
    }


def load_wizard_state(provider: str = "openclaw") -> dict[str, Any]:
    state = _read_json_file(
        provider_wizard_state_path(provider), default=default_wizard_state(provider=provider)
    )
    if not state:
        state = default_wizard_state(provider=provider)
    completed_steps = state.get("completed_steps")
    if not isinstance(completed_steps, list):
        completed_steps = []
    normalized_steps = []
    completed_lookup = {str(step_id) for step_id in completed_steps}
    for step in WIZARD_STEPS:
        normalized_steps.append(
            {
                "id": step["id"],
                "title": step["title"],
                "completed": step["id"] in completed_lookup,
            }
        )
    state["steps"] = normalized_steps
    state["providers"] = provider_catalog()
    return state


def save_wizard_state(provider: str, state: dict[str, Any]) -> dict[str, Any]:
    ensure_provider_registry(provider)
    payload = default_wizard_state(provider=provider)
    payload.update(state)
    completed_steps = []
    for step in payload.get("completed_steps") or []:
        step_id = str(step)
        if any(item["id"] == step_id for item in WIZARD_STEPS) and step_id not in completed_steps:
            completed_steps.append(step_id)
    payload["completed_steps"] = completed_steps
    payload["updated_at"] = _utcnow()
    payload["steps"] = [
        {
            "id": item["id"],
            "title": item["title"],
            "completed": item["id"] in completed_steps,
        }
        for item in WIZARD_STEPS
    ]
    payload["providers"] = provider_catalog()
    _write_json_file(provider_wizard_state_path(provider), payload)
    return payload


def reset_wizard_state(provider: str = "openclaw", *, mode: str | None = None) -> dict[str, Any]:
    state = default_wizard_state(provider=provider)
    if mode:
        state["mode"] = mode
    return save_wizard_state(provider, state)


def update_wizard_progress(
    provider: str,
    *,
    step_id: str | None = None,
    status: str | None = None,
    mode: str | None = None,
    assistant_name: str | None = None,
    assistant_id: str | None = None,
    workspace: str | None = None,
    gateway_url: str | None = None,
    last_error: str | None = None,
    checklist_dismissed: bool | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    state = load_wizard_state(provider)
    if step_id:
        state["current_step"] = step_id
    if status:
        state["status"] = status
    if mode:
        state["mode"] = mode
    if assistant_name is not None:
        state["assistant_name"] = assistant_name
    if assistant_id is not None:
        state["assistant_id"] = assistant_id
    if workspace is not None:
        state["workspace"] = workspace
    if gateway_url is not None:
        state["gateway_url"] = gateway_url
    if last_error is not None:
        state["last_error"] = last_error
    if checklist_dismissed is not None:
        state["checklist_dismissed"] = checklist_dismissed
    if extra:
        state.update(extra)
    return save_wizard_state(provider, state)


def complete_wizard_step(
    provider: str,
    step_id: str,
    *,
    mode: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    state = load_wizard_state(provider)
    completed_steps = [str(item) for item in state.get("completed_steps") or []]
    if step_id not in completed_steps:
        completed_steps.append(step_id)

    current_step = step_id
    for step in WIZARD_STEPS:
        if step["id"] not in completed_steps:
            current_step = step["id"]
            break
    else:
        current_step = WIZARD_STEPS[-1]["id"]

    state.update(extra or {})
    state["completed_steps"] = completed_steps
    state["current_step"] = current_step
    state["status"] = "completed" if len(completed_steps) == len(WIZARD_STEPS) else "in_progress"
    state["failed_step"] = None
    state["last_error"] = None
    if mode:
        state["mode"] = mode
    return save_wizard_state(provider, state)


def fail_wizard_step(
    provider: str,
    step_id: str,
    *,
    error: str,
    mode: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    state = load_wizard_state(provider)
    state.update(extra or {})
    state["status"] = "failed"
    state["current_step"] = step_id
    state["failed_step"] = step_id
    state["last_error"] = error
    if mode:
        state["mode"] = mode
    return save_wizard_state(provider, state)


def complete_wizard(
    provider: str, *, mode: str | None = None, extra: dict[str, Any] | None = None
) -> dict[str, Any]:
    state = load_wizard_state(provider)
    state.update(extra or {})
    state["completed_steps"] = [item["id"] for item in WIZARD_STEPS]
    state["current_step"] = WIZARD_STEPS[-1]["id"]
    state["status"] = "completed"
    state["failed_step"] = None
    state["last_error"] = None
    if mode:
        state["mode"] = mode
    return save_wizard_state(provider, state)


def load_manifest(provider: str) -> dict[str, Any]:
    return _read_json_file(provider_manifest_path(provider))


def save_manifest(provider: str, payload: dict[str, Any]) -> dict[str, Any]:
    ensure_provider_registry(provider)
    _write_json_file(provider_manifest_path(provider), payload)
    return payload


def save_binding(provider: str, assistant_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    ensure_provider_registry(provider)
    path = provider_bindings_dir(provider) / f"{assistant_id}.json"
    _write_json_file(path, payload)
    workspace = payload.get("workspace")
    if isinstance(workspace, str) and workspace.strip():
        write_pointer(provider, f"workspaces/{assistant_id}", workspace)
    return payload


def load_binding(provider: str, assistant_id: str) -> dict[str, Any]:
    path = provider_bindings_dir(provider) / f"{assistant_id}.json"
    return _read_json_file(path)


def list_bindings(provider: str) -> list[dict[str, Any]]:
    bindings_dir = provider_bindings_dir(provider)
    if not bindings_dir.exists():
        return []
    payloads: list[dict[str, Any]] = []
    for path in sorted(bindings_dir.glob("*.json")):
        payload = _read_json_file(path)
        if payload:
            payloads.append(payload)
    return payloads


def list_registered_providers() -> list[dict[str, Any]]:
    root = providers_root()
    if not root.exists():
        return []
    items: list[dict[str, Any]] = []
    for provider_dir in sorted(root.iterdir()):
        if not provider_dir.is_dir():
            continue
        manifest = load_manifest(provider_dir.name)
        if not manifest:
            continue
        items.append(manifest)
    return items
