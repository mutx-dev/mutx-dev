from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from worktree_utils import first_valid_worktree


PRIORITY_ORDER = {"p0": 0, "p1": 1, "p2": 2, "p3": 3, "p4": 4}

BACKEND_AREAS = {"backend", "api", "auth", "runtime", "infra", "ops", "cli-sdk"}
FRONTEND_AREAS = {"frontend", "web", "ui", "dashboard", "site"}

AREA_TO_LANE = {
    "api": "codex",
    "auth": "codex",
    "runtime": "codex",
    "infra": "codex",
    "ops": "codex",
    "cli-sdk": "codex",
    "backend": "codex",
    "web": "opencode",
    "frontend": "opencode",
    "dashboard": "opencode",
    "site": "opencode",
    "ui": "opencode",
}

LANE_FILE_SCOPE = {
    "codex": ["src/api/", "src/security/", "cli/", "sdk/mutx/", "tests/", "scripts/"],
    "opencode": ["app/", "components/", "lib/", "public/", "tests/", "scripts/"],
    "main": ["docs/", "scripts/autonomy/", "agents/registry.yml", "reports/"],
}

LANE_VERIFICATION_DEFAULTS = {
    "codex": ["pytest tests/api -q"],
    "opencode": ["npm run lint", "npm run build"],
    "main": ["python -m compileall scripts/autonomy"],
}


@dataclass(slots=True)
class LanePaths:
    repo_root: str
    backend_worktree: str
    frontend_worktree: str
    backend_candidates: list[str] = field(default_factory=list)
    frontend_candidates: list[str] = field(default_factory=list)


@dataclass(slots=True)
class WorkOrder:
    id: str
    title: str
    description: str
    lane: str
    runner: str
    priority: str
    worktree: str
    allowed_paths: list[str]
    verification: list[str]
    constraints: list[str]
    source: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _normalize_area(value: str | None) -> str:
    raw = (value or "backend").lower().strip()
    if raw.startswith("area:"):
        raw = raw.split(":", 1)[1]
    return raw


def choose_lane(area: str | None) -> str:
    normalized = _normalize_area(area)
    return AREA_TO_LANE.get(normalized, "codex")


def choose_runner(lane: str) -> str:
    if lane == "main":
        return "main"
    if lane == "opencode":
        return "opencode"
    return "codex"


def choose_worktree(lane: str, paths: LanePaths) -> str:
    if lane == "opencode":
        candidates = paths.frontend_candidates or [paths.frontend_worktree]
        return first_valid_worktree(candidates) or paths.frontend_worktree
    candidates = paths.backend_candidates or [paths.backend_worktree]
    return first_valid_worktree(candidates) or paths.backend_worktree


def choose_allowed_paths(lane: str, item: dict[str, Any]) -> list[str]:
    explicit = item.get("allowed_paths")
    if isinstance(explicit, list) and explicit:
        return [str(path) for path in explicit]
    return list(LANE_FILE_SCOPE.get(lane, []))


def choose_verification(lane: str, item: dict[str, Any]) -> list[str]:
    explicit = item.get("verification")
    if isinstance(explicit, list) and explicit:
        return [str(cmd) for cmd in explicit]
    if isinstance(item.get("verification"), str) and item.get("verification").strip():
        return [str(item["verification"]).strip()]
    return list(LANE_VERIFICATION_DEFAULTS.get(lane, []))


def default_constraints(lane: str) -> list[str]:
    base = [
        "max_changed_files=6",
        "no unrelated file edits",
        "must report verification results",
    ]
    if lane == "codex":
        base.append("prefer backend/API/runtime scope only")
    if lane == "opencode":
        base.append("prefer dashboard/site/frontend scope only")
    return base


def build_work_order(item: dict[str, Any], paths: LanePaths) -> WorkOrder:
    area = item.get("area")
    lane = item.get("lane") or choose_lane(area)
    runner = item.get("runner") or choose_runner(lane)
    metadata = {
        "area": _normalize_area(area),
        "labels": item.get("labels", []),
        "issue": item.get("issue"),
        "owner_role": item.get("owner_role"),
        "role_lane": item.get("role_lane"),
        "score": item.get("score"),
        "scheduling_reason": item.get("scheduling_reason"),
    }
    return WorkOrder(
        id=str(item.get("id") or item.get("issue") or "task-unknown"),
        title=str(item.get("title") or "Untitled task").strip(),
        description=str(item.get("description") or "").strip(),
        lane=lane,
        runner=runner,
        priority=str(item.get("priority") or "p2"),
        worktree=choose_worktree(lane, paths),
        allowed_paths=choose_allowed_paths(lane, item),
        verification=choose_verification(lane, item),
        constraints=list(item.get("constraints") or default_constraints(lane)),
        source=str(item.get("source") or "queue"),
        metadata=metadata,
    )


def queued_items_in_priority_order(queue: dict[str, Any]) -> list[dict[str, Any]]:
    items = queue.get("items", [])
    queued = [item for item in items if item.get("status", "queued") == "queued"]
    queued.sort(
        key=lambda item: (
            PRIORITY_ORDER.get(str(item.get("priority") or "p3").lower(), 99),
            -int(item.get("score") or 0),
            str(item.get("owner_role") or "zzz"),
            str(item.get("id") or item.get("title") or "zzz"),
        )
    )
    return queued


def select_next_item(queue: dict[str, Any]) -> dict[str, Any] | None:
    queued = queued_items_in_priority_order(queue)
    if not queued:
        return None
    return queued[0]


def _split_candidates(raw: str) -> list[str]:
    return [item for item in (part.strip() for part in raw.split(":")) if item]


def _paths_from_args(args: argparse.Namespace) -> LanePaths:
    return LanePaths(
        repo_root=args.repo_root,
        backend_worktree=args.backend_worktree,
        frontend_worktree=args.frontend_worktree,
        backend_candidates=_split_candidates(args.backend_candidates),
        frontend_candidates=_split_candidates(args.frontend_candidates),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a normalized work order for a MUTX autonomy lane")
    parser.add_argument("input", help="Path to queue JSON or single task JSON")
    parser.add_argument("--repo-root", default="/Users/fortune/MUTX")
    parser.add_argument("--backend-worktree", default="/Users/fortune/mutx-worktrees/autonomy/codex-main")
    parser.add_argument("--frontend-worktree", default="/Users/fortune/mutx-worktrees/autonomy/opencode-main")
    parser.add_argument(
        "--backend-candidates",
        default="/Users/fortune/mutx-worktrees/autonomy/codex-main:/Users/fortune/mutx-worktrees/engineering/control-plane-steward:/Users/fortune/mutx-worktrees/factory/backend",
    )
    parser.add_argument(
        "--frontend-candidates",
        default="/Users/fortune/mutx-worktrees/autonomy/opencode-main:/Users/fortune/mutx-worktrees/engineering/operator-surface-builder:/Users/fortune/mutx-worktrees/factory/frontend",
    )
    parser.add_argument("--pick-next", action="store_true", help="Input file is a queue; select the next queued item")
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text())
    if args.pick_next:
        item = select_next_item(payload)
        if item is None:
            print(json.dumps({"status": "idle"}, indent=2))
            return 0
    else:
        item = payload

    work_order = build_work_order(item, _paths_from_args(args))
    print(json.dumps(work_order.to_dict(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
