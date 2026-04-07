from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / 'scripts' / 'autonomy'
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
RECONCILE_PATH = AUTONOMY_DIR / 'reconcile_prs.py'


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


RECONCILE = load_module('reconcile_prs', RECONCILE_PATH)


def test_safe_to_promote_accepts_green_autonomy_self_hosting_shape() -> None:
    pr = {'title': 'feat(autonomy): add lightweight task claim leases', 'headRefName': 'autonomy/lease-coordination'}
    files = [
        'scripts/autonomy/daemon_main.py',
        'scripts/autonomy/lane_contract.py',
        'scripts/autonomy/orchestrator_main.py',
        'scripts/autonomy/queue_state.py',
        'scripts/autonomy/worktree_utils.py',
        'tests/test_autonomy_daemon_ops.py',
        'tests/test_autonomy_lane_contract.py',
    ]

    assert RECONCILE.safe_to_promote(pr, files) is True


def test_safe_to_promote_accepts_small_sdk_coverage_pr() -> None:
    pr = {'title': 'ci: add coverage for sdk/mutx/observability.py [abc123]', 'headRefName': 'feature/coverage-observability'}
    files = ['tests/test_sdk_observability_contract.py']

    assert RECONCILE.safe_to_promote(pr, files) is True


def test_safe_to_promote_accepts_dependabot_pr() -> None:
    pr = {'title': 'chore(deps-dev): bump electron', 'headRefName': 'dependabot/npm_and_yarn/electron-39.8.5'}
    files = ['package.json', 'package-lock.json']

    assert RECONCILE.safe_to_promote(pr, files) is True


def test_yolo_merge_allowed_for_blocked_green_safe_pr() -> None:
    pr = {'mergeStateStatus': 'BLOCKED'}

    assert RECONCILE.yolo_merge_allowed(pr, green=True, safe=True) is True


def test_safe_to_promote_rejects_stub_only_pr() -> None:
    pr = {'title': '[autonomy] Add error handling to `sdk/mutx/agents.py`', 'headRefName': 'autonomy/stub-agents'}
    files = ['autonomy_stubs/error_agents.md']

    assert RECONCILE.safe_to_promote(pr, files) is False
