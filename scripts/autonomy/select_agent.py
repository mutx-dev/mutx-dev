from __future__ import annotations

import argparse
import json
from pathlib import Path


AREA_TO_AGENT = {
    "area:api": "control-plane-steward",
    "area:web": "operator-surface-builder",
    "area:auth": "auth-identity-guardian",
    "area:cli-sdk": "cli-sdk-contract-keeper",
    "area:runtime": "runtime-protocol-engineer",
    "area:test": "qa-reliability-engineer",
    "area:infra": "infra-delivery-operator",
    "area:ops": "observability-sre",
    "area:docs": "docs-drift-curator",
}

HIGH_RISK_LABELS = {"risk:high", "area:auth", "area:infra", "area:runtime"}
SAFE_SIZE_LABELS = {"size:xs", "size:s"}


def choose_agent(labels: list[str]) -> str:
    for label in labels:
        if label in AREA_TO_AGENT:
            return AREA_TO_AGENT[label]
    return "mission-control-orchestrator"


def choose_lane(labels: list[str]) -> str:
    label_set = set(labels)
    if label_set & HIGH_RISK_LABELS:
        return "human-gated"
    if "autonomy:safe" in label_set and label_set & SAFE_SIZE_LABELS:
        return "safe-auto-merge"
    return "staging-first"


def main() -> None:
    parser = argparse.ArgumentParser(description="Select MUTX autonomous agent owner and lane")
    parser.add_argument("--issue", type=int, default=None, help="Issue number for traceability")
    parser.add_argument(
        "--labels",
        nargs="*",
        default=[],
        help="GitHub labels such as area:api autonomy:ready risk:low",
    )
    parser.add_argument(
        "--registry",
        default="agents/registry.yml",
        help="Path to the agent registry file for traceability",
    )
    args = parser.parse_args()

    result = {
        "issue": args.issue,
        "labels": args.labels,
        "agent": choose_agent(args.labels),
        "lane": choose_lane(args.labels),
        "registry": str(Path(args.registry)),
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
