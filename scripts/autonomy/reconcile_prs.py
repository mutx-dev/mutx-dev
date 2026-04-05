from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from worktree_utils import (
    enable_pr_auto_merge,
    gh_authenticated,
    gh_cli_available,
    promote_pr_ready,
    run_gh,
    summarize_handoff_failure,
)


SAFE_READY_SIZE_LABELS = {"size:xs", "size:s"}
SAFE_AUTO_MERGE_MAX_CHANGED_FILES = 3
LOW_RISK_OPENCODE_PREFIXES = ("app/", "components/", "lib/", "public/", "tests/")
LOW_RISK_DOC_PREFIXES = ("docs/", "whitepaper.md", "roadmap.md")
LOW_RISK_AUTONOMY_PREFIXES = ("scripts/autonomy/", "tests/test_autonomy")
PASSING_CHECK_STATES = {"success", "successful", "neutral", "skipped"}


def _label_names(pr: dict[str, Any]) -> set[str]:
    labels = pr.get("labels", [])
    if not isinstance(labels, list):
        return set()
    names: set[str] = set()
    for label in labels:
        if isinstance(label, dict):
            raw = label.get("name")
        else:
            raw = label
        normalized = str(raw or "").strip().lower()
        if normalized:
            names.add(normalized)
    return names


def _changed_files(pr: dict[str, Any]) -> list[str]:
    files = pr.get("files", [])
    if not isinstance(files, list):
        return []
    changed: list[str] = []
    for file_payload in files:
        if not isinstance(file_payload, dict):
            continue
        path = str(file_payload.get("path") or "").strip()
        if path:
            changed.append(path)
    return changed


def _all_paths_within(paths: list[str], prefixes: tuple[str, ...]) -> bool:
    return bool(paths) and all(any(path == prefix or path.startswith(prefix) for prefix in prefixes) for path in paths)


def classify_safe_path_group(changed_files: list[str]) -> str | None:
    if _all_paths_within(changed_files, LOW_RISK_OPENCODE_PREFIXES):
        return "opencode"
    if _all_paths_within(changed_files, LOW_RISK_DOC_PREFIXES):
        return "docs"
    if _all_paths_within(changed_files, LOW_RISK_AUTONOMY_PREFIXES):
        return "autonomy"
    return None


def is_autonomy_pr(pr: dict[str, Any]) -> bool:
    title = str(pr.get("title") or "").strip().lower()
    head_ref = str(pr.get("headRefName") or "").strip().lower()
    return head_ref.startswith("autonomy/") or title.startswith("autonomy(") or title.startswith("autonomy:")


def status_rollup_is_green(status_rollup: Any) -> bool:
    if not isinstance(status_rollup, list) or not status_rollup:
        return False
    saw_passing_check = False
    for check in status_rollup:
        if not isinstance(check, dict):
            return False
        conclusion = str(check.get("conclusion") or "").strip().lower()
        state = str(check.get("state") or "").strip().lower()
        if conclusion:
            if conclusion not in PASSING_CHECK_STATES:
                return False
            saw_passing_check = True
            continue
        if state:
            if state not in PASSING_CHECK_STATES:
                return False
            saw_passing_check = True
            continue
        return False
    return saw_passing_check


def assess_pr_reconciliation_policy(pr: dict[str, Any]) -> dict[str, Any]:
    labels = _label_names(pr)
    changed_files = _changed_files(pr)
    changed_count = int(pr.get("changedFiles") or len(changed_files) or 0)
    path_group = classify_safe_path_group(changed_files)
    explicit_safe = "autonomy:safe" in labels or ("risk:low" in labels and bool(labels & SAFE_READY_SIZE_LABELS))
    checks_green = status_rollup_is_green(pr.get("statusCheckRollup"))
    autonomy_candidate = is_autonomy_pr(pr)
    small_change = 0 < changed_count <= SAFE_AUTO_MERGE_MAX_CHANGED_FILES
    ready_pr = autonomy_candidate and explicit_safe and checks_green and path_group is not None
    blocked_by = None
    if not autonomy_candidate:
        blocked_by = "not_autonomy_pr"
    elif not explicit_safe:
        blocked_by = "not_explicitly_safe"
    elif not checks_green:
        blocked_by = "checks_not_green"
    elif path_group is None:
        blocked_by = "high_risk_paths"
    return {
        "autonomy_candidate": autonomy_candidate,
        "explicit_safe": explicit_safe,
        "checks_green": checks_green,
        "safe_path_group": path_group,
        "small_change": small_change,
        "ready_pr": ready_pr,
        "enable_auto_merge": ready_pr and small_change,
        "blocked_by": blocked_by,
    }


