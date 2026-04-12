from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

CATALOG_PATH = Path(__file__).resolve().parents[1] / 'data' / 'orchestra_research_catalog.json'
DEFAULT_MUTX_SKILLS_DIR = Path.home() / '.mutx' / 'skills'


def _load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


@lru_cache(maxsize=1)
def load_orchestra_research_catalog() -> dict[str, Any]:
    return _load_json(CATALOG_PATH)


def orchestra_source() -> dict[str, Any]:
    source = load_orchestra_research_catalog().get('source')
    return source if isinstance(source, dict) else {}


def orchestra_skills() -> list[dict[str, Any]]:
    items = load_orchestra_research_catalog().get('skills') or []
    return [item for item in items if isinstance(item, dict)]


def orchestra_skill_map() -> dict[str, dict[str, Any]]:
    return {
        str(item.get('id')): item
        for item in orchestra_skills()
        if isinstance(item.get('id'), str) and item.get('id')
    }


def orchestra_bundles() -> list[dict[str, Any]]:
    items = load_orchestra_research_catalog().get('bundles') or []
    return [item for item in items if isinstance(item, dict)]


def orchestra_bundle_map() -> dict[str, dict[str, Any]]:
    return {
        str(item.get('id')): item
        for item in orchestra_bundles()
        if isinstance(item.get('id'), str) and item.get('id')
    }


def orchestra_swarm_blueprints() -> list[dict[str, Any]]:
    items = load_orchestra_research_catalog().get('swarm_blueprints') or []
    return [item for item in items if isinstance(item, dict)]


def orchestra_templates() -> list[dict[str, Any]]:
    items = load_orchestra_research_catalog().get('templates') or []
    return [item for item in items if isinstance(item, dict)]


def orchestra_template_map() -> dict[str, dict[str, Any]]:
    return {
        str(item.get('id')): item
        for item in orchestra_templates()
        if isinstance(item.get('id'), str) and item.get('id')
    }


def managed_skill_roots() -> list[Path]:
    raw_roots = []
    env_root = os.environ.get('MUTX_SKILLS_DIR')
    if env_root:
        raw_roots.append(Path(env_root).expanduser())
    raw_roots.append(DEFAULT_MUTX_SKILLS_DIR)

    deduped: list[Path] = []
    seen: set[str] = set()
    for root in raw_roots:
        resolved = str(root.expanduser())
        if resolved in seen:
            continue
        deduped.append(root.expanduser())
        seen.add(resolved)
    return deduped
