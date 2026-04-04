from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
MODULE_PATH = AUTONOMY_DIR / "sync_github_issues.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


SYNC = load_module("sync_github_issues", MODULE_PATH)


def test_normalize_issue_extracts_area_paths_and_verification() -> None:
    issue = {
        "number": 42,
        "title": "agent: tighten docs truth",
        "body": """
## Area

docs

## Task

Tighten docs drift around the claimed governance metrics route.

## Acceptance criteria

- git diff --check -- docs/claim-to-reality-gap-matrix.md docs/api/openapi.json
- Keep `docs/claim-to-reality-gap-matrix.md` and `docs/api/openapi.json` aligned.

## Likely files or surfaces

`docs/claim-to-reality-gap-matrix.md`
`docs/api/openapi.json`
""".strip(),
        "labels": [{"name": "autonomy:ready"}, {"name": "risk:low"}, {"name": "size:s"}],
        "url": "https://github.com/mutx-dev/mutx-dev/issues/42",
    }

    payload = SYNC.normalize_issue(issue)

    assert payload is not None
    assert payload["id"] == "gh-issue-42"
    assert payload["area"] == "area:docs"
    assert "docs/claim-to-reality-gap-matrix.md" in payload["allowed_paths"]
    assert any("git diff --check" in cmd for cmd in payload["verification"])


def test_normalize_issue_skips_non_renderable_body() -> None:
    issue = {
        "number": 99,
        "title": "bad issue",
        "body": "file:///tmp/issue.md",
        "labels": [{"name": "autonomy:ready"}],
        "url": "https://github.com/mutx-dev/mutx-dev/issues/99",
    }

    assert SYNC.normalize_issue(issue) is None
