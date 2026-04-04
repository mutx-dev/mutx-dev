from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from select_agent import choose_agent, choose_lane


AREA_PRIORITY = {
    "area:test": 100,
    "area:cli-sdk": 90,
    "area:api": 80,
    "area:web": 70,
    "area:docs": 60,
    "area:ops": 50,
    "area:auth": 40,
    "area:runtime": 30,
    "area:infra": 20,
}

RISK_PRIORITY = {
    "risk:low": 30,
    "risk:medium": 10,
    "risk:high": -100,
}

SIZE_PRIORITY = {
    "size:xs": 30,
    "size:s": 20,
    "size:m": 5,
    "size:l": -20,
}

REVIEWER_BY_AGENT = {
    "control-plane-steward": "qa-reliability-engineer",
    "operator-surface-builder": "qa-reliability-engineer",
    "auth-identity-guardian": "control-plane-steward",
    "cli-sdk-contract-keeper": "qa-reliability-engineer",
    "runtime-protocol-engineer": "observability-sre",
    "qa-reliability-engineer": "control-plane-steward",
    "infra-delivery-operator": "observability-sre",
    "observability-sre": "control-plane-steward",
    "docs-drift-curator": "qa-reliability-engineer",
}

BLOCKING_LABELS = {"autonomy:blocked", "autonomy:claimed"}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:48] or "task"


def score_issue(labels: list[str]) -> int:
    score = 0
    for label in labels:
        score += AREA_PRIORITY.get(label, 0)
        score += RISK_PRIORITY.get(label, 0)
        score += SIZE_PRIORITY.get(label, 0)
    if "autonomy:safe" in labels:
        score += 10
    return score


def extract_labels(issue: dict[str, Any]) -> list[str]:
    labels = []
    for label in issue.get("labels", []):
        if isinstance(label, dict) and label.get("name"):
            labels.append(label["name"])
    return labels


def choose_issue(issues: list[dict[str, Any]]) -> dict[str, Any] | None:
    eligible = []
    for issue in issues:
        labels = extract_labels(issue)
        if any(label in BLOCKING_LABELS for label in labels):
            continue
        if "autonomy:ready" not in labels:
            continue
        eligible.append((score_issue(labels), issue))
    if not eligible:
        return None
    eligible.sort(key=lambda item: (item[0], item[1]["number"]), reverse=True)
    return eligible[0][1]


def normalize_issue_body(issue: dict[str, Any]) -> str:
    body = str(issue.get("body", "") or "").strip()
    if not body:
        return "No issue body provided."
    if body.startswith("file://"):
        url = issue.get("html_url") or ""
        return (
            "## Context\n\n"
            "This issue body was malformed when created and pointed at a local file path that does not render on GitHub.\n\n"
            f"Original body: `{body}`\n\n"
            f"Issue URL: {url}\n"
        )
    return body


def build_work_order(issue: dict[str, Any]) -> dict[str, Any]:
    labels = extract_labels(issue)
    agent = choose_agent(labels)
    lane = choose_lane(labels)
    reviewer = REVIEWER_BY_AGENT.get(agent, "qa-reliability-engineer")
    title = issue.get("title", "")
    branch = f"autonomy/{agent}/issue-{issue['number']}-{slugify(title)}"
    return {
        "issue": issue["number"],
        "title": title,
        "url": issue.get("html_url"),
        "labels": labels,
        "agent": agent,
        "reviewer": reviewer,
        "lane": lane,
        "branch": branch,
        "acceptance": normalize_issue_body(issue),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Choose the next autonomous MUTX work order")
    parser.add_argument("--queue", required=True, help="JSON file containing GitHub issue payloads")
    parser.add_argument(
        "--output", required=True, help="Path to write the selected work order JSON"
    )
    args = parser.parse_args()

    queue_path = Path(args.queue)
    output_path = Path(args.output)
    issues = json.loads(queue_path.read_text())
    selected = choose_issue(issues)

    if selected is None:
        output_path.write_text(json.dumps({"status": "idle"}, indent=2) + "\n")
        return 0

    work_order = build_work_order(selected)
    output_path.write_text(json.dumps(work_order, indent=2, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
