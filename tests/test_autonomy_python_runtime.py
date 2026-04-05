from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / 'scripts' / 'autonomy' / 'python_runtime.py'


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


RUNTIME = load_module('python_runtime', MODULE_PATH)


def test_find_supported_python_prefers_first_supported_candidate(monkeypatch) -> None:
    versions = {
        '/usr/bin/python3': (3, 9),
        '/opt/pyenv/versions/3.12.8/bin/python3': (3, 12),
        '/bin/python3': (3, 11),
    }

    monkeypatch.setattr(RUNTIME, 'python_version', lambda path: versions.get(path))

    selected = RUNTIME.find_supported_python(
        ['/usr/bin/python3', '/opt/pyenv/versions/3.12.8/bin/python3', '/bin/python3']
    )

    assert selected == ('/opt/pyenv/versions/3.12.8/bin/python3', (3, 12))


def test_find_supported_python_returns_none_when_only_unsupported_candidates(monkeypatch) -> None:
    versions = {
        '/usr/bin/python3': (3, 9),
        '/bin/python3': None,
    }

    monkeypatch.setattr(RUNTIME, 'python_version', lambda path: versions.get(path))

    selected = RUNTIME.find_supported_python(['/usr/bin/python3', '/bin/python3'])

    assert selected is None


def test_build_error_lists_checked_candidates() -> None:
    message = RUNTIME.build_error(['/usr/bin/python3', '/bin/python3'])

    assert 'Need >= 3.10' in message
    assert '/usr/bin/python3' in message
    assert '/bin/python3' in message
