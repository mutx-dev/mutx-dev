from __future__ import annotations

from importlib.metadata import version
from inspect import signature
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest
from packaging.version import Version

from src.api.services import document_engine


PREDICT_RLM_COMPATIBILITY_FLOOR = Version("0.7.3")


def _ready(tmp_path: Path) -> document_engine.EngineReadiness:
    return document_engine.EngineReadiness(
        enabled=True,
        python_ok=True,
        predict_rlm_available=True,
        deno_available=True,
        credentials_ok=True,
        ready=True,
        driver="predict_rlm",
        artifacts_dir=str(tmp_path),
        missing_requirements=(),
        configured_model_providers=("openai",),
    )


def _artifact(path: Path, role: str, artifact_id: str) -> dict[str, Any]:
    return {
        "id": artifact_id,
        "role": role,
        "kind": "file",
        "filename": path.name,
        "storage_backend": "local_reference",
        "local_path": str(path),
        "storage_uri": None,
        "content_type": "application/pdf",
        "metadata": {},
    }


def test_predict_rlm_public_api_meets_v073_contract() -> None:
    from predict_rlm import File, PredictRLM, Skill

    assert Version(version("predict-rlm")) >= PREDICT_RLM_COMPATIBILITY_FLOOR
    assert File(path="/tmp/input.pdf").path == "/tmp/input.pdf"
    assert Skill(name="pdf", packages=["pymupdf"]).packages == ["pymupdf"]

    constructor_parameters = signature(PredictRLM.__init__).parameters
    assert {"signature", "lm", "sub_lm", "skills", "output_dir"}.issubset(constructor_parameters)


@pytest.mark.parametrize(
    ("template_id", "expected_roles"),
    [
        ("document_analysis", {"report", "summary"}),
        ("contract_comparison", {"report", "summary"}),
        ("invoice_extraction", {"workbook", "summary"}),
        (
            "document_redaction",
            {"redacted_document", "verification_report", "summary"},
        ),
    ],
)
def test_document_templates_execute_against_v073_public_types(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    template_id: str,
    expected_roles: set[str],
) -> None:
    import predict_rlm
    from predict_rlm import File, Skill

    input_path = tmp_path / "input.pdf"
    input_path.write_bytes(b"%PDF-1.7\n")
    comparison_path = tmp_path / "comparison.pdf"
    comparison_path.write_bytes(b"%PDF-1.7\n")
    output_dir = tmp_path / "outputs"
    calls: list[dict[str, Any]] = []

    class CompatiblePredictRLM:
        def __init__(self, rlm_signature: type[Any], **kwargs: Any) -> None:
            self.signature_name = rlm_signature.__name__
            calls.append({"signature": rlm_signature, "options": kwargs})

        def __call__(self, **kwargs: Any) -> SimpleNamespace:
            calls[-1]["inputs"] = kwargs
            output_dir.mkdir(parents=True, exist_ok=True)
            summary = {"signature": self.signature_name}

            if self.signature_name == "ExtractInvoices":
                workbook = output_dir / "invoices.xlsx"
                workbook.write_bytes(b"workbook")
                return SimpleNamespace(workbook=File(path=str(workbook)), summary=summary)
            if self.signature_name == "RedactDocuments":
                redacted = output_dir / "redacted.pdf"
                redacted.write_bytes(b"%PDF-1.7\n")
                report = output_dir / "verification.md"
                report.write_text("# Verification\n", encoding="utf-8")
                return SimpleNamespace(
                    redacted_documents=[File(path=str(redacted))],
                    verification_report=File(path=str(report)),
                    summary=summary,
                )

            report = output_dir / "report.md"
            report.write_text("# Report\n", encoding="utf-8")
            return SimpleNamespace(report=File(path=str(report)), summary=summary)

    monkeypatch.setattr(predict_rlm, "PredictRLM", CompatiblePredictRLM)
    monkeypatch.setattr(document_engine, "get_document_engine_readiness", lambda: _ready(tmp_path))
    monkeypatch.setattr(
        document_engine.subprocess,
        "run",
        lambda *args, **kwargs: SimpleNamespace(returncode=0),
    )

    artifacts = [_artifact(input_path, "documents", "input")]
    if template_id == "contract_comparison":
        artifacts = [
            _artifact(input_path, "base_document", "base"),
            _artifact(comparison_path, "comparison_document", "comparison"),
        ]

    result = document_engine.execute_document_manifest(
        {
            "job_id": "compatibility-test",
            "template_id": template_id,
            "template_name": template_id.replace("_", " ").title(),
            "parameters": {
                "instructions": "Prioritize material findings",
                "redaction_policy": "Remove secrets",
            },
            "artifacts": artifacts,
            "output_dir": str(output_dir),
        }
    )

    assert result.status == "completed"
    assert result.driver == "predict_rlm"
    assert {artifact.role for artifact in result.artifacts} == expected_roles
    assert all(artifact.path.exists() for artifact in result.artifacts)
    assert calls and all(isinstance(skill, Skill) for skill in calls[0]["options"]["skills"])

    runtime_inputs = calls[0]["inputs"]
    if template_id in {"document_analysis", "contract_comparison"}:
        assert runtime_inputs["user_instructions"] == "Prioritize material findings"
        assert "instructions" not in runtime_inputs
    file_values = [
        item
        for value in runtime_inputs.values()
        for item in (value if isinstance(value, list) else [value])
        if isinstance(item, File)
    ]
    assert file_values
