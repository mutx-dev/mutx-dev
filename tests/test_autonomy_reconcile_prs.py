from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
RECONCILE_PATH = AUTONOMY_DIR / "reconcile_prs.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


RECONCILE = load_module("reconcile_prs", RECONCILE_PATH)


def make_pr(**overrides):
    payload = {
        "number": 42,
        "title": "autonomy(main): tighten reconcile policy",
        "headRefName": "autonomy/docs-drift-curator/issue-42-tighten-reconcile-policy",
        "isDraft": True,
        "autoMergeRequest": None,
        "labels": [{"name": "risk:low"}, {"name": "size:s"}, {"name": "autonomy:safe"}],
        "changedFiles": 2,
        "files": [
            {"path": "scripts/autonomy/reconcile_prs.py"},
            {"path": "tests/test_autonomy_reconcile_prs.py"},
        ],
        "statusCheckRollup": [{"conclusion": "SUCCESS"}],
        "url": "https://example.test/pr/42",
    }
    payload.update(overrides)
    return payload


def test_assess_pr_reconciliation_policy_allows_safe_green_autonomy_changes() -> None:
    policy = RECONCILE.assess_pr_reconciliation_policy(make_pr())

    assert policy["ready_pr"] is True
    assert policy["enable_auto_merge"] is True
    assert policy["safe_path_group"] == "autonomy"
    assert policy["blocked_by"] is None


def test_assess_pr_reconciliation_policy_rejects_high_risk_paths() -> None:
    policy = RECONCILE.assess_pr_reconciliation_policy(
        make_pr(
            files=[
                {"path": "scripts/autonomy/reconcile_prs.py"},
                {"path": "src/api/main.py"},
            ]
        )
    )

    assert policy["ready_pr"] is False
    assert policy["blocked_by"] == "high_risk_paths"


def test_reconcile_pull_request_promotes_draft_and_enables_auto_merge(monkeypatch) -> None:
    calls: list[tuple[str, int | str | None]] = []

    def fake_promote_pr_ready(path: str, pr_number: int | str | None) -> dict[str, object]:
        calls.append(("ready", pr_number))
        return {"status": "ready"}

    def fake_enable_pr_auto_merge(path: str, pr_number: int | str | None, *, merge_method: str = "squash") -> dict[str, object]:
        calls.append(("auto_merge", pr_number))
        return {"status": "enabled", "merge_method": merge_method}

    monkeypatch.setattr(RECONCILE, "promote_pr_ready", fake_promote_pr_ready)
    monkeypatch.setattr(RECONCILE, "enable_pr_auto_merge", fake_enable_pr_auto_merge)

    result = RECONCILE.reconcile_pull_request("/repo", make_pr())

    assert result["status"] == "reconciled"
    assert result["ready"]["status"] == "ready"
    assert result["auto_merge"]["status"] == "enabled"
    assert calls == [("ready", 42), ("auto_merge", 42)]


def test_reconcile_pull_request_skips_when_checks_are_not_green(monkeypatch) -> None:
    ready_calls: list[int] = []
    auto_calls: list[int] = []

    def fake_promote_pr_ready(path: str, pr_number: int | str | None) -> dict[str, object]:
        ready_calls.append(int(pr_number or 0))
        return {"status": "ready"}

    def fake_enable_pr_auto_merge(path: str, pr_number: int | str | None, *, merge_method: str = "squash") -> dict[str, object]:
        auto_calls.append(int(pr_number or 0))
        return {"status": "enabled", "merge_method": merge_method}

    monkeypatch.setattr(RECONCILE, "promote_pr_ready", fake_promote_pr_ready)
    monkeypatch.setattr(RECONCILE, "enable_pr_auto_merge", fake_enable_pr_auto_merge)

    result = RECONCILE.reconcile_pull_request(
        "/repo",
        make_pr(statusCheckRollup=[{"state": "PENDING"}]),
    )

    assert result["status"] == "skipped"
    assert result["reason"] == "checks_not_green"
    assert ready_calls == []
    assert auto_calls == []
