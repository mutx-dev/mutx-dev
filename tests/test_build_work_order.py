from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
MODULE_PATH = AUTONOMY_DIR / "build_work_order.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


WORK_ORDER = load_module("build_work_order", MODULE_PATH)


def test_normalize_issue_body_rewrites_local_file_reference() -> None:
    issue = {
        "body": "file:///tmp/issue_auth.md",
        "html_url": "https://github.com/mutx-dev/mutx-dev/issues/3394",
    }

    body = WORK_ORDER.normalize_issue_body(issue)

    assert "malformed" in body.lower()
    assert "file:///tmp/issue_auth.md" in body
    assert issue["html_url"] in body


def test_normalize_issue_body_leaves_normal_markdown_alone() -> None:
    issue = {"body": "## Summary\n\nUse `docs/api/openapi.json`."}

    body = WORK_ORDER.normalize_issue_body(issue)

    assert body == issue["body"]
