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
LANE_CONTRACT_PATH = AUTONOMY_DIR / "lane_contract.py"
ORCHESTRATOR_PATH = AUTONOMY_DIR / "orchestrator_main.py"
REPORT_STATUS_PATH = AUTONOMY_DIR / "report_status.py"
QUEUE_STATE_PATH = AUTONOMY_DIR / "queue_state.py"
WORKTREE_UTILS_PATH = AUTONOMY_DIR / "worktree_utils.py"
FAILURE_CLASSIFIER_PATH = AUTONOMY_DIR / "failure_classifier.py"
LANE_STATE_PATH = AUTONOMY_DIR / "lane_state.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


WORKTREE_UTILS = load_module("worktree_utils", WORKTREE_UTILS_PATH)
FAILURE_CLASSIFIER = load_module("failure_classifier", FAILURE_CLASSIFIER_PATH)
LANE_STATE = load_module("lane_state", LANE_STATE_PATH)
LANE = load_module("lane_contract", LANE_CONTRACT_PATH)
REPORT = load_module("report_status", REPORT_STATUS_PATH)
QUEUE_STATE = load_module("queue_state", QUEUE_STATE_PATH)
ORCHESTRATOR = load_module("orchestrator_main", ORCHESTRATOR_PATH)


def test_build_work_order_routes_frontend_to_opencode(tmp_path: Path) -> None:
    frontend = tmp_path / "frontend"
    frontend.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=frontend, check=True)
    paths = LANE.LanePaths(
        repo_root="/repo",
        backend_worktree="/wt/backend",
        frontend_worktree="/wt/frontend",
        frontend_candidates=[str(frontend)],
    )
    item = {
        "id": "task-1",
        "title": "Polish dashboard shell",
        "description": "Tighten dashboard loading state",
        "area": "area:web",
        "priority": "p1",
    }

    work_order = LANE.build_work_order(item, paths)

    assert work_order.lane == "opencode"
    assert work_order.runner == "opencode"
    assert work_order.worktree == str(frontend)
    assert "npm run lint" in work_order.verification



def test_build_work_order_routes_backend_to_codex(tmp_path: Path) -> None:
    backend = tmp_path / "backend"
    backend.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=backend, check=True)
    paths = LANE.LanePaths(
        repo_root="/repo",
        backend_worktree="/wt/backend",
        frontend_worktree="/wt/frontend",
        backend_candidates=[str(backend)],
    )
    item = {
        "id": "task-2",
        "title": "Fix deployment ownership checks",
        "description": "Tighten backend route ownership",
        "area": "area:api",
        "priority": "p0",
    }

    work_order = LANE.build_work_order(item, paths)

    assert work_order.lane == "codex"
    assert work_order.runner == "codex"
    assert work_order.worktree == str(backend)
    assert "pytest tests/api -q" in work_order.verification


def test_build_work_order_keeps_role_metadata_for_main_lane(tmp_path: Path) -> None:
    backend = tmp_path / "backend"
    backend.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=backend, check=True)
    paths = LANE.LanePaths(
        repo_root="/repo",
        backend_worktree="/wt/backend",
        frontend_worktree="/wt/frontend",
        backend_candidates=[str(backend)],
    )
    item = {
        "id": "task-3",
        "title": "Tighten whitepaper drift",
        "description": "Docs truth pass",
        "area": "area:docs",
        "lane": "main",
        "owner_role": "research",
        "role_lane": "main",
        "score": 88,
        "scheduling_reason": "scan_targets=whitepaper.md,docs",
    }

    work_order = LANE.build_work_order(item, paths)

    assert work_order.lane == "main"
    assert work_order.runner == "main"
    assert work_order.metadata["owner_role"] == "research"
    assert work_order.metadata["score"] == 88



def test_select_next_item_prefers_highest_priority_then_score() -> None:
    queue = {
        "items": [
            {"id": "p2-item", "status": "queued", "priority": "p2", "score": 40},
            {"id": "running-item", "status": "running", "priority": "p0", "score": 100},
            {"id": "p0-low", "status": "queued", "priority": "p0", "score": 10, "owner_role": "backend"},
            {"id": "p0-high", "status": "queued", "priority": "p0", "score": 90, "owner_role": "research"},
        ]
    }

    selected = LANE.select_next_item(queue)

    assert selected is not None
    assert selected["id"] == "p0-high"



def test_report_status_builds_normalized_payload() -> None:
    payload = REPORT.build_report(
        task_id="issue-123",
        lane="opencode",
        status="ready_for_review",
        summary="Frontend change prepared",
        worktree="/wt/frontend",
        changed_files=["app/dashboard/page.tsx"],
        verification=[{"command": "npm run lint", "exit_code": 0}],
    )

    assert payload["task_id"] == "issue-123"
    assert payload["status"] == "ready_for_review"
    assert payload["changed_files"] == ["app/dashboard/page.tsx"]
    assert payload["verification"][0]["exit_code"] == 0
    assert payload["updated_at"].endswith("Z")



def test_failure_classifier_detects_quota_exceeded() -> None:
    assert FAILURE_CLASSIFIER.classify_failure("ERROR: Quota exceeded. Check your plan and billing details.") == "quota_exceeded"



def test_lane_state_can_pause_lane() -> None:
    payload = {"lanes": {}}
    updated = LANE_STATE.pause_lane(payload, "codex", reason="quota_exceeded", source="issue-1")
    assert LANE_STATE.is_lane_paused(updated, "codex") is True
    assert LANE_STATE.lane_reason(updated, "codex") == "quota_exceeded"



