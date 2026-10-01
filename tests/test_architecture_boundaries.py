"""Enforce core ownership boundaries as legacy implementations are retired."""

import ast
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
MONITORS = (
    "src/api/services/monitor.py",
    "src/api/services/monitoring.py",
)


@pytest.mark.parametrize("path", MONITORS)
def test_monitor_cannot_fabricate_runtime_evidence(path):
    tree = ast.parse((ROOT / path).read_text())
    violations = []
    for node in ast.walk(tree):
        targets = []
        if isinstance(node, ast.Assign):
            targets = node.targets
        elif isinstance(node, ast.AnnAssign) and node.value is not None:
            targets = [node.target]
        elif isinstance(node, ast.AugAssign):
            targets = [node.target]
        for target in targets:
            if isinstance(target, ast.Attribute) and target.attr == "last_heartbeat":
                violations.append(f"line {node.lineno}: fabricated runtime heartbeat")
            if isinstance(target, ast.Attribute) and target.attr == "status":
                value = ast.unparse(node.value)
                if value in ("'running'", '"running"') or value.endswith(
                    (".RUNNING", ".RUNNING.value")
                ):
                    violations.append(f"line {node.lineno}: unobserved running state")
        if isinstance(node, ast.Call):
            for keyword in node.keywords:
                if keyword.arg == "status":
                    value = ast.unparse(keyword.value)
                    if value in ("'running'", '"running"') or value.endswith(
                        (".RUNNING", ".RUNNING.value")
                    ):
                        violations.append(f"line {node.lineno}: unobserved running record")
                if keyword.arg == "last_heartbeat" and (
                    isinstance(node.func, ast.Attribute)
                    and node.func.attr == "values"
                    or isinstance(node.func, ast.Name)
                    and node.func.id in ("Agent", "Deployment")
                ):
                    violations.append(f"line {node.lineno}: fabricated runtime heartbeat")
    assert not violations, f"{path}: " + "; ".join(violations)


@pytest.mark.parametrize("path", MONITORS)
def test_background_monitor_has_no_second_recovery_owner(path):
    tree = ast.parse((ROOT / path).read_text())
    imports = [
        ast.unparse(node)
        for node in ast.walk(tree)
        if isinstance(node, (ast.Import, ast.ImportFrom))
    ]
    assert not any("self_healer" in statement for statement in imports)
