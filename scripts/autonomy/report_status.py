from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ALLOWED_STATUSES = {
    "queued",
    "running",
    "blocked",
    "failed",
    "ready_for_review",
    "merged",
    "parked",
    "completed",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_status(value: str) -> str:
    status = value.strip().lower().replace("-", "_")
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"Unsupported status: {value}")
    return status


def build_report(
    *,
    task_id: str,
    lane: str,
    status: str,
    summary: str = "",
    worktree: str = "",
    changed_files: list[str] | None = None,
    verification: list[dict[str, Any]] | None = None,
    blocker_class: str | None = None,
    next_action: str | None = None,
    pr_ref: str | None = None,
    handoff: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "task_id": task_id,
        "lane": lane,
        "status": normalize_status(status),
        "summary": summary,
        "worktree": worktree,
        "changed_files": changed_files or [],
        "verification": verification or [],
        "blocker_class": blocker_class,
        "next_action": next_action,
        "pr_ref": pr_ref,
        "handoff": handoff,
        "updated_at": utc_now_iso(),
    }


def append_jsonl(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Write a normalized MUTX lane status report")
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--lane", required=True)
    parser.add_argument("--status", required=True)
    parser.add_argument("--summary", default="")
    parser.add_argument("--worktree", default="")
    parser.add_argument("--changed-file", action="append", default=[])
    parser.add_argument("--verification-json", default="[]")
    parser.add_argument("--blocker-class")
    parser.add_argument("--next-action")
    parser.add_argument("--pr-ref")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    verification = json.loads(args.verification_json)
    payload = build_report(
        task_id=args.task_id,
        lane=args.lane,
        status=args.status,
        summary=args.summary,
        worktree=args.worktree,
        changed_files=args.changed_file,
        verification=verification,
        blocker_class=args.blocker_class,
        next_action=args.next_action,
        pr_ref=args.pr_ref,
    )
    append_jsonl(Path(args.output), payload)
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
