from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENQUEUE = ROOT / "scripts" / "autonomy" / "enqueue_task.py"
RESUME = ROOT / "scripts" / "autonomy" / "resume_lane.py"
CHECK_RESUME = ROOT / "scripts" / "autonomy" / "check_codex_resume.py"


def test_enqueue_task_appends_clean_item(tmp_path: Path) -> None:
    queue = tmp_path / "queue.json"
    queue.write_text(json.dumps({"items": []}))
    task = tmp_path / "task.json"
    task.write_text(
        json.dumps(
            {
                "id": "demo-task",
                "title": "Demo task",
                "description": "Test task",
            }
        )
    )

    subprocess.run(
        ["python3", str(ENQUEUE), str(task), "--queue", str(queue)],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(queue.read_text())
    assert payload["items"][0]["id"] == "demo-task"
    assert payload["items"][0]["status"] == "queued"



def test_resume_lane_clears_pause(tmp_path: Path) -> None:
    lane_state = tmp_path / "lane-state.json"
    lane_state.write_text(
        json.dumps(
            {
                "lanes": {
                    "codex": {
                        "paused": True,
                        "reason": "quota_exceeded",
                    }
                }
            }
        )
    )

    subprocess.run(
        ["python3", str(RESUME), "codex", "--lane-state", str(lane_state)],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(lane_state.read_text())
    assert payload["lanes"]["codex"]["paused"] is False
    assert payload["lanes"]["codex"]["reason"] is None



def test_check_codex_resume_dry_run_and_apply_requeues_parked_items(tmp_path: Path) -> None:
    lane_state = tmp_path / "lane-state.json"
    queue = tmp_path / "queue.json"
    lane_state.write_text(
        json.dumps(
            {
                "lanes": {
                    "codex": {
                        "paused": True,
                        "reason": "quota_exceeded",
                        "paused_at": "2024-01-01T00:00:00Z",
                        "auto_resume_after_seconds": 60,
                        "auto_resume_count": 0,
                    }
                }
            }
        )
    )
    queue.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "parked-task",
                        "status": "parked",
                        "runner": "codex",
                        "lane": "codex",
                        "notes": [{"message": "lane paused: quota_exceeded"}],
                    }
                ]
            }
        )
    )

    dry_run = subprocess.run(
        ["python3", str(CHECK_RESUME), "--lane-state", str(lane_state), "--queue", str(queue), "--min-pause-seconds", "60"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    dry_payload = json.loads(dry_run.stdout)
    assert dry_payload["eligible"] is True
    assert dry_payload["changed"] is False

    applied = subprocess.run(
        [
            "python3",
            str(CHECK_RESUME),
            "--lane-state",
            str(lane_state),
            "--queue",
            str(queue),
            "--min-pause-seconds",
            "60",
            "--apply",
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    applied_payload = json.loads(applied.stdout)
    assert applied_payload["changed"] is True
    assert applied_payload["requeued_items"] == 1

    lane_payload = json.loads(lane_state.read_text())
    assert lane_payload["lanes"]["codex"]["paused"] is False
    assert lane_payload["lanes"]["codex"]["resumed_by"] == "auto"
    queue_payload = json.loads(queue.read_text())
    assert queue_payload["items"][0]["status"] == "queued"
