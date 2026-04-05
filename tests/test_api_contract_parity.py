from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest


def _load_api_contract_parity_module():
    module_path = (
        Path(__file__).resolve().parents[1] / "scripts" / "autonomy" / "api_contract_parity.py"
    )
    spec = importlib.util.spec_from_file_location("api_contract_parity", module_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_build_parity_report_flags_snapshot_and_prose_drift(tmp_path: Path) -> None:
    module = _load_api_contract_parity_module()
    docs_dir = tmp_path / "docs" / "api"
    docs_dir.mkdir(parents=True)
    (docs_dir / "index.md").write_text(
        "\n".join(
            [
                "Routes:",
                "- /v1/agents*",
                "- /v1/auth/login",
                "- /health",
                "- /v1/ghost",
            ]
        ),
        encoding="utf-8",
    )
    (docs_dir / "reference.md").write_text("Ignored helper doc.", encoding="utf-8")

    snapshot_document = {
        "paths": {
            "/health": {"get": {}},
            "/v1/agents": {"get": {}},
            "/v1/auth/login": {"post": {}},
            "/v1/auth/me": {"get": {}},
        },
        "components": {
            "schemas": {
                "Agent": {"type": "object"},
                "LoginResponse": {"properties": {"token": {"type": "string"}}},
            }
        },
    }
    live_document = {
        "paths": {
            "/health": {"get": {}},
            "/v1/agents": {"get": {}, "post": {}},
            "/v1/auth/login": {"post": {}},
            "/v1/auth/me": {"get": {}},
            "/v1/runtime/providers/{provider}": {"get": {}},
        },
        "components": {
            "schemas": {
                "Agent": {"type": "object"},
                "LoginResponse": {
                    "properties": {
                        "token": {"type": "string"},
                        "refresh_token": {"type": "string"},
                    }
                },
            }
        },
    }

    report = module.build_parity_report(
        snapshot_document=snapshot_document,
        live_document=live_document,
        docs_dir=docs_dir,
        snapshot_path=tmp_path / "snapshot.json",
    )

    assert report["is_clean"] is False
    assert report["snapshot_vs_live"]["paths"]["missing_in_snapshot"] == [
        "/v1/runtime/providers/{provider}"
    ]
    assert report["snapshot_vs_live"]["paths"]["changed"] == ["/v1/agents"]
    assert report["snapshot_vs_live"]["schemas"]["changed"] == ["LoginResponse"]
    assert report["snapshot_vs_live"]["method_mismatches"] == [
        {
            "path": "/v1/agents",
            "snapshot_methods": ["GET"],
            "live_methods": ["GET", "POST"],
        }
    ]
    assert report["prose_vs_snapshot"]["undocumented_paths"] == ["/v1/auth/me"]
    assert report["prose_vs_snapshot"]["stale_references"] == [
        {
            "doc": docs_dir.joinpath("index.md").as_posix(),
            "line": 5,
            "reference": "/v1/ghost",
            "target": "/v1/ghost",
        }
    ]


def test_collect_contract_parity_report_matches_current_repo() -> None:
    module = _load_api_contract_parity_module()

    try:
        report = module.collect_contract_parity_report()
    except RuntimeError as exc:
        pytest.skip(str(exc))

    assert report["is_clean"] is True
    assert report["snapshot_vs_live"]["paths"]["missing_in_snapshot"] == []
    assert report["snapshot_vs_live"]["paths"]["extra_in_snapshot"] == []
    assert report["snapshot_vs_live"]["schemas"]["changed"] == []
    assert report["prose_vs_snapshot"]["stale_references"] == []
