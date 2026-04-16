from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
RUNTIME_PATH = AUTONOMY_DIR / "python_runtime.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


RUNTIME = load_module("python_runtime", RUNTIME_PATH)


def test_resolve_python_accepts_current_interpreter(monkeypatch) -> None:
    monkeypatch.setattr(RUNTIME, "_candidate_bins", lambda: [sys.executable])

    python_bin, version = RUNTIME.resolve_python()

    assert python_bin == sys.executable
    assert version[:2] >= RUNTIME.MIN_VERSION


def test_resolve_python_rejects_only_old_candidates(monkeypatch) -> None:
    monkeypatch.setattr(RUNTIME, "_candidate_bins", lambda: ["/definitely/missing/python"])
    monkeypatch.setattr(RUNTIME, "_version_of", lambda _candidate: (3, 9, 6))

    try:
        RUNTIME.resolve_python()
    except SystemExit as exc:
        assert "No suitable Python runtime found" in str(exc)
    else:
        raise AssertionError("expected resolve_python to fail for old runtimes")