def test_worktree_utils_recognizes_git_repo(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=repo, check=True)

    assert WORKTREE_UTILS.is_git_worktree(repo) is True
    assert WORKTREE_UTILS.first_valid_worktree([str(repo)]) == str(repo)



def test_queue_state_updates_item_status() -> None:
    queue = {
        "items": [
            {"id": "issue-7", "status": "queued", "title": "demo"},
        ]
    }

    item = QUEUE_STATE.set_status(queue, "issue-7", "running", lane="opencode", runner="opencode")

    assert item["status"] == "running"
    assert item["lane"] == "opencode"
    assert item["runner"] == "opencode"
    assert item["updated_at"].endswith("Z")



def test_assess_pr_handoff_policy_allows_ready_pr_and_auto_merge_for_safe_opencode() -> None:
    work_order = LANE.WorkOrder(
        id="task-opencode-safe",
        title="Polish dashboard copy",
        description="Tighten dashboard copy",
        lane="opencode",
        runner="opencode",
        priority="p2",
        worktree="/wt/frontend",
        allowed_paths=["app/"],
        verification=["npm run lint"],
        constraints=[],
        source="queue",
        metadata={"area": "web", "labels": ["risk:low", "size:s"]},
    )

    policy = ORCHESTRATOR.assess_pr_handoff_policy(
        work_order,
        ["app/dashboard/page.tsx", "components/Nav.tsx"],
        True,
    )

    assert policy["ready_pr"] is True
    assert policy["enable_auto_merge"] is True
    assert policy["low_risk_paths"] is True



def test_assess_pr_handoff_policy_keeps_autonomy_changes_draft() -> None:
    work_order = LANE.WorkOrder(
        id="task-main-script",
        title="Update autonomy handoff",
        description="Keep substrate bounded",
        lane="main",
        runner="codex",
        priority="p2",
        worktree="/wt/main",
        allowed_paths=["scripts/autonomy/"],
        verification=["python -m compileall scripts/autonomy"],
        constraints=[],
        source="queue",
        metadata={"area": "docs", "labels": ["risk:low", "size:s", "autonomy:safe"]},
    )

    policy = ORCHESTRATOR.assess_pr_handoff_policy(
        work_order,
        ["scripts/autonomy/orchestrator_main.py"],
        True,
    )

    assert policy["ready_pr"] is False
    assert policy["enable_auto_merge"] is False
    assert policy["low_risk_paths"] is False



def test_publish_branch_with_pr_enables_auto_merge_for_ready_pr(monkeypatch) -> None:
    commands: list[list[str]] = []

    def fake_push_branch(path: str, branch: str, *, remote: str | None = None) -> dict[str, object]:
        return {"status": "success", "remote": remote or "origin", "branch": branch}

    def fake_default_base_branch(path: str, remote: str | None = None) -> str:
        return "main"

    def fake_create_pr(path: str, branch: str, *, title: str, body: str, base_branch: str | None = None, draft: bool = True) -> dict[str, object]:
        return {"status": "created", "number": 42, "url": "https://example/pr/42", "is_draft": draft}

    def fake_enable_pr_auto_merge(path: str, pr_number: int | str | None, *, merge_method: str = "squash") -> dict[str, object]:
        commands.append([str(pr_number), merge_method])
        return {"status": "enabled", "merge_method": merge_method}

    monkeypatch.setattr(WORKTREE_UTILS, "push_branch", fake_push_branch)
    monkeypatch.setattr(WORKTREE_UTILS, "default_base_branch", fake_default_base_branch)
    monkeypatch.setattr(WORKTREE_UTILS, "create_pr", fake_create_pr)
    monkeypatch.setattr(WORKTREE_UTILS, "enable_pr_auto_merge", fake_enable_pr_auto_merge)

    handoff = WORKTREE_UTILS.publish_branch_with_pr(
        "/wt/frontend",
        "autonomy/task-1",
        title="autonomy(opencode): Polish dashboard copy",
        body="body",
        draft=False,
        enable_auto_merge=True,
    )

    assert handoff["status"] == "published"
    assert handoff["pr"]["is_draft"] is False
    assert handoff["auto_merge"]["status"] == "enabled"
    assert commands == [["42", "squash"]]



def test_orchestrator_prepares_preview_command(tmp_path: Path) -> None:
    backend = tmp_path / "backend"
    frontend = tmp_path / "frontend"
    backend.mkdir()
    frontend.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=backend, check=True)
    subprocess.run(["git", "init", "-q"], cwd=frontend, check=True)
    queue_path = tmp_path / "queue.json"
    queue_path.write_text(
        json.dumps(
            {
                "items": [
                    {
                        "id": "issue-555",
                        "title": "Refine dashboard filters",
                        "description": "Frontend cleanup",
                        "area": "area:web",
                        "priority": "p1",
                        "status": "queued",
                    }
                ]
            }
        )
    )
    output_dir = tmp_path / "out"

    result = subprocess.run(
        [
            "python3",
            str(ORCHESTRATOR_PATH),
            "--queue",
            str(queue_path),
            "--repo-root",
            "/repo",
                "--backend-worktree",
                str(backend),
                "--frontend-worktree",
                str(frontend),
                "--backend-candidates",
                str(backend),
                "--frontend-candidates",
                str(frontend),
                "--output-dir",
                str(output_dir),
],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )

    payload = json.loads(result.stdout)
    assert payload["status"] == "prepared"
    assert payload["runner"] == "opencode"
    work_order_path = Path(payload["work_order_path"])
    assert work_order_path.exists()
    work_order = json.loads(work_order_path.read_text())
    assert work_order["worktree"] == str(frontend)
    assert work_order["lane"] == "opencode"
