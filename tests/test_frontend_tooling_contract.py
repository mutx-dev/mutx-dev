from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_lint_script_covers_the_repo_instead_of_a_curated_allowlist() -> None:
    package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

    assert package_json["scripts"]["lint"] == "eslint . --max-warnings=0"


def test_next_16_uses_one_react_19_runtime_and_type_contract() -> None:
    package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    dependencies = package_json["dependencies"]
    dev_dependencies = package_json["devDependencies"]

    assert dependencies["react"] == dependencies["react-dom"]
    assert dependencies["react"].lstrip("^~").split(".", 1)[0] == "19"
    assert dev_dependencies["@types/react"].lstrip("^~").split(".", 1)[0] == "19"
    assert dev_dependencies["@types/react-dom"].lstrip("^~").split(".", 1)[0] == "19"
    assert dependencies["lucide-react"].lstrip("^~").split(".", 1)[0] == "1"
