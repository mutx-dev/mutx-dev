from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


TERMINAL_STATUSES = {"completed", "failed", "blocked", "parked", "merged"}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_queue(path: str | Path) -> dict[str, Any]:
    return json.loads(Path(path).read_text())


def save_queue(path: str | Path, queue: dict[str, Any]) -> None:
    Path(path).write_text(json.dumps(queue, indent=2, sort_keys=False) + "\n")


def find_item(queue: dict[str, Any], task_id: str) -> dict[str, Any] | None:
    for item in queue.get("items", []):
        if str(item.get("id")) == str(task_id):
            return item
    return None


def set_status(
    queue: dict[str, Any],
    task_id: str,
    status: str,
    *,
    lane: str | None = None,
    runner: str | None = None,
    note: str | None = None,
    work_order_path: str | None = None,
) -> dict[str, Any]:
    item = find_item(queue, task_id)
    if item is None:
        raise KeyError(f"Task not found: {task_id}")
    item["status"] = status
    item["updated_at"] = utc_now_iso()
    if lane:
        item["lane"] = lane
    if runner:
        item["runner"] = runner
    if work_order_path:
        item["work_order_path"] = work_order_path
    if note:
        notes = item.setdefault("notes", [])
        if isinstance(notes, list):
            notes.append({"ts": utc_now_iso(), "message": note})
    if status in TERMINAL_STATUSES:
        item["completed_at"] = utc_now_iso()
    return item