def load_open_prs(path: str | Path, *, limit: int = 50) -> dict[str, Any]:
    if not gh_cli_available():
        return {"status": "skipped", "reason": "gh_unavailable", "prs": []}
    if not gh_authenticated(path):
        return {"status": "skipped", "reason": "gh_auth_unavailable", "prs": []}
    result = run_gh(
        [
            "pr",
            "list",
            "--state",
            "open",
            "--limit",
            str(limit),
            "--json",
            "autoMergeRequest,changedFiles,files,headRefName,isDraft,labels,number,statusCheckRollup,title,url",
        ],
        path,
    )
    if result.returncode != 0:
        return {
            "status": "failed",
            "reason": summarize_handoff_failure(result.stderr, result.stdout),
            "stdout": result.stdout[-4000:],
            "stderr": result.stderr[-4000:],
            "prs": [],
        }
    try:
        payload = json.loads(result.stdout or "[]")
    except json.JSONDecodeError:
        return {"status": "failed", "reason": "invalid_pr_payload", "prs": []}
    if not isinstance(payload, list):
        return {"status": "failed", "reason": "invalid_pr_payload", "prs": []}
    return {"status": "ok", "prs": payload}


def reconcile_pull_request(path: str | Path, pr: dict[str, Any]) -> dict[str, Any]:
    policy = assess_pr_reconciliation_policy(pr)
    payload: dict[str, Any] = {
        "number": pr.get("number"),
        "url": pr.get("url"),
        "title": pr.get("title"),
        "policy": policy,
        "status": "skipped",
        "reason": policy.get("blocked_by"),
    }
    if not policy["ready_pr"]:
        return payload

    needs_ready = bool(pr.get("isDraft"))
    needs_auto_merge = policy["enable_auto_merge"] and not bool(pr.get("autoMergeRequest"))
    if not needs_ready and not needs_auto_merge:
        payload["status"] = "noop"
        payload["reason"] = "already_reconciled"
        return payload

    if needs_ready:
        ready_result = promote_pr_ready(path, pr.get("number"))
        payload["ready"] = ready_result
        if ready_result.get("status") != "ready":
            payload["status"] = "failed"
            payload["reason"] = f"ready_{ready_result.get('reason', 'handoff_failed')}"
            return payload

    if needs_auto_merge:
        auto_merge_result = enable_pr_auto_merge(path, pr.get("number"))
        payload["auto_merge"] = auto_merge_result
        if auto_merge_result.get("status") != "enabled":
            payload["status"] = "failed"
            payload["reason"] = f"auto_merge_{auto_merge_result.get('reason', 'handoff_failed')}"
            return payload

    payload["status"] = "reconciled"
    payload["reason"] = None
    return payload


def reconcile_open_prs(path: str | Path, *, limit: int = 50) -> dict[str, Any]:
    listing = load_open_prs(path, limit=limit)
    if listing.get("status") != "ok":
        return listing

    candidate_prs = [pr for pr in listing.get("prs", []) if is_autonomy_pr(pr)]
    results = [reconcile_pull_request(path, pr) for pr in candidate_prs]
    promoted = sum(1 for item in results if item.get("ready", {}).get("status") == "ready")
    auto_merge_enabled = sum(1 for item in results if item.get("auto_merge", {}).get("status") == "enabled")
    failed = [item for item in results if item.get("status") == "failed"]
    return {
        "status": "failed" if failed else "ok",
        "considered": len(candidate_prs),
        "promoted": promoted,
        "auto_merge_enabled": auto_merge_enabled,
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Promote and auto-merge safe green autonomy PRs")
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()

    result = reconcile_open_prs(Path(args.repo_root), limit=max(1, args.limit))
    print(json.dumps(result, indent=2, sort_keys=True))
    if result.get("status") == "failed":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
