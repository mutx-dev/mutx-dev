from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
DAEMON_PATH = AUTONOMY_DIR / "daemon_main.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


DAEMON = load_module("daemon_main", DAEMON_PATH)


class Args:
    def __init__(self, tmp_path: Path) -> None:
        self.repo_root = str(tmp_path)
        self.queue = str(tmp_path / "queue.json")
        self.report_log = str(tmp_path / "status.jsonl")
        self.lock_file = str(tmp_path / "daemon.lock")
        self.fleet_config = str(tmp_path / "fleet.json")



def test_next_idle_delay_caps_growth() -> None:
    assert DAEMON.next_idle_delay(0) == DAEMON.DEFAULT_SLEEP_SECONDS
    assert DAEMON.next_idle_delay(60) == 120
    assert DAEMON.next_idle_delay(1000) == DAEMON.MAX_IDLE_SECONDS



def test_enqueue_generated_tasks_deduplicates_and_sets_defaults(tmp_path: Path) -> None:
    queue_path = tmp_path / "queue.json"
    queue_path.write_text(json.dumps({"items": [{"id": "existing", "status": "queued"}]}))

    appended = DAEMON.enqueue_generated_tasks(
        queue_path,
        [
            {"id": "existing", "title": "skip me"},
            {"id": "new-task", "title": "Add bounded work"},
        ],
    )

    assert appended == 1
    payload = json.loads(queue_path.read_text())
    assert len(payload["items"]) == 2
    assert payload["items"][1]["id"] == "new-task"
    assert payload["items"][1]["status"] == "queued"
    assert payload["items"][1]["source"] == "fleet"



def test_enqueue_generated_tasks_refreshes_stale_terminal_fleet_item(tmp_path: Path) -> None:
    queue_path = tmp_path / "queue.json"
    queue_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "fleet-task",
                        "status": "completed",
                        "source": "fleet:todo-scan",
                        "completed_at": "2024-01-01T00:00:00Z",
                        "notes": [{"message": "runner completed successfully"}],
                    }
                ]
            }
        )
    )

    appended = DAEMON.enqueue_generated_tasks(
        queue_path,
        [{"id": "fleet-task", "title": "Refresh me", "source": "fleet:todo-scan"}],
        cooldown_seconds=60,
    )

    assert appended == 1
    payload = json.loads(queue_path.read_text())
    refreshed = payload["items"][0]
    assert refreshed["id"] == "fleet-task"
    assert refreshed["status"] == "queued"
    assert any("fleet task refreshed after cooldown" in note.get("message", "") for note in refreshed["notes"])



def test_daemon_lock_prevents_second_instance(tmp_path: Path) -> None:
    lock_path = tmp_path / "daemon.lock"
    first = DAEMON.DaemonLock(lock_path)
    second = DAEMON.DaemonLock(lock_path)

    first.acquire()
    try:
        try:
            second.acquire()
        except RuntimeError as exc:
            assert "already held" in str(exc)
        else:
            raise AssertionError("expected second lock acquisition to fail")
    finally:
        first.release()
        second.release()



def test_status_tracker_writes_heartbeat_file(tmp_path: Path) -> None:
    args = Args(tmp_path)
    status_path = tmp_path / "daemon-status.json"

    tracker = DAEMON.StatusTracker(status_path, args)
    tracker.update(status="idle", queue_depth=0)

    payload = json.loads(status_path.read_text())
    assert payload["status"] == "idle"
    assert payload["queue_depth"] == 0
    assert payload["heartbeat_at"].endswith("Z")


def test_select_dispatch_candidates_respects_lane_capacity_and_pause(tmp_path: Path) -> None:
    paths = DAEMON.LanePaths(
        repo_root=str(tmp_path),
        backend_worktree=str(tmp_path / "backend"),
        frontend_worktree=str(tmp_path / "frontend"),
        backend_candidates=[],
        frontend_candidates=[],
    )
    queue = {
        "items": [
            {"id": "api-1", "title": "api", "status": "queued", "priority": "p0", "lane": "codex", "runner": "codex"},
            {"id": "web-1", "title": "web", "status": "queued", "priority": "p1", "lane": "opencode", "runner": "opencode"},
            {"id": "docs-1", "title": "docs", "status": "queued", "priority": "p2", "lane": "main", "runner": "main"},
        ]
    }
    lane_state = {"lanes": {"main": {"paused": True, "reason": "quota_exceeded"}}}

    selected, parked = DAEMON.select_dispatch_candidates(
        queue,
        lane_state,
        paths,
        busy_lanes={"codex"},
        limit=2,
    )

    dispatches = [item for item in selected if item["action"] == "dispatch"]
    parks = [item for item in selected if item["action"] == "park"]
    assert [item["task_id"] for item in dispatches] == ["web-1"]
    assert dispatches[0]["active_lane"] == "opencode"
    assert [item["task_id"] for item in parks] == ["docs-1"]
    assert parks[0]["reason"] == "quota_exceeded"
    assert parked == 1


def test_runner_command_targets_specific_task(tmp_path: Path) -> None:
    args = type(
        "ArgsObj",
        (),
        {
            "queue": str(tmp_path / "queue.json"),
            "repo_root": str(tmp_path),
            "backend_worktree": str(tmp_path / "backend"),
            "frontend_worktree": str(tmp_path / "frontend"),
            "backend_candidates": "",
            "frontend_candidates": "",
            "output_dir": str(tmp_path / "out"),
            "lane_state": str(tmp_path / "lane-state.json"),
            "report_log": str(tmp_path / "status.jsonl"),
        },
    )()

    command = DAEMON.runner_command(args, task_id="task-123")

    assert "--task-id" in command
    assert command[command.index("--task-id") + 1] == "task-123"
    assert command[-1] == "--execute"
