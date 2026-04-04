from __future__ import annotations

import argparse
import atexit
import fcntl
import json
import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from lane_contract import LanePaths, build_work_order, queued_items_in_priority_order
from lane_state import is_lane_paused, lane_reason, load_lane_state
from queue_state import load_queue, save_queue, set_status
from report_status import append_jsonl, build_report, utc_now_iso
from resume_policy import apply_auto_resume

DEFAULT_SLEEP_SECONDS = 60
DEFAULT_ACTIVE_POLL_SECONDS = 5
DEFAULT_BURST_SIZE = 2
DEFAULT_MAX_ACTIVE_RUNNERS = 2
MAX_IDLE_SECONDS = 900
DEFAULT_IDLE_REPORT_INTERVAL = 900
DEFAULT_FLEET_SCAN_INTERVAL = 900
DEFAULT_QUEUE_REFILL_THRESHOLD = 2
LOCK_EXIT_CODE = 75
STOP_SIGNALS = (signal.SIGINT, signal.SIGTERM)

_STOP_REQUESTED = False


class DaemonLock:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.handle: Any | None = None

    def acquire(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.handle = self.path.open("a+", encoding="utf-8")
        try:
            fcntl.flock(self.handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError(f"daemon lock already held: {self.path}") from exc
        self.handle.seek(0)
        self.handle.truncate()
        self.handle.write(f"{os.getpid()}\n")
        self.handle.flush()

    def release(self) -> None:
        if self.handle is None:
            return
        try:
            self.handle.seek(0)
            self.handle.truncate()
            fcntl.flock(self.handle.fileno(), fcntl.LOCK_UN)
        finally:
            self.handle.close()
            self.handle = None


class StatusTracker:
    def __init__(self, path: Path, args: argparse.Namespace) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.state: dict[str, Any] = {
            "status": "starting",
            "pid": os.getpid(),
            "host": socket.gethostname(),
            "repo_root": args.repo_root,
            "queue": args.queue,
            "report_log": args.report_log,
            "lock_file": args.lock_file,
            "fleet_config": args.fleet_config,
            "started_at": utc_now_iso(),
            "heartbeat_at": utc_now_iso(),
            "last_cycle_started_at": None,
            "last_cycle_completed_at": None,
            "last_non_idle_at": None,
            "last_idle_report_at": None,
            "last_fleet_scan_at": None,
            "last_fleet_enqueue_at": None,
            "last_result": None,
            "last_error": None,
            "queue_depth": 0,
            "consecutive_idle_cycles": 0,
            "cycle_count": 0,
            "fleet_tasks_enqueued": 0,
            "queue_refill_threshold": getattr(args, "queue_refill_threshold", DEFAULT_QUEUE_REFILL_THRESHOLD),
            "last_auto_resume_at": None,
            "last_auto_resume_result": None,
            "stop_requested": False,
            "active_runners": [],
        }
        self.write()

    def update(self, **changes: Any) -> None:
        self.state.update(changes)
        self.state["heartbeat_at"] = utc_now_iso()
        self.write()

    def mark_cycle_start(self, queue_depth: int) -> None:
        self.state["cycle_count"] += 1
        self.update(last_cycle_started_at=utc_now_iso(), queue_depth=queue_depth)

    def mark_cycle_end(
        self,
        *,
        status: str,
        last_result: dict[str, Any] | None = None,
        last_error: str | None = None,
        queue_depth: int | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "status": status,
            "last_cycle_completed_at": utc_now_iso(),
            "last_result": last_result,
            "last_error": last_error,
        }
        if queue_depth is not None:
            payload["queue_depth"] = queue_depth
        self.update(**payload)

    def write(self) -> None:
        write_json_atomic(self.path, self.state)


class ActiveRunner:
    def __init__(self, *, task_id: str, lane: str, runner: str, process: subprocess.Popen[str]) -> None:
        self.task_id = task_id
        self.lane = lane
        self.runner = runner
        self.process = process
        self.started_at = utc_now_iso()

    def snapshot(self) -> dict[str, Any]:
        return {
            "task_id": self.task_id,
            "lane": self.lane,
            "runner": self.runner,
            "pid": self.process.pid,
            "started_at": self.started_at,
        }


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp_path.replace(path)


def next_idle_delay(current: int) -> int:
    if current <= 0:
        return DEFAULT_SLEEP_SECONDS
    return min(current * 2, MAX_IDLE_SECONDS)


def should_emit_idle_report(last_idle_report_at: str | None, idle_report_interval: int) -> bool:
    if not last_idle_report_at:
        return True
    try:
        previous = parse_epoch(last_idle_report_at)
    except ValueError:
        return True
    return (time.time() - previous) >= idle_report_interval


def parse_epoch(value: str) -> float:
    normalized = value.replace("Z", "+00:00")
    return __import__("datetime").datetime.fromisoformat(normalized).timestamp()


def install_signal_handlers() -> None:
    for sig in STOP_SIGNALS:
        signal.signal(sig, request_stop)


def request_stop(signum: int, _frame: Any) -> None:
    global _STOP_REQUESTED
    _STOP_REQUESTED = True
    sys.stderr.write(f"autonomy daemon received signal {signum}; shutting down\n")
    sys.stderr.flush()


def split_candidates(raw: str) -> list[str]:
    return [item for item in (part.strip() for part in raw.split(":")) if item]


def build_lane_paths(args: argparse.Namespace) -> LanePaths:
    return LanePaths(
        repo_root=args.repo_root,
        backend_worktree=args.backend_worktree,
        frontend_worktree=args.frontend_worktree,
        backend_candidates=split_candidates(args.backend_candidates),
        frontend_candidates=split_candidates(args.frontend_candidates),
    )


def execution_lane_for(runner: str, lane: str) -> str:
    return runner if runner in {"codex", "opencode", "main"} else lane


def runner_command(orchestrator_args: argparse.Namespace, *, task_id: str) -> list[str]:
    return [
        "python3",
        "scripts/autonomy/orchestrator_main.py",
        "--queue",
        orchestrator_args.queue,
        "--repo-root",
        orchestrator_args.repo_root,
        "--backend-worktree",
        orchestrator_args.backend_worktree,
        "--frontend-worktree",
        orchestrator_args.frontend_worktree,
        "--backend-candidates",
        orchestrator_args.backend_candidates,
        "--frontend-candidates",
        orchestrator_args.frontend_candidates,
        "--output-dir",
        orchestrator_args.output_dir,
        "--lane-state",
        orchestrator_args.lane_state,
        "--report-log",
        orchestrator_args.report_log,
        "--task-id",
        task_id,
        "--execute",
    ]


def enqueue_generated_tasks(queue_path: str | Path, tasks: list[dict[str, Any]]) -> int:
    if not tasks:
        return 0
    queue = load_queue(queue_path)
    items = queue.setdefault("items", [])
    seen = {str(item.get("id")) for item in items}
    appended = 0
    for task in tasks:
        task_id = str(task.get("id") or "")
        if not task_id or task_id in seen:
            continue
        payload = dict(task)
        payload.setdefault("status", "queued")
        payload.setdefault("priority", "p2")
        payload.setdefault("source", "fleet")
        payload.setdefault("labels", [])
        items.append(payload)
        seen.add(task_id)
        appended += 1
    if appended:
        save_queue(queue_path, queue)
    return appended


def run_fleet_scan(args: argparse.Namespace) -> list[dict[str, Any]]:
    fleet_path = Path(args.fleet_config)
    if not fleet_path.exists():
        return []
    output_path = Path(args.generated_task_output)
    command = [
        "python3",
        "scripts/autonomy/generate_fleet_tasks.py",
        "--fleet",
        args.fleet_config,
        "--queue",
        args.queue,
        "--output",
        args.generated_task_output,
    ]
    result = subprocess.run(command, cwd=args.repo_root, text=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "fleet generation failed")
    if not output_path.exists():
        return []
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise RuntimeError("generated fleet task payload was not a list")
    return payload


def maybe_resume_codex_lane(args: argparse.Namespace, tracker: StatusTracker) -> dict[str, Any]:
    if args.codex_auto_resume_max_attempts <= 0:
        return {"changed": False, "eligible": False, "blocked_by": "auto_resume_disabled", "requeued_items": 0}
    result = apply_auto_resume(
        args.lane_state,
        args.queue,
        "codex",
        min_pause_seconds=args.codex_auto_resume_pause_seconds,
        max_auto_resumes=args.codex_auto_resume_max_attempts,
    )
    if result.get("changed"):
        tracker.update(last_auto_resume_at=utc_now_iso(), last_auto_resume_result=result)
    return result


def maybe_run_fleet_scan(args: argparse.Namespace, tracker: StatusTracker, *, queued_items: int, force: bool = False) -> int:
    if not args.fleet_scan_interval or args.fleet_scan_interval < 0:
        return 0
    if not force and queued_items > args.queue_refill_threshold:
        return 0
    last_scan_at = tracker.state.get("last_fleet_scan_at")
    if not force and last_scan_at and (time.time() - parse_epoch(last_scan_at)) < args.fleet_scan_interval:
        return 0
    tracker.update(last_fleet_scan_at=utc_now_iso())
    tasks = run_fleet_scan(args)
    appended = enqueue_generated_tasks(args.queue, tasks)
    if appended:
        tracker.update(
            last_fleet_enqueue_at=utc_now_iso(),
            fleet_tasks_enqueued=int(tracker.state.get("fleet_tasks_enqueued", 0)) + appended,
        )
    return appended


def build_idle_report(args: argparse.Namespace, idle_delay: int, queued_items: int, appended: int = 0) -> dict[str, Any]:
    summary = f"Queue empty ({queued_items} queued items); sleeping for {idle_delay}s"
    next_action = "wait_for_queue_items"
    if appended:
        summary = f"Queue empty; enqueued {appended} fleet task(s) and continuing"
        next_action = "dispatch_generated_tasks"
    return build_report(
        task_id="daemon",
        lane="main",
        status="parked",
        summary=summary,
        worktree=args.repo_root,
        verification=[],
        next_action=next_action,
    )


def refresh_active_runner_state(tracker: StatusTracker, active_runners: list[ActiveRunner]) -> None:
    tracker.update(active_runners=[runner.snapshot() for runner in active_runners])


def reap_finished_runners(active_runners: list[ActiveRunner]) -> list[dict[str, Any]]:
    finished: list[dict[str, Any]] = []
    still_running: list[ActiveRunner] = []
    for runner in active_runners:
        exit_code = runner.process.poll()
        if exit_code is None:
            still_running.append(runner)
            continue
        stdout, stderr = runner.process.communicate()
        payload = {"status": "unknown"}
        if stdout.strip():
            try:
                payload = json.loads(stdout)
            except json.JSONDecodeError:
                payload = {"status": "invalid_json", "stdout_excerpt": stdout.strip()[:400]}
        finished.append(
            {
                "task_id": runner.task_id,
                "lane": runner.lane,
                "runner": runner.runner,
                "exit_code": exit_code,
                "payload": payload,
                "stderr_excerpt": stderr.strip()[:400],
            }
        )
    active_runners[:] = still_running
    return finished


def park_paused_item(
    args: argparse.Namespace,
    queue: dict[str, Any],
    *,
    task_id: str,
    lane: str,
    runner: str,
    worktree: str,
    reason: str,
) -> None:
    set_status(queue, task_id, "parked", lane=lane, runner=runner, note=f"lane paused: {reason}")
    append_jsonl(
        Path(args.report_log),
        build_report(
            task_id=task_id,
            lane=lane,
            status="parked",
            summary=f"lane paused: {reason}",
            worktree=worktree,
            blocker_class=reason,
            next_action="wait_for_lane_resume",
        ),
    )


def select_dispatch_candidates(
    queue: dict[str, Any],
    lane_state: dict[str, Any],
    paths: LanePaths,
    *,
    busy_lanes: set[str],
    limit: int,
) -> tuple[list[dict[str, str]], int]:
    selected: list[dict[str, str]] = []
    parked = 0
    reserved_lanes = set(busy_lanes)
    for item in queued_items_in_priority_order(queue):
        work_order = build_work_order(item, paths)
        active_lane = execution_lane_for(work_order.runner, work_order.lane)
        reason = lane_reason(lane_state, active_lane)
        if is_lane_paused(lane_state, active_lane):
            selected.append(
                {
                    "action": "park",
                    "task_id": work_order.id,
                    "lane": work_order.lane,
                    "runner": work_order.runner,
                    "worktree": work_order.worktree,
                    "reason": reason or "lane_paused",
                    "active_lane": active_lane,
                }
            )
            parked += 1
            continue
        if active_lane in reserved_lanes:
            continue
        reserved_lanes.add(active_lane)
        selected.append(
            {
                "action": "dispatch",
                "task_id": work_order.id,
                "lane": work_order.lane,
                "runner": work_order.runner,
                "worktree": work_order.worktree,
                "active_lane": active_lane,
            }
        )
        if len([item for item in selected if item["action"] == "dispatch"]) >= limit:
            break
    return selected, parked


def launch_runner(args: argparse.Namespace, task_id: str, lane: str, runner: str) -> ActiveRunner:
    process = subprocess.Popen(
        runner_command(args, task_id=task_id),
        cwd=args.repo_root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return ActiveRunner(task_id=task_id, lane=lane, runner=runner, process=process)


def stop_active_runners(active_runners: list[ActiveRunner]) -> None:
    for runner in active_runners:
        if runner.process.poll() is None:
            runner.process.terminate()
    deadline = time.time() + 10
    for runner in active_runners:
        if runner.process.poll() is not None:
            continue
        timeout = max(1, int(deadline - time.time()))
        try:
            runner.process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            runner.process.kill()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the MUTX autonomous orchestrator daemon")
    parser.add_argument("--queue", default="mutx-engineering-agents/dispatch/action-queue.json")
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
    parser.add_argument("--output-dir", default=".autonomy/work-orders")
    parser.add_argument("--report-log", default="reports/autonomy-status.jsonl")
    parser.add_argument("--lane-state", default=".autonomy/lane-state.json")
    parser.add_argument("--status-file", default=".autonomy/daemon-status.json")
    parser.add_argument("--lock-file", default=".autonomy/daemon.lock")
    parser.add_argument("--generated-task-output", default=".autonomy/generated-tasks.json")
    parser.add_argument("--fleet-config", default=".autonomy/fleet.json")
    parser.add_argument("--idle-report-interval", type=int, default=DEFAULT_IDLE_REPORT_INTERVAL)
    parser.add_argument("--fleet-scan-interval", type=int, default=DEFAULT_FLEET_SCAN_INTERVAL)
    parser.add_argument("--queue-refill-threshold", type=int, default=DEFAULT_QUEUE_REFILL_THRESHOLD)
    parser.add_argument("--codex-auto-resume-pause-seconds", type=int, default=1800)
    parser.add_argument("--codex-auto-resume-max-attempts", type=int, default=3)
    parser.add_argument("--burst-size", type=int, default=DEFAULT_BURST_SIZE)
    parser.add_argument("--max-active-runners", type=int, default=DEFAULT_MAX_ACTIVE_RUNNERS)
    parser.add_argument("--active-poll-seconds", type=int, default=DEFAULT_ACTIVE_POLL_SECONDS)
    parser.add_argument("--once", action="store_true", help="Run a single orchestration cycle")
    args = parser.parse_args()

    args.burst_size = max(1, args.burst_size)
    args.max_active_runners = max(1, args.max_active_runners)
    args.active_poll_seconds = max(1, args.active_poll_seconds)

    install_signal_handlers()
    lock = DaemonLock(Path(args.lock_file))
    try:
        lock.acquire()
    except RuntimeError as exc:
        sys.stderr.write(f"{exc}\n")
        return LOCK_EXIT_CODE
    atexit.register(lock.release)

    tracker = StatusTracker(Path(args.status_file), args)
    idle_delay = 0
    active_runners: list[ActiveRunner] = []
    paths = build_lane_paths(args)

    try:
        while not _STOP_REQUESTED:
            finished = reap_finished_runners(active_runners)
            refresh_active_runner_state(tracker, active_runners)

            auto_resume = maybe_resume_codex_lane(args, tracker)
            queue = load_queue(args.queue)
            queued_items = [item for item in queue.get("items", []) if item.get("status") == "queued"]
            tracker.mark_cycle_start(len(queued_items))

            if auto_resume.get("changed"):
                append_jsonl(
                    Path(args.report_log),
                    build_report(
                        task_id="daemon-codex-auto-resume",
                        lane="codex",
                        status="completed",
                        summary=(
                            f"Auto-resumed codex lane after quota pause; requeued {int(auto_resume.get('requeued_items') or 0)} parked item(s)"
                        ),
                        worktree=args.repo_root,
                        verification=[],
                        next_action="continue",
                    ),
                )
                queue = load_queue(args.queue)
                queued_items = [item for item in queue.get("items", []) if item.get("status") == "queued"]
                tracker.update(queue_depth=len(queued_items))

            lane_state = load_lane_state(args.lane_state)
            busy_lanes = {runner.lane for runner in active_runners}
            dispatch_capacity = max(0, args.max_active_runners - len(active_runners))

            if not queued_items and not active_runners:
                tracker.update(
                    status="idle",
                    consecutive_idle_cycles=int(tracker.state.get("consecutive_idle_cycles", 0)) + 1,
                )
                appended = 0
                fleet_error = None
                try:
                    appended = maybe_run_fleet_scan(args, tracker, queued_items=0, force=True)
                except Exception as exc:
                    fleet_error = str(exc)
                    tracker.update(last_error=fleet_error)

                if appended:
                    queue = load_queue(args.queue)
                    queued_items = [item for item in queue.get("items", []) if item.get("status") == "queued"]
                    tracker.mark_cycle_end(
                        status="active",
                        last_result={"status": "fleet_enqueued", "count": appended},
                        last_error=fleet_error,
                        queue_depth=len(queued_items),
                    )
                    append_jsonl(Path(args.report_log), build_idle_report(args, 0, len(queued_items), appended))
                    if args.once:
                        return 0
                    continue

                idle_delay = next_idle_delay(idle_delay)
                if should_emit_idle_report(tracker.state.get("last_idle_report_at"), args.idle_report_interval):
                    append_jsonl(Path(args.report_log), build_idle_report(args, idle_delay, len(queued_items)))
                    tracker.update(last_idle_report_at=utc_now_iso())
                tracker.mark_cycle_end(
                    status="idle",
                    last_result={"status": "idle", "sleep_seconds": idle_delay},
                    last_error=fleet_error,
                    queue_depth=0,
                )
                if args.once:
                    return 0
                time.sleep(idle_delay)
                continue

            idle_delay = 0
            tracker.update(status="active", consecutive_idle_cycles=0, last_non_idle_at=utc_now_iso())
            try:
                appended = maybe_run_fleet_scan(args, tracker, queued_items=len(queued_items))
            except Exception as exc:
                tracker.update(last_error=str(exc))
            else:
                if appended:
                    queue = load_queue(args.queue)
                    queued_items = [item for item in queue.get("items", []) if item.get("status") == "queued"]
                    tracker.update(queue_depth=len(queued_items))

            dispatch_limit = min(args.burst_size, dispatch_capacity)
            dispatches = 0
            parked = 0
            dispatch_error = None
            last_result: dict[str, Any]

            if dispatch_limit > 0 and queued_items:
                selections, parked = select_dispatch_candidates(
                    queue,
                    lane_state,
                    paths,
                    busy_lanes=busy_lanes,
                    limit=dispatch_limit,
                )
                for selection in selections:
                    if selection["action"] == "park":
                        park_paused_item(
                            args,
                            queue,
                            task_id=selection["task_id"],
                            lane=selection["lane"],
                            runner=selection["runner"],
                            worktree=selection["worktree"],
                            reason=selection["reason"],
                        )
                        continue
                    set_status(
                        queue,
                        selection["task_id"],
                        "running",
                        lane=selection["lane"],
                        runner=selection["runner"],
                        note="daemon dispatched work order",
                    )
                    save_queue(args.queue, queue)
                    try:
                        active_runners.append(
                            launch_runner(args, selection["task_id"], selection["active_lane"], selection["runner"])
                        )
                        dispatches += 1
                    except Exception as exc:
                        dispatch_error = str(exc)
                        set_status(
                            queue,
                            selection["task_id"],
                            "queued",
                            lane=selection["lane"],
                            runner=selection["runner"],
                            note=f"daemon dispatch failed: {dispatch_error}",
                        )
                save_queue(args.queue, queue)

            refresh_active_runner_state(tracker, active_runners)
            queue = load_queue(args.queue)
            queued_items = [item for item in queue.get("items", []) if item.get("status") == "queued"]
            if active_runners or dispatches or finished:
                tracker.update(status="active", consecutive_idle_cycles=0, last_non_idle_at=utc_now_iso())
                last_result = {
                    "status": "active",
                    "dispatched": dispatches,
                    "finished": len(finished),
                    "parked": parked,
                    "active_runners": len(active_runners),
                }
                tracker.mark_cycle_end(
                    status="active",
                    last_result=last_result,
                    last_error=dispatch_error,
                    queue_depth=len(queued_items),
                )
            else:
                last_result = {
                    "status": "waiting_for_lane_capacity",
                    "parked": parked,
                    "active_runners": len(active_runners),
                }
                tracker.mark_cycle_end(
                    status="active",
                    last_result=last_result,
                    last_error=dispatch_error,
                    queue_depth=len(queued_items),
                )

            if args.once:
                return 0

            if active_runners or queued_items:
                time.sleep(args.active_poll_seconds)
            else:
                time.sleep(DEFAULT_SLEEP_SECONDS)
    finally:
        stop_active_runners(active_runners)
        refresh_active_runner_state(tracker, [])
        tracker.update(status="stopped", stop_requested=_STOP_REQUESTED)
        lock.release()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
