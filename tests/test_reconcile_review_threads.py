from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
MODULE_PATH = AUTONOMY_DIR / "reconcile_review_threads.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


THREADS = load_module("reconcile_review_threads", MODULE_PATH)


def test_is_bot_only_thread_accepts_codex_connector() -> None:
    thread = {
        "comments": {
            "nodes": [
                {
                    "author": {"login": "chatgpt-codex-connector"},
                    "createdAt": "2026-04-05T11:25:27Z",
                },
            ]
        }
    }
    assert THREADS.is_bot_only_thread(thread) is True


def test_should_auto_resolve_thread_requires_newer_pr_update_and_same_path() -> None:
    thread = {
        "id": "thread-1",
        "isResolved": False,
        "isOutdated": False,
        "path": "scripts/autonomy/run_opencode_lane.py",
        "comments": {
            "nodes": [
                {
                    "author": {"login": "chatgpt-codex-connector"},
                    "createdAt": "2026-04-05T11:25:27Z",
                    "url": "https://example.com",
                }
            ]
        },
    }

    assert (
        THREADS.should_auto_resolve_thread(
            thread,
            pr_updated_at="2026-04-05T11:30:27Z",
            changed_files=["scripts/autonomy/run_opencode_lane.py"],
        )
        is True
    )

    assert (
        THREADS.should_auto_resolve_thread(
            thread,
            pr_updated_at="2026-04-05T11:20:27Z",
            changed_files=["scripts/autonomy/run_opencode_lane.py"],
        )
        is False
    )

    assert (
        THREADS.should_auto_resolve_thread(
            thread,
            pr_updated_at="2026-04-05T11:30:27Z",
            changed_files=["scripts/autonomy/reconcile_prs.py"],
        )
        is False
    )
