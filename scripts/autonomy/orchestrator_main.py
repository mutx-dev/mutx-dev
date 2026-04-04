from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

from lane_contract import LanePaths, WorkOrder, build_work_order, select_next_item
from lane_state import is_lane_paused, lane_reason, load_lane_state, pause_lane, save_lane_state
from queue_state import find_item, load_queue, save_queue, set_status
from report_status import append_jsonl, build_report
from worktree_utils import commit_tracked_files, current_branch, is_git_worktree, publish_branch_with_pr


SAFE_READY_SIZE_LABELS = {"size:xs", "size:s"}
SAFE_AUTO_MERGE_MAX_CHANGED_FILES = 3
LOW_RISK_OPENCODE_PREFIXES = ("app/", "components/", "lib/", "public/", "tests/")
LOW_RISK_DOC_PREFIXES = ("docs/", "whitepaper.md", "roadmap.md")


def persist_work_order(work_order: WorkOrder, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{work_order.id}.json"
    path.write_text(json.dumps(work_order.to_dict(), indent=2, sort_keys=True) + "\n")
    return path


def runner_script_for(runner: str) -> str:
    if runner == "main":
        return "scripts/autonomy/run_main_lane.py"
    if runner == "opencode":
        return "scripts/autonomy/run_opencode_lane.py"
    if runner == "codex":
        return "scripts/autonomy/run_codex_lane.py"
    raise ValueError(f"Unsupported runner: {runner}")


def runner_command(work_order_path: Path, runner: str, *, execute: bool = False) -> list[str]:
    command = ["python", runner_script_for(runner), str(work_order_path)]
    if execute:
        command.append("--execute")
    return command


def split_candidates(raw: str) -> list[str]:
    return [item for item in (part.strip() for part in raw.split(":")) if item]


def build_pr_body(work_order: WorkOrder, changed_files: list[str], verification: list[dict[str, Any]]) -> str:
    changed_block = "\n".join(f"- {path}" for path in changed_files) or "- No tracked file changes recorded"
    verification_block = "\n".join(
        f"- `{item.get('command', 'unknown')}` -> exit {item.get('exit_code', 'n/a')}" for item in verification
    ) or "- Verification not reported"
    issue = work_order.metadata.get("issue")
    issue_line = f"Issue: #{issue}\n" if issue else ""
    return (
        f"## Autonomous work order\n"
        f"Task ID: {work_order.id}\n"
        f"Lane: {work_order.lane}\n"
        f"Runner: {work_order.runner}\n"
        f"{issue_line}\n"
        f"## Summary\n{work_order.description or work_order.title}\n\n"
        f"## Changed files\n{changed_block}\n\n"
        f"## Verification\n{verification_block}\n"
    )


def _work_order_labels(work_order: WorkOrder) -> set[str]:
    labels = work_order.metadata.get("labels", [])
    if not isinstance(labels, list):
        return set()
    return {str(label).strip().lower() for label in labels if str(label).strip()}


def _all_paths_within(paths: list[str], prefixes: tuple[str, ...]) -> bool:
    return bool(paths) and all(any(path == prefix or path.startswith(prefix) for prefix in prefixes) for path in paths)


def assess_pr_handoff_policy(work_order: WorkOrder, changed_files: list[str], verification_passed: bool) -> dict[str, Any]:
    labels = _work_order_labels(work_order)
    size_safe = bool(labels & SAFE_READY_SIZE_LABELS)
    risk_low = "risk:low" in labels
    explicit_safe = "autonomy:safe" in labels or (risk_low and size_safe)
    docs_style = work_order.lane == "main" and work_order.metadata.get("area") == "docs"
    ready_lane = work_order.lane == "opencode" or docs_style
    if work_order.lane == "opencode":
        low_risk_paths = _all_paths_within(changed_files, LOW_RISK_OPENCODE_PREFIXES)
    elif docs_style:
        low_risk_paths = _all_paths_within(changed_files, LOW_RISK_DOC_PREFIXES)
    else:
        low_risk_paths = False
    small_change = 0 < len(changed_files) <= SAFE_AUTO_MERGE_MAX_CHANGED_FILES
    ready_pr = verification_passed and explicit_safe and ready_lane and low_risk_paths
    auto_merge = ready_pr and small_change
    return {
        "ready_pr": ready_pr,
        "enable_auto_merge": auto_merge,
        "safe_for_ready_pr": ready_pr,
        "explicit_safe": explicit_safe,
        "small_change": small_change,
        "low_risk_paths": low_risk_paths,
        "docs_style": docs_style,
    }


def next_action_for_handoff(commit_sha: str | None, handoff: dict[str, Any] | None) -> str:
    if not commit_sha:
        return "no_changes_needed"
    if not handoff:
        return "review_or_merge"
    if handoff.get("auto_merge", {}).get("status") == "enabled":
        return "wait_for_auto_merge"
    if handoff.get("status") == "published":
        return "review_pull_request"
    push_status = handoff.get("push", {}).get("status")
    if push_status == "success":
        return "open_pull_request_manually"
    return "push_branch_manually"


def main() -> int:
    parser = argparse.ArgumentParser(description="Pick the next MUTX task and prepare a worker invocation")
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
    parser.add_argument("--task-id", help="Execute a specific queued or running task by id")
    parser.add_argument("--execute", action="store_true", help="Execute the selected lane preview command")
    args = parser.parse_args()

    paths = LanePaths(
        repo_root=args.repo_root,
        backend_worktree=args.backend_worktree,
        frontend_worktree=args.frontend_worktree,
        backend_candidates=split_candidates(args.backend_candidates),
        frontend_candidates=split_candidates(args.frontend_candidates),
    )
    lane_state = load_lane_state(args.lane_state)

    while True:
        queue = load_queue(args.queue)
        if args.task_id:
            item = find_item(queue, args.task_id)
            if item is None:
                print(json.dumps({"status": "missing_task", "task_id": args.task_id}, indent=2))
                return 1
            if item.get("status") not in {"queued", "running"}:
                print(
                    json.dumps(
                        {
                            "status": "task_not_dispatchable",
                            "task_id": args.task_id,
                            "task_status": item.get("status"),
                        },
                        indent=2,
                    )
                )
                return 1
        else:
            item = select_next_item(queue)
            if item is None:
                print(json.dumps({"status": "idle"}, indent=2))
                return 0

        work_order = build_work_order(item, paths)
        execution_lane = work_order.runner if work_order.runner in {"codex", "opencode", "main"} else work_order.lane
        if is_lane_paused(lane_state, execution_lane):
            reason = lane_reason(lane_state, execution_lane) or "lane_paused"
            if args.task_id:
                print(
                    json.dumps(
                        {
                            "status": "lane_paused",
                            "task_id": work_order.id,
                            "lane": work_order.lane,
                            "runner": work_order.runner,
                            "reason": reason,
                        },
                        indent=2,
                    )
                )
                return 1
            set_status(
                queue,
                work_order.id,
                "parked",
                lane=work_order.lane,
                runner=work_order.runner,
                note=f"lane paused: {reason}",
            )
            save_queue(args.queue, queue)
            report = build_report(
                task_id=work_order.id,
                lane=work_order.lane,
                status="parked",
                summary=f"lane paused: {reason}",
                worktree=work_order.worktree,
                blocker_class=reason,
                next_action="wait_for_lane_resume",
            )
            append_jsonl(Path(args.report_log), report)
            continue
        break

    work_order_path = persist_work_order(work_order, Path(args.output_dir))
    command = runner_command(work_order_path, work_order.runner, execute=args.execute)

    payload = {
        "status": "prepared",
        "task_id": work_order.id,
        "lane": work_order.lane,
        "runner": work_order.runner,
        "work_order_path": str(work_order_path),
        "command": command,
        "worktree": work_order.worktree,
    }

    if not is_git_worktree(work_order.worktree):
        set_status(
            queue,
            work_order.id,
            "blocked",
            lane=work_order.lane,
            runner=work_order.runner,
            note=f"Invalid worktree: {work_order.worktree}",
            work_order_path=str(work_order_path),
        )
        save_queue(args.queue, queue)
        report = build_report(
            task_id=work_order.id,
            lane=work_order.lane,
            status="blocked",
            summary="Invalid worktree",
            worktree=work_order.worktree,
            blocker_class="invalid_worktree",
            next_action="repair_worktree_mapping",
        )
        append_jsonl(Path(args.report_log), report)
        payload["status"] = "blocked"
        print(json.dumps(payload, indent=2, sort_keys=True))
        return 1

    set_status(
        queue,
        work_order.id,
        "running",
        lane=work_order.lane,
        runner=work_order.runner,
        note="work order prepared",
        work_order_path=str(work_order_path),
    )
    save_queue(args.queue, queue)

    if not args.execute:
        print(json.dumps(payload, indent=2, sort_keys=True))
        return 0

    result = subprocess.run(command, text=True, capture_output=True, cwd=args.repo_root)
    payload["exit_code"] = result.returncode
    payload["stdout"] = result.stdout
    payload["stderr"] = result.stderr

    runner_payload = None
    if result.stdout.strip():
        try:
            runner_payload = json.loads(result.stdout)
        except json.JSONDecodeError:
            runner_payload = None
    if runner_payload:
        payload["runner_payload"] = runner_payload

    changed_files = runner_payload.get("changed_files", []) if runner_payload else []
    verification = runner_payload.get("verification", []) if runner_payload else [{"command": "runner_preview", "exit_code": result.returncode}]
    verification_passed = runner_payload.get("verification_passed", result.returncode == 0) if runner_payload else (result.returncode == 0)
    blocker_class = runner_payload.get("blocker_class") if runner_payload else None

    queue = load_queue(args.queue)
    if result.returncode == 0 and verification_passed:
        commit_sha = None
        branch = current_branch(work_order.worktree)
        handoff = None
        if changed_files:
            commit_sha = commit_tracked_files(
                work_order.worktree,
                changed_files,
                f"autonomy({work_order.lane}): {work_order.title}",
            )
        note = "runner completed successfully"
        publication_policy = assess_pr_handoff_policy(work_order, changed_files, verification_passed)
        payload["publication_policy"] = publication_policy
        if commit_sha:
            note += f"; committed {commit_sha[:8]}"
            if branch:
                handoff = publish_branch_with_pr(
                    work_order.worktree,
                    branch,
                    title=f"autonomy({work_order.lane}): {work_order.title}",
                    body=build_pr_body(work_order, changed_files, verification),
                    draft=not publication_policy["ready_pr"],
                    enable_auto_merge=publication_policy["enable_auto_merge"],
                )
                note += f"; {handoff['note']}"
        pr_ref = None
        if handoff:
            pr_ref = handoff.get("pr", {}).get("url") or handoff.get("branch")
        elif branch:
            pr_ref = branch
        if handoff:
            payload["handoff"] = handoff
        if pr_ref:
            payload["pr_ref"] = pr_ref
        set_status(
            queue,
            work_order.id,
            "completed",
            lane=work_order.lane,
            runner=work_order.runner,
            note=note,
            work_order_path=str(work_order_path),
        )
        report = build_report(
            task_id=work_order.id,
            lane=work_order.lane,
            status="completed",
            summary=note,
            worktree=work_order.worktree,
            changed_files=changed_files,
            verification=verification,
            next_action=next_action_for_handoff(commit_sha, handoff),
            pr_ref=pr_ref,
            handoff=handoff,
        )
    else:
        blocker = blocker_class or ("verification_failed" if result.returncode == 0 and not verification_passed else "runner_failure")
        set_status(
            queue,
            work_order.id,
            "failed",
            lane=work_order.lane,
            runner=work_order.runner,
            note=f"runner failed: {blocker}",
            work_order_path=str(work_order_path),
        )
        if blocker in {"quota_exceeded", "auth_failure", "provider_failure"}:
            lane_state = pause_lane(lane_state, execution_lane, reason=blocker, source=work_order.id)
            save_lane_state(args.lane_state, lane_state)
        report = build_report(
            task_id=work_order.id,
            lane=work_order.lane,
            status="failed",
            summary=f"runner failed: {blocker}",
            worktree=work_order.worktree,
            changed_files=changed_files,
            verification=verification,
            blocker_class=blocker,
            next_action="inspect_runner_output",
        )
    save_queue(args.queue, queue)
    append_jsonl(Path(args.report_log), report)
    print(json.dumps(payload, indent=2, sort_keys=True))
    return result.returncode if result.returncode != 0 else (0 if verification_passed else 2)


if __name__ == "__main__":
    raise SystemExit(main())
