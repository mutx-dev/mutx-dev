from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Any

LOW_RISK_PREFIXES = (
    'components/',
    'app/',
    'docs/',
    'whitepaper.md',
)
LOW_RISK_AUTONOMY_PREFIXES = (
    'scripts/autonomy/',
    'tests/test_autonomy_',
)
LOW_RISK_SDK_COVERAGE_PREFIXES = (
    'tests/test_sdk_',
)
DEPENDABOT_PREFIX = 'dependabot/'
SAFE_AUTONOMY_MAX_CHANGED_FILES = 8
SAFE_SDK_COVERAGE_MAX_CHANGED_FILES = 2
NON_ACTIONABLE_MERGE_STATES = {'DIRTY', 'UNKNOWN', 'UNSTABLE'}
YOLO_MERGE_STATES = {'CLEAN', 'BLOCKED', 'HAS_HOOKS', 'UNSTABLE'}


def gh(args: list[str], cwd: str | Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(['gh', *args], cwd=str(cwd), text=True, capture_output=True)


def load_open_candidate_prs(repo_root: str | Path) -> list[dict[str, Any]]:
    result = gh(
        [
            'pr',
            'list',
            '--limit',
            '100',
            '--json',
            'number,title,isDraft,mergeStateStatus,headRefName,baseRefName,autoMergeRequest,statusCheckRollup,reviewDecision',
        ],
        repo_root,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)
    prs = json.loads(result.stdout)
    candidates: list[dict[str, Any]] = []
    for pr in prs:
        head = str(pr.get('headRefName', ''))
        if head.startswith('autonomy/') or head.startswith(DEPENDABOT_PREFIX):
            candidates.append(pr)
    return candidates


def pr_changed_files(pr_number: int, repo_root: str | Path) -> list[str]:
    result = gh(['pr', 'diff', str(pr_number), '--name-only'], repo_root)
    if result.returncode != 0:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def checks_green(status_rollup: list[dict[str, Any]]) -> bool:
    if not status_rollup:
        return False
    pending = False
    for item in status_rollup:
        typename = item.get('__typename')
        if typename == 'CheckRun':
            status = item.get('status')
            conclusion = item.get('conclusion')
            if status != 'COMPLETED':
                pending = True
                continue
            if conclusion not in {'SUCCESS', 'SKIPPED', 'NEUTRAL'}:
                return False
        elif typename == 'StatusContext':
            state = item.get('state')
            if state == 'PENDING':
                pending = True
                continue
            if state not in {'SUCCESS', 'EXPECTED'}:
                return False
    return not pending


def low_risk(files: list[str]) -> bool:
    return bool(files) and all(any(path == prefix or path.startswith(prefix) for prefix in LOW_RISK_PREFIXES) for path in files)


def autonomy_self_hosting(files: list[str]) -> bool:
    return bool(files) and all(any(path == prefix or path.startswith(prefix) for prefix in LOW_RISK_AUTONOMY_PREFIXES) for path in files)


def sdk_coverage_only(pr: dict[str, Any], files: list[str]) -> bool:
    title = str(pr.get('title') or '')
    return (
        title.startswith('ci: add coverage for sdk/mutx/')
        and bool(files)
        and all(any(path == prefix or path.startswith(prefix) for prefix in LOW_RISK_SDK_COVERAGE_PREFIXES) for path in files)
    )


def dependabot_safe(pr: dict[str, Any], files: list[str]) -> bool:
    head = str(pr.get('headRefName') or '')
    return head.startswith(DEPENDABOT_PREFIX) and bool(files)


def small(files: list[str]) -> bool:
    return 0 < len(files) <= 3


def safe_to_promote(pr: dict[str, Any], files: list[str]) -> bool:
    if low_risk(files) and small(files):
        return True
    if autonomy_self_hosting(files) and 0 < len(files) <= SAFE_AUTONOMY_MAX_CHANGED_FILES:
        return True
    if sdk_coverage_only(pr, files) and 0 < len(files) <= SAFE_SDK_COVERAGE_MAX_CHANGED_FILES:
        return True
    if dependabot_safe(pr, files):
        return True
    return False


def promote_ready(pr_number: int, repo_root: str | Path) -> dict[str, Any]:
    result = gh(['pr', 'ready', str(pr_number)], repo_root)
    return {'ok': result.returncode == 0, 'stdout': result.stdout[-2000:], 'stderr': result.stderr[-2000:]}


def enable_auto_merge(pr_number: int, repo_root: str | Path) -> dict[str, Any]:
    result = gh(['pr', 'merge', str(pr_number), '--auto', '--squash'], repo_root)
    return {'ok': result.returncode == 0, 'stdout': result.stdout[-2000:], 'stderr': result.stderr[-2000:]}


def admin_merge(pr_number: int, repo_root: str | Path) -> dict[str, Any]:
    result = gh(['pr', 'merge', str(pr_number), '--squash', '--delete-branch', '--admin'], repo_root)
    return {'ok': result.returncode == 0, 'stdout': result.stdout[-2000:], 'stderr': result.stderr[-2000:]}


def yolo_merge_allowed(pr: dict[str, Any], *, green: bool, safe: bool) -> bool:
    merge_state = str(pr.get('mergeStateStatus') or '')
    return green and safe and merge_state in YOLO_MERGE_STATES


def has_approved_review(pr: dict[str, Any]) -> bool:
    return str(pr.get('reviewDecision') or '').upper() == 'APPROVED'


def main() -> int:
    parser = argparse.ArgumentParser(description='Reconcile safe PRs into ready/auto/admin-merge state')
    parser.add_argument('--repo-root', default=os.environ.get('MUTX_REPO_ROOT', '/Users/fortune/MUTX'))
    parser.add_argument('--yolo', action='store_true', default=True)
    args = parser.parse_args()

    repo_root = Path(args.repo_root)
    prs = load_open_candidate_prs(repo_root)
    actions: list[dict[str, Any]] = []
    for pr in prs:
        number = int(pr['number'])
        files = pr_changed_files(number, repo_root)
        green = checks_green(pr.get('statusCheckRollup') or [])
        safe = safe_to_promote(pr, files)
        approved = has_approved_review(pr)
        actionable = str(pr.get('mergeStateStatus') or '') not in NON_ACTIONABLE_MERGE_STATES
        entry: dict[str, Any] = {
            'number': number,
            'title': pr.get('title'),
            'green': green,
            'safe': safe,
            'approved': approved,
            'actionable': actionable,
            'merge_state': pr.get('mergeStateStatus'),
            'files': files,
        }
        if pr.get('isDraft') and safe and actionable:
            entry['ready'] = promote_ready(number, repo_root)
            pr['isDraft'] = False if entry['ready'].get('ok') else pr.get('isDraft')
        if not pr.get('isDraft') and safe and green and approved:
            if args.yolo and yolo_merge_allowed(pr, green=green, safe=safe):
                entry['admin_merge'] = admin_merge(number, repo_root)
            elif actionable and not pr.get('autoMergeRequest'):
                entry['auto_merge'] = enable_auto_merge(number, repo_root)
        actions.append(entry)
    print(json.dumps(actions, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
