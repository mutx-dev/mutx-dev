from __future__ import annotations

import importlib.util
import json
import subprocess
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
                        "evidence_fingerprint": "old-fingerprint",
                        "notes": [{"message": "runner completed successfully"}],
                    }
                ]
            }
        )
    )

    appended = DAEMON.enqueue_generated_tasks(
        queue_path,
        [
            {
                "id": "fleet-task",
                "title": "Refresh me",
                "source": "fleet:todo-scan",
                "evidence_fingerprint": "new-fingerprint",
            }
        ],
        cooldown_seconds=60,
    )

    assert appended == 1
    payload = json.loads(queue_path.read_text())
    refreshed = payload["items"][0]
    assert refreshed["id"] == "fleet-task"
    assert refreshed["status"] == "queued"
    assert refreshed["evidence_fingerprint"] == "new-fingerprint"
    assert any(
        "fleet task refreshed after cooldown" in note.get("message", "")
        for note in refreshed["notes"]
    )


def test_enqueue_generated_tasks_skips_terminal_fleet_item_when_evidence_is_unchanged(
    tmp_path: Path,
) -> None:
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
                        "evidence_fingerprint": "same-fingerprint",
                    }
                ]
            }
        )
    )

    appended = DAEMON.enqueue_generated_tasks(
        queue_path,
        [
            {
                "id": "fleet-task",
                "title": "Skip me",
                "source": "fleet:todo-scan",
                "evidence_fingerprint": "same-fingerprint",
            }
        ],
        cooldown_seconds=60,
    )

    assert appended == 0
    payload = json.loads(queue_path.read_text())
    assert payload["items"][0]["status"] == "completed"



def test_enqueue_generated_tasks_skips_refresh_when_pr_handoff_already_exists(tmp_path: Path) -> None:
    queue_path = tmp_path / "queue.json"
    queue_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "fleet-task",
                        "status": "completed",
                        "source": "fleet:route-claim-scan",
                        "completed_at": "2024-01-01T00:00:00Z",
                        "evidence_fingerprint": "old-fingerprint",
                        "notes": [{"message": "runner completed successfully; pushed autonomy/fleet-task; draft PR ready"}],
                    }
                ]
            }
        )
    )

    appended = DAEMON.enqueue_generated_tasks(
        queue_path,
        [{"id": "fleet-task", "title": "Skip me", "source": "fleet:route-claim-scan", "evidence_fingerprint": "new-fingerprint"}],
        cooldown_seconds=60,
    )

    assert appended == 0
    payload = json.loads(queue_path.read_text())
    assert payload["items"][0]["status"] == "completed"



def test_recover_orphaned_running_items_requeues_stale_tasks(tmp_path: Path) -> None:
    queue_path = tmp_path / "queue.json"
    queue_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "stale-runner",
                        "status": "running",
                        "lane": "codex",
                        "runner": "codex",
                        "updated_at": "2024-01-01T00:00:00Z",
                    },
                    {
                        "id": "fresh-runner",
                        "status": "running",
                        "lane": "opencode",
                        "runner": "opencode",
                        "updated_at": "2999-01-01T00:00:00Z",
                    },
                ]
            }
        )
    )

    recovered = DAEMON.recover_orphaned_running_items(queue_path, stale_after_seconds=60)

    assert recovered == ["stale-runner"]
    payload = json.loads(queue_path.read_text())
    stale_item = next(item for item in payload["items"] if item["id"] == "stale-runner")
    fresh_item = next(item for item in payload["items"] if item["id"] == "fresh-runner")
    assert stale_item["status"] == "queued"
    assert any("recovered orphaned running task" in note.get("message", "") for note in stale_item.get("notes", []))
    assert fresh_item["status"] == "running"



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
    backend = tmp_path / "backend"
    frontend = tmp_path / "frontend"
    backend.mkdir()
    frontend.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=backend, check=True)
    subprocess.run(["git", "init", "-q"], cwd=frontend, check=True)

    paths = DAEMON.LanePaths(
        repo_root=str(tmp_path),
        backend_worktree=str(backend),
        frontend_worktree=str(frontend),
        backend_candidates=[],
        frontend_candidates=[],
    )
    queue = {
        "items": [
            {
                "id": "api-1",
                "title": "api",
                "status": "queued",
                "priority": "p0",
                "lane": "codex",
                "runner": "codex",
            },
            {
                "id": "web-1",
                "title": "web",
                "status": "queued",
                "priority": "p1",
                "lane": "opencode",
                "runner": "opencode",
            },
            {
                "id": "docs-1",
                "title": "docs",
                "status": "queued",
                "priority": "p2",
                "lane": "main",
                "runner": "main",
            },
        ]
    }
    lane_state = {"lanes": {"main": {"paused": True, "reason": "quota_exceeded"}}}

    selected, parked = DAEMON.select_dispatch_candidates(
        queue,
        lane_state,
        paths,
        busy_worktrees={str(backend)},
        limit=2,
    )

    dispatches = [item for item in selected if item["action"] == "dispatch"]
    parks = [item for item in selected if item["action"] == "park"]
    assert [item["task_id"] for item in dispatches] == ["web-1"]
    assert dispatches[0]["active_lane"] == "opencode"
    assert [item["task_id"] for item in parks] == ["docs-1"]
    assert parks[0]["reason"] == "quota_exceeded"
    assert parked == 1


def test_select_dispatch_candidates_uses_distinct_worktrees_for_same_lane(tmp_path: Path) -> None:
    backend_a = tmp_path / "backend-a"
    backend_b = tmp_path / "backend-b"
    backend_a.mkdir()
    backend_b.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=backend_a, check=True)
    subprocess.run(["git", "init", "-q"], cwd=backend_b, check=True)

    paths = DAEMON.LanePaths(
        repo_root=str(tmp_path),
        backend_worktree=str(backend_a),
        frontend_worktree=str(tmp_path / "frontend"),
        backend_candidates=[str(backend_a), str(backend_b)],
        frontend_candidates=[],
    )
    queue = {
        "items": [
            {
                "id": "api-1",
                "title": "api-1",
                "status": "queued",
                "priority": "p0",
                "lane": "codex",
                "runner": "codex",
            },
            {
                "id": "api-2",
                "title": "api-2",
                "status": "queued",
                "priority": "p1",
                "lane": "codex",
                "runner": "codex",
            },
        ]
    }

    selected, parked = DAEMON.select_dispatch_candidates(
        queue,
        {"lanes": {}},
        paths,
        busy_worktrees=set(),
        limit=2,
    )

    assert parked == 0
    dispatches = [item for item in selected if item["action"] == "dispatch"]
    assert [item["task_id"] for item in dispatches] == ["api-1", "api-2"]
    assert [item["worktree"] for item in dispatches] == [str(backend_a), str(backend_b)]


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
