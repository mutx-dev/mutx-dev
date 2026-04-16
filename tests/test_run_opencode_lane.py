from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTONOMY_DIR = ROOT / "scripts" / "autonomy"
if str(AUTONOMY_DIR) not in sys.path:
    sys.path.insert(0, str(AUTONOMY_DIR))
MODULE_PATH = AUTONOMY_DIR / "run_opencode_lane.py"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


LANE = load_module("run_opencode_lane", MODULE_PATH)


def test_candidate_models_prefers_openai_then_fallback() -> None:
    assert LANE.candidate_models("openai/gpt-5.4") == ["openai/gpt-5.4", "minimax/MiniMax-M2.7"]


def test_verify_changed_ts_syntax_skips_non_js_files(tmp_path: Path) -> None:
    result = LANE.verify_changed_ts_syntax(str(tmp_path), ["docs/readme.md"])

    assert result == []


def test_verify_changed_ts_syntax_reports_parse_error(tmp_path: Path) -> None:
    node_modules = tmp_path / "node_modules" / "typescript"
    node_modules.mkdir(parents=True)
    (node_modules / "index.js").write_text("""
exports.JsxEmit = { Preserve: 1 }
exports.ScriptTarget = { ESNext: 99 }
exports.DiagnosticCategory = { Error: 1 }
exports.flattenDiagnosticMessageText = (msg) => msg
exports.transpileModule = (_src, opts) => ({ diagnostics: [{ category: 1, messageText: 'parse exploded in ' + opts.fileName }] })
""")
    broken = tmp_path / "components" / "Broken.tsx"
    broken.parent.mkdir(parents=True)
    broken.write_text("const x = <div>")

    result = LANE.verify_changed_ts_syntax(str(tmp_path), ["components/Broken.tsx"])

    assert len(result) == 1
    assert result[0]["exit_code"] == 1
    assert "parse exploded" in result[0]["stdout"]


def test_verify_changed_ts_syntax_accepts_clean_file(tmp_path: Path) -> None:
    node_modules = tmp_path / "node_modules" / "typescript"
    node_modules.mkdir(parents=True)
    (node_modules / "index.js").write_text("""
exports.JsxEmit = { Preserve: 1 }
exports.ScriptTarget = { ESNext: 99 }
exports.DiagnosticCategory = { Error: 1 }
exports.flattenDiagnosticMessageText = (msg) => msg
exports.transpileModule = () => ({ diagnostics: [] })
""")
    clean = tmp_path / "components" / "Clean.tsx"
    clean.parent.mkdir(parents=True)
    clean.write_text("export const Clean = () => <div />")

    result = LANE.verify_changed_ts_syntax(str(tmp_path), ["components/Clean.tsx"])

    assert len(result) == 1
    assert result[0]["exit_code"] == 0
    payload = json.loads(result[0]["stdout"])
    assert payload["ok"] is True
