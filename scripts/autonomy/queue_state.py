from __future__ import annotations

import fcntl
import json
import os
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator


TERMINAL_STATUSES = {'completed', 'failed', 'blocked', 'parked', 'merged'}
CLAIMABLE_STATUSES = {'queued'}
LEASE_CLEARED_STATUSES = TERMINAL_STATUSES | {'queued'}
DEFAULT_LEASE_SECONDS = 1800


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    except ValueError:
        return None


def lease_expiry_iso(*, lease_seconds: int, now: datetime | None = None) -> str:
    current = now or datetime.now(timezone.utc)
    return (current + timedelta(seconds=max(1, int(lease_seconds)))).isoformat().replace('+00:00', 'Z')


def load_queue(path: str | Path) -> dict[str, Any]:
    return json.loads(Path(path).read_text())


def save_queue(path: str | Path, queue: dict[str, Any]) -> None:
    Path(path).write_text(json.dumps(queue, indent=2, sort_keys=False) + '\n')


@contextmanager
def queue_lock(path: str | Path) -> Iterator[Path]:
    lock_path = Path(path).with_suffix(Path(path).suffix + '.lock')
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open('a+', encoding='utf-8') as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield Path(path)
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def find_item(queue: dict[str, Any], task_id: str) -> dict[str, Any] | None:
    for item in queue.get('items', []):
        if str(item.get('id')) == str(task_id):
            return item
    return None


def active_lease(item: dict[str, Any], *, now: datetime | None = None) -> dict[str, Any] | None:
    lease = item.get('lease')
    if not isinstance(lease, dict):
        return None
    expires_at = parse_iso(str(lease.get('expires_at') or ''))
    if expires_at is None:
        return None
    current = now or datetime.now(timezone.utc)
    if expires_at <= current:
        return None
    return lease


def is_lease_active(item: dict[str, Any], *, now: datetime | None = None) -> bool:
    return active_lease(item, now=now) is not None


def lease_matches(item: dict[str, Any], *, lease_id: str | None, holder: str | None) -> bool:
    lease = active_lease(item)
    if lease is None:
        return False
    return str(lease.get('lease_id') or '') == str(lease_id or '') and str(lease.get('holder') or '') == str(holder or '')


def _build_lease(
    *,
    holder: str,
    lease_seconds: int,
    lane: str | None = None,
    runner: str | None = None,
    worktree: str | None = None,
    work_order_path: str | None = None,
    lease_id: str | None = None,
) -> dict[str, Any]:
    current = datetime.now(timezone.utc)
    return {
        'lease_id': lease_id or str(uuid.uuid4()),
        'holder': holder,
        'claimed_at': current.isoformat().replace('+00:00', 'Z'),
        'heartbeat_at': current.isoformat().replace('+00:00', 'Z'),
        'expires_at': lease_expiry_iso(lease_seconds=lease_seconds, now=current),
        'lane': lane,
        'runner': runner,
        'worktree': worktree,
        'work_order_path': work_order_path,
        'pid': os.getpid(),
    }


def claim_task(
    path: str | Path,
    task_id: str,
    *,
    holder: str,
    lease_seconds: int = DEFAULT_LEASE_SECONDS,
    lane: str | None = None,
    runner: str | None = None,
    worktree: str | None = None,
    work_order_path: str | None = None,
    note: str | None = None,
    expected_statuses: tuple[str, ...] = ('queued',),
) -> dict[str, Any]:
    with queue_lock(path):
        queue = load_queue(path)
        item = find_item(queue, task_id)
        if item is None:
            return {'status': 'missing', 'task_id': task_id}
        active = active_lease(item)
        if active is not None and str(active.get('holder') or '') != holder:
            return {
                'status': 'claimed',
                'task_id': task_id,
                'lease': active,
                'reason': 'lease_active',
            }
        status = str(item.get('status') or 'queued')
        if expected_statuses and status not in expected_statuses:
            return {
                'status': 'blocked',
                'task_id': task_id,
                'task_status': status,
                'reason': 'unexpected_status',
            }
        item['lease'] = _build_lease(
            holder=holder,
            lease_seconds=lease_seconds,
            lane=lane or item.get('lane'),
            runner=runner or item.get('runner'),
            worktree=worktree,
            work_order_path=work_order_path,
        )
        item['updated_at'] = utc_now_iso()
        if lane:
            item['lane'] = lane
        if runner:
            item['runner'] = runner
        if work_order_path:
            item['work_order_path'] = work_order_path
        if note:
            notes = item.setdefault('notes', [])
            if isinstance(notes, list):
                notes.append({'ts': utc_now_iso(), 'message': note})
        save_queue(path, queue)
        return {'status': 'claimed', 'task_id': task_id, 'lease': item['lease'], 'item': item}


def renew_task_claim(
    path: str | Path,
    task_id: str,
    *,
    lease_id: str,
    holder: str,
    lease_seconds: int = DEFAULT_LEASE_SECONDS,
) -> dict[str, Any]:
    with queue_lock(path):
        queue = load_queue(path)
        item = find_item(queue, task_id)
        if item is None:
            return {'status': 'missing', 'task_id': task_id}
        if not lease_matches(item, lease_id=lease_id, holder=holder):
            return {'status': 'mismatch', 'task_id': task_id, 'reason': 'lease_mismatch'}
        lease = item['lease']
        current = datetime.now(timezone.utc)
        lease['heartbeat_at'] = current.isoformat().replace('+00:00', 'Z')
        lease['expires_at'] = lease_expiry_iso(lease_seconds=lease_seconds, now=current)
        item['updated_at'] = utc_now_iso()
        save_queue(path, queue)
        return {'status': 'renewed', 'task_id': task_id, 'lease': lease}


def release_task_claim(
    path: str | Path,
    task_id: str,
    *,
    lease_id: str,
    holder: str,
    note: str | None = None,
) -> dict[str, Any]:
    with queue_lock(path):
        queue = load_queue(path)
        item = find_item(queue, task_id)
        if item is None:
            return {'status': 'missing', 'task_id': task_id}
        if not lease_matches(item, lease_id=lease_id, holder=holder):
            return {'status': 'mismatch', 'task_id': task_id, 'reason': 'lease_mismatch'}
        item.pop('lease', None)
        item['updated_at'] = utc_now_iso()
        if note:
            notes = item.setdefault('notes', [])
            if isinstance(notes, list):
                notes.append({'ts': utc_now_iso(), 'message': note})
        save_queue(path, queue)
        return {'status': 'released', 'task_id': task_id}


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
        raise KeyError(f'Task not found: {task_id}')
    item['status'] = status
    item['updated_at'] = utc_now_iso()
    if lane:
        item['lane'] = lane
    if runner:
        item['runner'] = runner
    if work_order_path:
        item['work_order_path'] = work_order_path
    if note:
        notes = item.setdefault('notes', [])
        if isinstance(notes, list):
            notes.append({'ts': utc_now_iso(), 'message': note})
    if status in TERMINAL_STATUSES:
        item['completed_at'] = utc_now_iso()
    if status in LEASE_CLEARED_STATUSES:
        item.pop('lease', None)
    return item
