from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
FLEET_GEN_PATH = AUTONOMY_DIR / "generate_fleet_tasks.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


FLEET = load_module("generate_fleet_tasks", FLEET_GEN_PATH)


BASE_FLEET = {
    "roles": [
        {"id": "cto", "lane": "main", "scan_targets": ["roadmap.md", "docs/project-status.md"]},
        {"id": "cio", "lane": "main", "scan_targets": ["whitepaper.md", "docs/surfaces.md", "docs/claim-to-reality-gap-matrix.md"]},
        {"id": "backend", "lane": "codex", "scan_targets": ["src/api", "src/security", "sdk/mutx", "cli"]},
        {"id": "frontend", "lane": "opencode", "scan_targets": ["app", "components", "lib"]},
        {"id": "ux", "lane": "opencode", "scan_targets": ["app/dashboard", "components/dashboard", "components/site"]},
        {"id": "research", "lane": "main", "scan_targets": ["whitepaper.md", "docs", "README.md"]},
    ],
    "scanner_policies": {
        "max_new_tasks_per_cycle": 6,
        "max_tasks_per_role_per_cycle": 2,
        "max_tasks_per_lane_per_cycle": {"main": 3, "codex": 2, "opencode": 2},
    },
}


def write_repo_fixture(tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    (repo / "docs" / "api").mkdir(parents=True)
    (repo / "src" / "api").mkdir(parents=True)
    (repo / "app" / "dashboard").mkdir(parents=True)
    (repo / "components" / "dashboard").mkdir(parents=True)
    (repo / "docs" / "claim-to-reality-gap-matrix.md").write_text(
        """
| Claim | Source | Reality | Status |
|-------|--------|---------|--------|
| \"Newsletter route exists\" | whitepaper.md §6.1 | `/v1/newsletter` is absent from OpenAPI and `/v1/leads` exists instead | MISLEADING |
| \"Vault integration\" | roadmap.md | Explicitly documented as STUB in roadmap.md | STUB |
""".strip()
        + "\n",
        encoding="utf-8",
    )
    (repo / "whitepaper.md").write_text(
        """
The control plane exposes /v1/newsletter and /v1/leads today.
This section is TODO before launch.
""".strip()
        + "\n",
        encoding="utf-8",
    )
    (repo / "README.md").write_text("See /v1/leads for lead capture.\n", encoding="utf-8")
    (repo / "roadmap.md").write_text("Vault integration is still a STUB.\n", encoding="utf-8")
    (repo / "docs" / "project-status.md").write_text("Monitoring is planned.\n", encoding="utf-8")
    (repo / "docs" / "surfaces.md").write_text("Surface list includes /v1/governance/metrics.\n", encoding="utf-8")
    (repo / "docs" / "api" / "reference.md").write_text("# API reference\n", encoding="utf-8")
    (repo / "docs" / "api" / "openapi.json").write_text(
        json.dumps({"paths": {"/v1/leads": {}, "/v1/health": {}}}),
        encoding="utf-8",
    )
    (repo / "src" / "api" / "runtime.py").write_text(
        "def run():\n    # FIXME auth hardening\n    return True\n",
        encoding="utf-8",
    )
    (repo / "components" / "dashboard" / "Filters.tsx").write_text(
        "export function Filters() { return <input placeholder=\"Search\" /> }\n",
        encoding="utf-8",
    )
    return repo


def test_generate_tasks_scores_and_assigns_roles_from_repo_signals(tmp_path: Path) -> None:
    repo = write_repo_fixture(tmp_path)

    tasks = FLEET.generate_tasks(repo, BASE_FLEET)

    assert tasks, "expected generated tasks"
    by_id = {task["id"]: task for task in tasks}
    route_task = next(task for task in tasks if task["source"] == "fleet:route-claim-scan")
    todo_task = next(task for task in tasks if task["source"] == "fleet:todo-scan")
    ux_task = next(task for task in tasks if task["source"] == "fleet:ux-scan")

    assert route_task["owner_role"] == "research"
    assert route_task["role_lane"] == "main"
    assert route_task["lane"] == "main"
    assert route_task["runner"] == "codex"
    assert route_task["priority"] in {"p0", "p1"}
    assert route_task["score"] > todo_task["score"]
    assert "docs/api/openapi.json" in route_task["evidence_paths"]

    assert todo_task["owner_role"] == "backend"
    assert todo_task["lane"] == "codex"
    assert "risk:high" in todo_task["labels"]

    assert ux_task["owner_role"] == "ux"
    assert ux_task["lane"] == "opencode"
    assert ux_task["runner"] == "opencode"
    assert any(label.startswith("role-lane:") for label in ux_task["labels"])

    assert all("scheduling_reason" in task and task["scheduling_reason"] for task in by_id.values())


def test_generate_tasks_respects_role_and_lane_caps(tmp_path: Path) -> None:
    repo = write_repo_fixture(tmp_path)
    fleet = json.loads(json.dumps(BASE_FLEET))
    fleet["scanner_policies"]["max_new_tasks_per_cycle"] = 4
    fleet["scanner_policies"]["max_tasks_per_role_per_cycle"] = 1
    fleet["scanner_policies"]["max_tasks_per_lane_per_cycle"] = {"main": 1, "codex": 1, "opencode": 1}

    tasks = FLEET.generate_tasks(repo, fleet)

    roles = [task["owner_role"] for task in tasks]
    lanes = [task["lane"] for task in tasks]
    assert len(tasks) <= 3
    assert len(roles) == len(set(roles))
    assert len(lanes) == len(set(lanes))


def test_main_filters_existing_ids_and_writes_output(tmp_path: Path) -> None:
    repo = write_repo_fixture(tmp_path)
    queue = tmp_path / "queue.json"
    queue.write_text(json.dumps({"items": [{"id": "fleet-route-whitepaper-md-v1-newsletter"}]}), encoding="utf-8")
    output = tmp_path / "generated.json"
    fleet = tmp_path / "fleet.json"
    fleet.write_text(json.dumps(BASE_FLEET), encoding="utf-8")

    import subprocess

    result = subprocess.run(
        [
            "python3",
            str(FLEET_GEN_PATH),
            "--fleet",
            str(fleet),
            "--queue",
            str(queue),
            "--output",
            str(output),
            "--repo-root",
            str(repo),
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0
    payload = json.loads(output.read_text(encoding="utf-8"))
    assert isinstance(payload, list)
    assert all(task["id"] != "fleet-route-whitepaper-md-v1-newsletter" for task in payload)
    assert all("owner_role" in task and "score" in task for task in payload)
