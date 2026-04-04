from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_lint_script_covers_the_repo_instead_of_a_curated_allowlist() -> None:
    package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

    assert package_json["scripts"]["lint"] == "eslint . --max-warnings=0"
