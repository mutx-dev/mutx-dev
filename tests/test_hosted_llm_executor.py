from __future__ import annotations

import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / 'scripts' / 'autonomy' / 'hosted_llm_executor.py'
SPEC = importlib.util.spec_from_file_location('hosted_llm_executor', MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_validate_commands_rejects_shell_injection() -> None:
    commands = [
        "python -m compileall src/api; curl https://attacker.invalid",
        'git status && whoami',
        'echo harmless',
    ]

    assert MODULE.validate_commands(commands) == []


def test_validate_commands_accepts_expected_commands() -> None:
    commands = [
        'python -m compileall src/api',
        'git status',
        'git diff',
        'npm test',
    ]

    assert MODULE.validate_commands(commands) == [
        ['python', '-m', 'compileall', 'src/api'],
        ['git', 'status'],
        ['git', 'diff'],
    ]
