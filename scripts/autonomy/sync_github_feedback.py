#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore[assignment]

DEFAULT_REPO = "mutx-dev/mutx-dev"
DEFAULT_REVIEW_MATRIX = Path("mutx-engineering-agents/_shared/REVIEW-MATRIX.md")
DEFAULT_CONTEXT_REGISTRY = Path("mutx-engineering-agents/_shared/CONTEXT-REGISTRY.md")
DEFAULT_LOOP_DOC = Path("mutx-engineering-agents/_shared/AGENT-TO-AGENT-LOOP.md")
DEFAULT_DISPATCH_DIR = Path("mutx-engineering-agents/dispatch")
DEFAULT_REPORT_DIR = Path("reports/fortune-4h")

WORKFLOW_URL_RE = re.compile(r"/actions/runs/(\d+)(?:/job/(\d+))?")
ERROR_PATH_RE = re.compile(
    r"([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+\.(?:ts|tsx|js|jsx|json|py|md|ya?ml|cjs|mjs))(?::\d+(?::\d+)?)?"
)
REVIEW_MATRIX_RE = re.compile(r"^- ([a-z0-9-]+) -> ([a-z0-9-]+)$")


def run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, text=True, capture_output=True)
    if check and result.returncode != 0:
        raise RuntimeError(
            f"Command failed ({result.returncode}): {' '.join(command)}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )
    return result


def gh_json(args: list[str]) -> Any:
    result = run(["gh", *args])
    return json.loads(result.stdout or "null")


def iso_now() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def read_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""


def parse_review_matrix(path: Path) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for line in read_text(path).splitlines():
        match = REVIEW_MATRIX_RE.match(line.strip())
        if match:
            mapping[match.group(1)] = match.group(2)
    return mapping


def agent_ids_from_review_matrix(review_matrix: dict[str, str]) -> list[str]:
    agent_ids = set(review_matrix.keys()) | set(review_matrix.values()) | {"mission-control-orchestrator"}
    return sorted(agent_ids)


def list_open_prs(repo: str) -> list[dict[str, Any]]:
    fields = ["number", "title", "url", "body", "headRefName", "author", "updatedAt"]
    return gh_json(["pr", "list", "-R", repo, "--state", "open", "--limit", "100", "--json", ",".join(fields)])


def fetch_pr_details(repo: str, number: int) -> dict[str, Any]:
    fields = [
        "number",
        "title",
        "url",
        "body",
        "headRefName",
        "author",
        "updatedAt",
        "additions",
        "deletions",
        "changedFiles",
        "reviewRequests",
        "reviews",
        "reviewDecision",
        "mergeStateStatus",
        "isDraft",
        "statusCheckRollup",
        "commits",
        "files",
    ]
    payload = gh_json(["pr", "view", "-R", repo, str(number), "--json", ",".join(fields)])
    return payload if isinstance(payload, dict) else {}


def is_agent_lane_pr(pr: dict[str, Any], agent_ids: list[str]) -> bool:
    head_ref = str(pr.get("headRefName") or "")
    body = str(pr.get("body") or "")
    title = str(pr.get("title") or "")
    if head_ref.startswith("eng/"):
        return True
    for agent_id in agent_ids:
        needle = f"@{agent_id}"
        if needle in body or agent_id in title or agent_id in head_ref:
            return True
    return False


def infer_owner_agent(head_ref: str, files: list[str], agent_ids: list[str]) -> str:
    if head_ref.startswith("eng/"):
        candidate = head_ref.split("/", 1)[1].strip()
        if candidate in agent_ids:
            return candidate

    scores: Counter[str] = Counter()
    for path in files:
        lower = path.lower()
        if lower.startswith("docs/"):
            scores["docs-drift-curator"] += 120
        if any(token in lower for token in ("auth", "token", "session")):
            scores["auth-identity-guardian"] += 140
        if lower.startswith("infrastructure/monitoring/") or any(
            token in lower for token in ("grafana", "prometheus", "monitor", "metric", "alert", "health")
        ):
            scores["observability-sre"] += 130
        elif lower.startswith("infrastructure/"):
            scores["infra-delivery-operator"] += 100
        if lower.startswith("tests/"):
            scores["qa-reliability-engineer"] += 60
        if lower.startswith("cli/") or lower.startswith("sdk/mutx/"):
            scores["cli-sdk-contract-keeper"] += 110
        if lower.startswith("src/api/"):
            scores["control-plane-steward"] += 90
        if lower.startswith("app/") or lower.startswith("components/") or lower.startswith("lib/"):
            scores["operator-surface-builder"] += 70

    if scores:
        return scores.most_common(1)[0][0]
    return "mission-control-orchestrator"


def infer_reviewer_agent(body: str, owner: str, review_matrix: dict[str, str], agent_ids: list[str]) -> str:
    for agent_id in sorted(agent_ids, key=len, reverse=True):
        if agent_id == owner:
            continue
        if f"@{agent_id}" in body or f"Requested: {agent_id}" in body or f"Requested: `{agent_id}`" in body:
            return agent_id
    return review_matrix.get(owner, "mission-control-orchestrator")


def parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def latest_commit_time(commits: list[dict[str, Any]]) -> datetime | None:
    latest: datetime | None = None
    for commit in commits:
        candidate = parse_timestamp(commit.get("committedDate") or commit.get("authoredDate"))
        if candidate and (latest is None or candidate > latest):
            latest = candidate
    return latest


def summarize_review_state(pr: dict[str, Any]) -> dict[str, Any]:
    author_login = ((pr.get("author") or {}).get("login") or "").strip()
    latest_commit = latest_commit_time(pr.get("commits") or [])
    reviews = pr.get("reviews") or []
    review_requests = pr.get("reviewRequests") or []

    def is_fresh(review: dict[str, Any]) -> bool:
        submitted = parse_timestamp(review.get("submittedAt"))
        if latest_commit is None or submitted is None:
            return True
        return submitted >= latest_commit

    distinct_approvals = [
        review
        for review in reviews
        if review.get("state") == "APPROVED"
        and ((review.get("author") or {}).get("login") or "") != author_login
        and is_fresh(review)
    ]
    distinct_change_requests = [
        review
        for review in reviews
        if review.get("state") == "CHANGES_REQUESTED"
        and ((review.get("author") or {}).get("login") or "") != author_login
        and is_fresh(review)
    ]
    author_only_reviews = [
        review for review in reviews if ((review.get("author") or {}).get("login") or "") == author_login and is_fresh(review)
    ]
    distinct_comments = [
        review
        for review in reviews
        if ((review.get("author") or {}).get("login") or "") != author_login and is_fresh(review)
    ]

    if distinct_approvals:
        return {"state": "approved", "note": "distinct approval present"}
    if distinct_change_requests:
        return {"state": "changes-requested", "note": "distinct reviewer requested changes"}
    if review_requests:
        return {"state": "review-requested", "note": "GitHub review request is live"}
    if author_only_reviews:
        return {"state": "author-only-review", "note": "latest review activity is from the PR author only"}
    if distinct_comments:
        return {"state": "commented", "note": "distinct reviewer commented but has not approved"}
    return {"state": "unrequested", "note": "no distinct GitHub reviewer is currently assigned"}


def clean_error_line(line: str) -> str:
    line = re.sub(r"^[A-Za-z0-9 _-]+\s+UNKNOWN STEP\s+\S+\s*", "", line).strip()
    line = line.replace("##[error]", "").strip()
    line = re.sub(r"\s+", " ", line)
    return line


def looks_like_repo_path(path: str) -> bool:
    if "node_modules" in path or path.startswith("/home/") or path.startswith("/Users/"):
        return False
    if path.startswith("tests/") or path.startswith("app/") or path.startswith("components/") or path.startswith("lib/"):
        return True
    if path.startswith("src/") or path.startswith("infrastructure/") or path.startswith("docs/") or path.startswith("cli/"):
        return True
    return False


class FailureExplainer:
    def __init__(self, repo: str):
        self.repo = repo
        self.cache: dict[str, dict[str, Any]] = {}

    def explain(self, failure: dict[str, Any], changed_files: list[str]) -> dict[str, Any]:
        details_url = str(failure.get("detailsUrl") or failure.get("targetUrl") or "")
        cache_key = details_url or json.dumps(failure, sort_keys=True)
        if cache_key not in self.cache:
            self.cache[cache_key] = self._fetch_explanation(failure)
        explanation = dict(self.cache[cache_key])
        culprit_path = explanation.get("path")
        if culprit_path and culprit_path in changed_files:
            explanation["scope"] = "red-pr-scoped"
        elif culprit_path:
            explanation["scope"] = "red-shared"
        else:
            explanation["scope"] = "red-unknown"
        return explanation

    def _fetch_explanation(self, failure: dict[str, Any]) -> dict[str, Any]:
        details_url = str(failure.get("detailsUrl") or failure.get("targetUrl") or "")
        summary = str(failure.get("name") or failure.get("context") or "check failed")
        match = WORKFLOW_URL_RE.search(details_url)
        if not match:
            return {"summary": summary, "error": summary, "path": None}

        run_id, job_id = match.groups()
        command = ["gh", "run", "view", "-R", self.repo, run_id]
        if job_id:
            command.extend(["--job", job_id])
        command.append("--log-failed")
        result = run(command, check=False)
        log = result.stdout or result.stderr
        if not log:
            return {"summary": summary, "error": summary, "path": None}

        error_lines: list[str] = []
        candidate_paths: list[str] = []
        lines = log.splitlines()
        for index, line in enumerate(lines):
            if "##[error]" not in line and not re.search(r"\berror\b", line, re.IGNORECASE):
                continue
            cleaned = clean_error_line(line)
            if cleaned:
                error_lines.append(cleaned)
            window = lines[max(0, index - 3) : min(len(lines), index + 3)]
            for window_line in window:
                for match in ERROR_PATH_RE.finditer(window_line):
                    path = match.group(1)
                    if looks_like_repo_path(path):
                        candidate_paths.append(path)

        culprit_path = candidate_paths[0] if candidate_paths else None
        return {
            "summary": summary,
            "error": error_lines[0] if error_lines else summary,
            "path": culprit_path,
        }


def summarize_ci_state(pr: dict[str, Any], changed_files: list[str], explainer: FailureExplainer) -> dict[str, Any]:
    checks = pr.get("statusCheckRollup") or []
    failures: list[dict[str, Any]] = []
    pending = False
    greenish = 0

    for check in checks:
        typename = check.get("__typename")
        if typename == "StatusContext":
            state = str(check.get("state") or "").upper()
            if state in {"ERROR", "FAILURE"}:
                failures.append(check)
            elif state in {"PENDING", "EXPECTED"}:
                pending = True
            elif state == "SUCCESS":
                greenish += 1
            continue

        status = str(check.get("status") or "").upper()
        conclusion = str(check.get("conclusion") or "").upper()
        if status != "COMPLETED":
            pending = True
            continue
        if conclusion in {"FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STALE", "STARTUP_FAILURE"}:
            failures.append(check)
        elif conclusion in {"SUCCESS", "NEUTRAL", "SKIPPED"}:
            greenish += 1

    if failures:
        explanation = explainer.explain(failures[0], changed_files)
        return {
            "state": explanation["scope"],
            "summary": explanation.get("summary"),
            "error": explanation.get("error"),
            "path": explanation.get("path"),
        }
    if pending:
        return {"state": "pending", "summary": "checks still running", "error": None, "path": None}
    if greenish > 0:
        return {"state": "green", "summary": "required checks currently green", "error": None, "path": None}
    return {"state": "no-checks", "summary": "no status checks reported", "error": None, "path": None}


def classify_next_action(
    owner: str,
    reviewer: str,
    review_state: dict[str, Any],
    ci_state: dict[str, Any],
) -> tuple[str, str, str]:
    review_key = review_state["state"]
    ci_key = ci_state["state"]

    if review_key == "approved" and ci_key == "green":
        return (
            "merge-ready",
            "mission-control-orchestrator",
            "Merge when policy allows; distinct approval is present and checks are green.",
        )

    if ci_key == "red-pr-scoped" or review_key == "changes-requested":
        return (
            "needs-author-fix",
            owner,
            "Address the PR-scoped blocker, then re-run review.",
        )

    if review_key in {"author-only-review", "unrequested"}:
        return (
            "needs-review-routing",
            "mission-control-orchestrator",
            "Route a distinct GitHub reviewer before asking a lane to wait on approval.",
        )

    if ci_key == "red-shared":
        return (
            "shared-ci-blocker",
            "qa-reliability-engineer",
            "Clear the shared CI blocker before pushing more PR-specific churn.",
        )

    if ci_key == "pending":
        return (
            "awaiting-ci",
            "mission-control-orchestrator",
            "Wait for checks to settle before dispatching another action.",
        )

    return (
        "awaiting-review",
        reviewer,
        "Perform the bounded review and either approve or leave a specific fix request.",
    )


def build_action_items(repo: str, review_matrix: dict[str, str]) -> list[dict[str, Any]]:
    agent_ids = agent_ids_from_review_matrix(review_matrix)
    explainer = FailureExplainer(repo)
    action_items: list[dict[str, Any]] = []

    for pr_stub in list_open_prs(repo):
        if not is_agent_lane_pr(pr_stub, agent_ids):
            continue

        pr = fetch_pr_details(repo, int(pr_stub["number"]))
        changed_files = [item.get("path", "") for item in (pr.get("files") or []) if item.get("path")]
        owner = infer_owner_agent(str(pr.get("headRefName") or ""), changed_files, agent_ids)
        reviewer = infer_reviewer_agent(str(pr.get("body") or ""), owner, review_matrix, agent_ids)
        review_state = summarize_review_state(pr)
        ci_state = summarize_ci_state(pr, changed_files, explainer)
        status, next_owner, next_action = classify_next_action(owner, reviewer, review_state, ci_state)

        note_bits = [review_state["note"]]
        if ci_state.get("summary"):
            note_bits.append(str(ci_state["summary"]))
        if ci_state.get("path"):
            note_bits.append(f"culprit: {ci_state['path']}")
        if ci_state.get("error") and ci_state.get("error") != ci_state.get("summary"):
            note_bits.append(str(ci_state["error"]))

        action_items.append(
            {
                "pr": pr["number"],
                "title": pr["title"],
                "url": pr["url"],
                "headRefName": pr["headRefName"],
                "owner": owner,
                "reviewer": reviewer,
                "status": status,
                "nextActionOwner": next_owner,
                "nextAction": next_action,
                "reviewState": review_state["state"],
                "ciState": ci_state["state"],
                "ciSummary": ci_state.get("summary"),
                "ciPath": ci_state.get("path"),
                "ciError": ci_state.get("error"),
                "note": "; ".join(bit for bit in note_bits if bit),
                "updatedAt": pr.get("updatedAt"),
                "additions": pr.get("additions"),
                "deletions": pr.get("deletions"),
                "changedFilesCount": pr.get("changedFiles"),
                "changedFiles": changed_files,
                "commitDates": [
                    commit.get("committedDate") or commit.get("authoredDate")
                    for commit in (pr.get("commits") or [])
                    if (commit.get("committedDate") or commit.get("authoredDate"))
                ],
            }
        )

    action_items.sort(key=lambda item: (item["nextActionOwner"], item["pr"]))
    return action_items


def build_shared_blockers(action_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for item in action_items:
        if item.get("ciState") != "red-shared":
            continue
        key = (str(item.get("ciPath") or item.get("ciSummary") or "shared-check"), str(item.get("ciError") or item.get("ciSummary") or "shared failure"))
        grouped.setdefault(key, []).append(item)

    blockers: list[dict[str, Any]] = []
    for (path_or_summary, error), items in grouped.items():
        if len(items) < 2:
            continue
        blocker_id = re.sub(r"[^a-z0-9]+", "-", path_or_summary.lower()).strip("-")[:60] or "shared-ci"
        blockers.append(
            {
                "id": f"shared-ci-{blocker_id}",
                "status": "shared-ci-blocker",
                "nextActionOwner": "qa-reliability-engineer",
                "nextAction": f"Clear the shared CI blocker in {path_or_summary} before more PR-level churn.",
                "ciPath": path_or_summary,
                "ciError": error,
                "prs": [item["pr"] for item in items],
                "count": len(items),
                "note": f"Blocking {len(items)} active lane PRs: {', '.join('#' + str(item['pr']) for item in items)}",
            }
        )
        for item in items:
            item["sharedCiBlockerId"] = f"shared-ci-{blocker_id}"
    blockers.sort(key=lambda item: (-item["count"], item["id"]))
    return blockers


def build_review_queue(action_items: list[dict[str, Any]]) -> dict[str, Any]:
    items = [
        {
            "pr": item["pr"],
            "title": item["title"],
            "owner": item["owner"],
            "reviewer": item["reviewer"],
            "status": item["status"],
            "risk": item["ciState"],
            "note": item["note"],
        }
        for item in action_items
        if item["status"] == "awaiting-review"
    ]
    return {"updated": iso_now(), "items": items}


def build_merge_queue(action_items: list[dict[str, Any]]) -> dict[str, Any]:
    items = [
        {
            "pr": item["pr"],
            "title": item["title"],
            "owner": item["owner"],
            "reviewer": item["reviewer"],
            "status": item["status"],
            "note": item["note"],
        }
        for item in action_items
        if item["status"] == "merge-ready"
    ]
    return {"updated": iso_now(), "items": items}


def build_action_queue(action_items: list[dict[str, Any]], shared_blockers: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "updated": iso_now(),
        "items": action_items,
        "sharedBlockers": shared_blockers,
    }


def build_report(
    repo: str,
    action_items: list[dict[str, Any]],
    shared_blockers: list[dict[str, Any]],
    hours: int,
    timezone_name: str,
) -> tuple[str, dict[str, Any]]:
    tz = ZoneInfo(timezone_name) if ZoneInfo else timezone.utc
    now = datetime.now(timezone.utc).astimezone(tz)
    window_start = now - timedelta(hours=hours)

    prs_touched = [
        item for item in action_items if (parse_timestamp(item.get("updatedAt")) or datetime.min.replace(tzinfo=timezone.utc)) >= window_start.astimezone(timezone.utc)
    ]

    commit_count = 0
    for item in action_items:
        for commit_date in item.get("commitDates", []):
            parsed = parse_timestamp(commit_date)
            if parsed and parsed >= window_start.astimezone(timezone.utc):
                commit_count += 1

    total_additions = sum(int(item.get("additions") or 0) for item in action_items)
    total_deletions = sum(int(item.get("deletions") or 0) for item in action_items)
    status_counts = Counter(item["status"] for item in action_items)
    ci_counts = Counter(item["ciState"] for item in action_items)

    lines = [
        "# Fortune 4h Pulse",
        "",
        f"Window: {window_start.strftime('%Y-%m-%d %H:%M')} → {now.strftime('%H:%M %Z')}",
        f"Repo: `{repo}`",
        "",
        f"- PRs moved in window: **{len(prs_touched)}**",
        f"- Commits on active lane PRs in window: **{commit_count}**",
        f"- Merge-ready now: **{status_counts.get('merge-ready', 0)}**",
        f"- Waiting on review routing: **{status_counts.get('needs-review-routing', 0)}**",
        f"- Active lane diff now: **+{total_additions} / -{total_deletions}**",
        f"- Shared CI blockers now: **{len(shared_blockers)}** affecting **{sum(item['count'] for item in shared_blockers)} PRs**",
        "",
        "## Right-now next moves",
    ]

    if shared_blockers:
        blocker = shared_blockers[0]
        lines.append(
            f"- **qa-reliability-engineer:** clear `{blocker['ciPath']}` — {blocker['ciError']} ({', '.join('#' + str(pr) for pr in blocker['prs'])})"
        )

    review_routing_prs = [item for item in action_items if item["status"] == "needs-review-routing"]
    if review_routing_prs:
        lines.append(
            "- **mission-control-orchestrator:** route distinct GitHub reviewers for "
            + ", ".join(f"#{item['pr']}" for item in review_routing_prs)
        )

    if not shared_blockers and not review_routing_prs:
        lines.append("- No live blockers in the lane queue right now.")

    if action_items:
        lines.extend(["", "## Active lane PRs"])
        for item in action_items[:5]:
            lines.append(
                f"- #{item['pr']} `{item['title']}` — {item['status']} / {item['ciState']} / owner `{item['owner']}`"
            )

    metrics = {
        "updated": iso_now(),
        "windowHours": hours,
        "repo": repo,
        "prsMoved": len(prs_touched),
        "commitCount": commit_count,
        "mergeReadyNow": status_counts.get("merge-ready", 0),
        "needsReviewRoutingNow": status_counts.get("needs-review-routing", 0),
        "activeLaneAdditions": total_additions,
        "activeLaneDeletions": total_deletions,
        "sharedCiBlockersNow": len(shared_blockers),
        "sharedCiBlockedPrsNow": sum(item["count"] for item in shared_blockers),
        "statusCounts": dict(status_counts),
        "ciCounts": dict(ci_counts),
    }
    return "\n".join(lines) + "\n", metrics


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync GitHub PR/CI truth into the local agent feedback loop")
    parser.add_argument("--repo", default=DEFAULT_REPO)
    parser.add_argument("--review-matrix", default=str(DEFAULT_REVIEW_MATRIX))
    parser.add_argument("--dispatch-dir", default=str(DEFAULT_DISPATCH_DIR))
    parser.add_argument("--report-dir", default=str(DEFAULT_REPORT_DIR))
    parser.add_argument("--hours", type=int, default=4)
    parser.add_argument("--timezone", default="Europe/Rome")
    args = parser.parse_args()

    review_matrix = parse_review_matrix(Path(args.review_matrix))
    if not review_matrix:
        raise RuntimeError(f"Could not parse review matrix from {args.review_matrix}")

    action_items = build_action_items(args.repo, review_matrix)
    shared_blockers = build_shared_blockers(action_items)
    review_queue = build_review_queue(action_items)
    merge_queue = build_merge_queue(action_items)
    action_queue = build_action_queue(action_items, shared_blockers)
    report_text, report_metrics = build_report(args.repo, action_items, shared_blockers, args.hours, args.timezone)

    dispatch_dir = Path(args.dispatch_dir)
    report_dir = Path(args.report_dir)

    write_json(dispatch_dir / "action-queue.json", action_queue)
    write_json(dispatch_dir / "review-queue.json", review_queue)
    write_json(dispatch_dir / "merge-queue.json", merge_queue)
    write_text(report_dir / "latest.md", report_text)
    write_json(report_dir / "latest.json", report_metrics)

    summary = {
        "actionItems": len(action_items),
        "sharedBlockers": len(shared_blockers),
        "reviewQueue": len(review_queue["items"]),
        "mergeQueue": len(merge_queue["items"]),
        "report": str(report_dir / "latest.md"),
    }
    sys.stdout.write(json.dumps(summary, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
