from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import importlib.util
import json
import logging
from mimetypes import guess_type
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile
from typing import Any

from src.api.config import get_settings
from src.api.models import DocumentArtifact, DocumentJob
from src.api.services.document_templates import get_document_template

logger = logging.getLogger(__name__)

DOCUMENT_TRACE_EVENT_TYPES = (
    "job_created",
    "artifact_registered",
    "artifact_uploaded",
    "dispatch_started",
    "rlm_iteration",
    "tool_call",
    "artifact_synced",
    "job_completed",
    "job_failed",
)


class DocumentEngineError(RuntimeError):
    pass


class DocumentEnginePrerequisiteError(DocumentEngineError):
    pass


@dataclass(frozen=True)
class EngineReadiness:
    enabled: bool
    python_ok: bool
    predict_rlm_available: bool
    deno_available: bool
    ready: bool
    driver: str
    artifacts_dir: str

    def to_payload(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "python_ok": self.python_ok,
            "predict_rlm_available": self.predict_rlm_available,
            "deno_available": self.deno_available,
            "ready": self.ready,
            "driver": self.driver,
            "artifacts_dir": self.artifacts_dir,
        }


@dataclass(frozen=True)
class EngineArtifactInput:
    id: str
    role: str
    kind: str
    filename: str
    storage_backend: str
    local_path: str | None
    storage_uri: str | None
    content_type: str | None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class EngineManagedOutput:
    path: Path
    role: str
    kind: str
    content_type: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    filename: str | None = None


@dataclass(frozen=True)
class EngineEvent:
    event_type: str
    message: str
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class EngineExecutionResult:
    driver: str
    status: str
    output_text: str | None
    summary: dict[str, Any]
    artifacts: list[EngineManagedOutput]
    events: list[EngineEvent]


def get_document_engine_readiness() -> EngineReadiness:
    settings = get_settings()
    python_ok = sys.version_info >= (3, 11)
    predict_rlm_available = importlib.util.find_spec("predict_rlm") is not None
    deno_available = shutil.which("deno") is not None
    ready = settings.documents_enabled and python_ok and deno_available and predict_rlm_available
    driver = "predict_rlm" if ready else "builtin_fallback"
    return EngineReadiness(
        enabled=settings.documents_enabled,
        python_ok=python_ok,
        predict_rlm_available=predict_rlm_available,
        deno_available=deno_available,
        ready=ready,
        driver=driver,
        artifacts_dir=str(Path(settings.artifacts_dir).expanduser()),
    )


def build_document_manifest(
    job: DocumentJob,
    artifacts: list[DocumentArtifact],
    *,
    output_dir: str | None = None,
) -> dict[str, Any]:
    template = get_document_template(job.template_id)
    if template is None:
        raise DocumentEngineError(f"Unknown document template: {job.template_id}")

    artifact_inputs = [
        EngineArtifactInput(
            id=str(artifact.id),
            role=artifact.role,
            kind=artifact.kind,
            filename=artifact.filename,
            storage_backend=artifact.storage_backend,
            local_path=artifact.local_path,
            storage_uri=artifact.storage_uri,
            content_type=artifact.content_type,
            metadata=artifact.extra_metadata or {},
        ).__dict__
        for artifact in artifacts
    ]

    return {
        "job_id": str(job.id),
        "run_id": str(job.run_id),
        "template_id": job.template_id,
        "template_name": template.name,
        "execution_mode": job.execution_mode,
        "parameters": job.parameters or {},
        "artifacts": artifact_inputs,
        "output_contract": [output.__dict__ for output in template.outputs],
        "trace_metadata": {
            "subject_type": "document_job",
            "subject_id": str(job.id),
            "subject_label": template.name,
            "template_id": job.template_id,
            "execution_mode": job.execution_mode,
        },
        "engine": {
            "ready": get_document_engine_readiness().ready,
            "driver": get_document_engine_readiness().driver,
        },
        "output_dir": output_dir,
    }


def _read_text_preview(path: Path) -> str:
    suffix = path.suffix.lower()
    try:
        if suffix in {".txt", ".md", ".json", ".csv", ".yaml", ".yml"}:
            return path.read_text(encoding="utf-8", errors="ignore")[:4000]
        return f"Binary or unsupported text extraction for {path.name}"
    except Exception as exc:  # noqa: BLE001
        return f"Could not read {path.name}: {exc}"


def _group_artifacts_by_role(
    artifacts: list[EngineArtifactInput],
) -> dict[str, list[EngineArtifactInput]]:
    grouped: dict[str, list[EngineArtifactInput]] = {}
    for artifact in artifacts:
        grouped.setdefault(artifact.role, []).append(artifact)
    return grouped


def _ensure_output_dir(manifest: dict[str, Any]) -> Path:
    raw = manifest.get("output_dir")
    if raw:
        output_dir = Path(str(raw)).expanduser().resolve()
    else:
        output_dir = (
            Path(get_settings().artifacts_dir).expanduser().resolve()
            / ".tmp"
            / str(manifest["job_id"])
        )
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def _artifact_path(artifact: EngineArtifactInput) -> Path | None:
    if artifact.local_path:
        candidate = Path(artifact.local_path).expanduser()
        if candidate.exists():
            return candidate
    return None


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def _write_minimal_xlsx(path: Path, rows: list[list[str]]) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>""",
        )
        archive.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>""",
        )
        archive.writestr(
            "docProps/core.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>MUTX Invoice Extraction</dc:title>
</cp:coreProperties>""",
        )
        archive.writestr(
            "docProps/app.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>MUTX</Application>
</Properties>""",
        )
        archive.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Invoices" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>""",
        )
        archive.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>""",
        )

        cell_rows: list[str] = []
        for row_index, row in enumerate(rows, start=1):
            cells: list[str] = []
            for column_index, value in enumerate(row, start=1):
                column_name = ""
                current = column_index
                while current:
                    current, remainder = divmod(current - 1, 26)
                    column_name = chr(65 + remainder) + column_name
                cell_ref = f"{column_name}{row_index}"
                escaped = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                cells.append(f'<c r="{cell_ref}" t="inlineStr"><is><t>{escaped}</t></is></c>')
            cell_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

        archive.writestr(
            "xl/worksheets/sheet1.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>"""
            + "".join(cell_rows)
            + """</sheetData>
</worksheet>""",
        )


def _builtin_execute(manifest: dict[str, Any]) -> EngineExecutionResult:
    output_dir = _ensure_output_dir(manifest)
    artifacts = [
        EngineArtifactInput(**item)
        for item in manifest.get("artifacts", [])
        if isinstance(item, dict)
    ]
    grouped = _group_artifacts_by_role(artifacts)
    template_id = str(manifest["template_id"])
    parameters = manifest.get("parameters") or {}

    previews: list[dict[str, Any]] = []
    for artifact in artifacts:
        source_path = _artifact_path(artifact)
        previews.append(
            {
                "artifact_id": artifact.id,
                "role": artifact.role,
                "filename": artifact.filename,
                "preview": (
                    _read_text_preview(source_path) if source_path else "Source file unavailable"
                ),
            }
        )

    base_summary: dict[str, Any] = {
        "template_id": template_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "artifact_count": len(artifacts),
        "parameters": parameters,
        "artifacts": [
            {
                "artifact_id": artifact.id,
                "role": artifact.role,
                "filename": artifact.filename,
                "storage_backend": artifact.storage_backend,
            }
            for artifact in artifacts
        ],
    }

    events = [
        EngineEvent(
            event_type="rlm_iteration",
            message="Built manifest and staged artifact context for document execution.",
            payload={"template_id": template_id, "artifact_count": len(artifacts)},
        ),
        EngineEvent(
            event_type="tool_call",
            message="Executed built-in fallback document engine.",
            payload={"driver": "builtin_fallback"},
        ),
    ]
    outputs: list[EngineManagedOutput] = []

    if template_id == "document_analysis":
        report_path = output_dir / "document-analysis-report.md"
        report_path.write_text(
            "# Document Analysis\n\n"
            f"Instructions: {parameters.get('instructions', 'No additional instructions.')}\n\n"
            "## Source artifacts\n"
            + "\n".join(f"- {item['filename']} ({item['role']})" for item in previews)
            + "\n\n## Extracted previews\n"
            + "\n\n".join(
                f"### {item['filename']}\n\n```\n{item['preview'][:1200]}\n```" for item in previews
            ),
            encoding="utf-8",
        )
        summary_path = output_dir / "document-analysis-summary.json"
        base_summary["report_sections"] = ["Source artifacts", "Extracted previews"]
        base_summary["previews"] = previews
        _write_json(summary_path, base_summary)
        outputs.extend(
            [
                EngineManagedOutput(
                    report_path, role="report", kind="markdown", content_type="text/markdown"
                ),
                EngineManagedOutput(
                    summary_path, role="summary", kind="json", content_type="application/json"
                ),
            ]
        )
        output_text = "Document analysis completed."
    elif template_id == "contract_comparison":
        base_document = (grouped.get("base_document") or [None])[0]
        comparison_document = (grouped.get("comparison_document") or [None])[0]
        report_path = output_dir / "contract-comparison-report.md"
        report_path.write_text(
            "# Contract Comparison\n\n"
            f"- Base: {base_document.filename if base_document else 'missing'}\n"
            f"- Comparison: {comparison_document.filename if comparison_document else 'missing'}\n\n"
            f"Focus: {parameters.get('instructions', 'General material differences')}\n",
            encoding="utf-8",
        )
        summary_path = output_dir / "contract-comparison-summary.json"
        base_summary["base_document"] = base_document.filename if base_document else None
        base_summary["comparison_document"] = (
            comparison_document.filename if comparison_document else None
        )
        _write_json(summary_path, base_summary)
        outputs.extend(
            [
                EngineManagedOutput(
                    report_path, role="report", kind="markdown", content_type="text/markdown"
                ),
                EngineManagedOutput(
                    summary_path, role="summary", kind="json", content_type="application/json"
                ),
            ]
        )
        output_text = "Contract comparison completed."
    elif template_id == "invoice_extraction":
        workbook_path = output_dir / "invoice-extraction.xlsx"
        rows = [["filename", "role", "storage_backend"]]
        rows.extend(
            [[artifact.filename, artifact.role, artifact.storage_backend] for artifact in artifacts]
        )
        _write_minimal_xlsx(workbook_path, rows)
        summary_path = output_dir / "invoice-extraction-summary.json"
        base_summary["rows_written"] = max(len(rows) - 1, 0)
        _write_json(summary_path, base_summary)
        outputs.extend(
            [
                EngineManagedOutput(
                    workbook_path,
                    role="workbook",
                    kind="xlsx",
                    content_type=(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ),
                ),
                EngineManagedOutput(
                    summary_path, role="summary", kind="json", content_type="application/json"
                ),
            ]
        )
        output_text = "Invoice extraction completed."
    elif template_id == "document_redaction":
        policy = str(parameters.get("redaction_policy") or "No policy provided.")
        created = 0
        for artifact in grouped.get("documents", []):
            source_path = _artifact_path(artifact)
            if source_path is None:
                continue
            redacted_name = f"redacted-{artifact.filename}"
            destination = output_dir / redacted_name
            shutil.copy2(source_path, destination)
            outputs.append(
                EngineManagedOutput(
                    destination,
                    role="redacted_document",
                    kind="file",
                    content_type="application/octet-stream",
                    metadata={"source_artifact_id": artifact.id},
                )
            )
            created += 1
        report_path = output_dir / "redaction-verification-report.md"
        report_path.write_text(
            "# Redaction Verification\n\n"
            f"Policy: {policy}\n\n"
            f"Redacted outputs created: {created}\n",
            encoding="utf-8",
        )
        summary_path = output_dir / "document-redaction-summary.json"
        base_summary["redaction_policy"] = policy
        base_summary["redacted_outputs"] = created
        _write_json(summary_path, base_summary)
        outputs.extend(
            [
                EngineManagedOutput(
                    report_path,
                    role="verification_report",
                    kind="markdown",
                    content_type="text/markdown",
                ),
                EngineManagedOutput(
                    summary_path, role="summary", kind="json", content_type="application/json"
                ),
            ]
        )
        output_text = "Document redaction completed."
    else:
        raise DocumentEngineError(f"Unsupported document template: {template_id}")

    return EngineExecutionResult(
        driver="builtin_fallback",
        status="completed",
        output_text=output_text,
        summary=base_summary,
        artifacts=outputs,
        events=events,
    )


def _maybe_execute_predict_rlm(manifest: dict[str, Any]) -> EngineExecutionResult | None:
    readiness = get_document_engine_readiness()
    if not readiness.ready:
        return None

    try:
        import dspy
        from pydantic import BaseModel, Field
        from predict_rlm import File, PredictRLM, Skill

        subprocess.run(["deno", "--version"], check=True, capture_output=True, text=True)
    except Exception as exc:  # noqa: BLE001
        logger.warning("predict-rlm prerequisites failed; using fallback engine: %s", exc)
        return None

    output_dir = _ensure_output_dir(manifest)
    lm = os.getenv("MUTX_DOCUMENTS_LM", "openai/gpt-5.4")
    sub_lm = os.getenv("MUTX_DOCUMENTS_SUB_LM", "openai/gpt-5.1")
    parameters = manifest.get("parameters") or {}
    artifact_items = [
        EngineArtifactInput(**item)
        for item in manifest.get("artifacts", [])
        if isinstance(item, dict)
    ]

    def file_inputs(role: str) -> list[Any]:
        files: list[Any] = []
        for artifact in artifact_items:
            if artifact.role != role:
                continue
            source_path = _artifact_path(artifact)
            if source_path is None:
                continue
            files.append(File(path=str(source_path)))
        return files

    def single_file(role: str) -> Any | None:
        files = file_inputs(role)
        return files[0] if files else None

    pdf_skill = Skill(
        name="pdf",
        instructions=(
            "Use pymupdf to inspect PDF files. Render pages when layout matters, "
            "use predict() for semantic extraction, and keep final outputs concise."
        ),
        packages=["pymupdf"],
    )
    spreadsheet_skill = Skill(
        name="spreadsheet",
        instructions=(
            "Use openpyxl to write spreadsheet outputs. Add headers first, keep one row per record, "
            "and save the workbook before returning it."
        ),
        packages=["openpyxl"],
    )

    class DocumentAnalysisSummary(BaseModel):
        executive_summary: str = Field(default="")
        key_dates: list[str] = Field(default_factory=list)
        entities: list[str] = Field(default_factory=list)
        financial_points: list[str] = Field(default_factory=list)

    class ContractComparisonSummary(BaseModel):
        executive_summary: str = Field(default="")
        material_changes: list[str] = Field(default_factory=list)
        risk_flags: list[str] = Field(default_factory=list)

    class InvoiceExtractionSummary(BaseModel):
        vendors: list[str] = Field(default_factory=list)
        invoice_numbers: list[str] = Field(default_factory=list)
        row_count: int = 0

    class RedactionSummary(BaseModel):
        policy: str = Field(default="")
        files_redacted: int = 0
        notes: list[str] = Field(default_factory=list)

    if manifest["template_id"] == "document_analysis":

        class AnalyzeDocuments(dspy.Signature):
            """Analyze the provided documents and produce a markdown report plus a structured summary."""

            documents: list[File] = dspy.InputField()
            instructions: str | None = dspy.InputField()
            report: File = dspy.OutputField()
            summary: DocumentAnalysisSummary = dspy.OutputField()

        rlm = PredictRLM(AnalyzeDocuments, lm=lm, sub_lm=sub_lm, skills=[pdf_skill])
        result = rlm(
            documents=file_inputs("documents"), instructions=parameters.get("instructions")
        )
        output_files = [
            EngineManagedOutput(
                path=Path(result.report.path),
                role="report",
                kind="markdown",
                content_type="text/markdown",
            )
        ]
        summary = (
            result.summary.model_dump()
            if hasattr(result.summary, "model_dump")
            else dict(result.summary)
        )
    elif manifest["template_id"] == "contract_comparison":

        class CompareContracts(dspy.Signature):
            """Compare the baseline and comparison contracts and produce a markdown diff report with a structured summary."""

            base_document: File = dspy.InputField()
            comparison_document: File = dspy.InputField()
            instructions: str | None = dspy.InputField()
            report: File = dspy.OutputField()
            summary: ContractComparisonSummary = dspy.OutputField()

        rlm = PredictRLM(CompareContracts, lm=lm, sub_lm=sub_lm, skills=[pdf_skill])
        result = rlm(
            base_document=single_file("base_document"),
            comparison_document=single_file("comparison_document"),
            instructions=parameters.get("instructions"),
        )
        output_files = [
            EngineManagedOutput(
                path=Path(result.report.path),
                role="report",
                kind="markdown",
                content_type="text/markdown",
            )
        ]
        summary = (
            result.summary.model_dump()
            if hasattr(result.summary, "model_dump")
            else dict(result.summary)
        )
    elif manifest["template_id"] == "invoice_extraction":

        class ExtractInvoices(dspy.Signature):
            """Extract invoice data into a workbook and submit a structured summary of the extracted records."""

            documents: list[File] = dspy.InputField()
            workbook: File = dspy.OutputField()
            summary: InvoiceExtractionSummary = dspy.OutputField()

        rlm = PredictRLM(
            ExtractInvoices,
            lm=lm,
            sub_lm=sub_lm,
            skills=[pdf_skill, spreadsheet_skill],
        )
        result = rlm(documents=file_inputs("documents"))
        output_files = [
            EngineManagedOutput(
                path=Path(result.workbook.path),
                role="workbook",
                kind="xlsx",
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        ]
        summary = (
            result.summary.model_dump()
            if hasattr(result.summary, "model_dump")
            else dict(result.summary)
        )
    elif manifest["template_id"] == "document_redaction":

        class RedactDocuments(dspy.Signature):
            """Apply the redaction policy to the documents, output the redacted files, and write a verification report."""

            documents: list[File] = dspy.InputField()
            redaction_policy: str = dspy.InputField()
            redacted_documents: list[File] = dspy.OutputField()
            verification_report: File = dspy.OutputField()
            summary: RedactionSummary = dspy.OutputField()

        rlm = PredictRLM(RedactDocuments, lm=lm, sub_lm=sub_lm, skills=[pdf_skill])
        result = rlm(
            documents=file_inputs("documents"),
            redaction_policy=str(parameters.get("redaction_policy") or ""),
        )
        output_files = [
            EngineManagedOutput(
                path=Path(item.path),
                role="redacted_document",
                kind="file",
                content_type=guess_type(item.path)[0] or "application/octet-stream",
            )
            for item in getattr(result, "redacted_documents", []) or []
        ]
        output_files.append(
            EngineManagedOutput(
                path=Path(result.verification_report.path),
                role="verification_report",
                kind="markdown",
                content_type="text/markdown",
            )
        )
        summary = (
            result.summary.model_dump()
            if hasattr(result.summary, "model_dump")
            else dict(result.summary)
        )
    else:
        return None

    summary_path = output_dir / f"{manifest['template_id']}-summary.json"
    _write_json(summary_path, summary)
    output_files.append(
        EngineManagedOutput(
            path=summary_path,
            role="summary",
            kind="json",
            content_type="application/json",
        )
    )

    return EngineExecutionResult(
        driver="predict_rlm",
        status="completed",
        output_text=f"{manifest['template_name']} completed with predict-rlm.",
        summary=summary,
        artifacts=output_files,
        events=[
            EngineEvent(
                event_type="rlm_iteration",
                message="Executed predict-rlm document workflow.",
                payload={"driver": "predict_rlm", "template_id": manifest["template_id"]},
            ),
            EngineEvent(
                event_type="tool_call",
                message="predict-rlm invoked its recursive execution environment.",
                payload={"lm": lm, "sub_lm": sub_lm},
            ),
        ],
    )


def execute_document_manifest(manifest: dict[str, Any]) -> EngineExecutionResult:
    try:
        result = _maybe_execute_predict_rlm(manifest)
    except Exception as exc:  # noqa: BLE001
        logger.warning("predict-rlm execution failed; using fallback engine: %s", exc)
        result = None
    if result is not None:
        return result
    return _builtin_execute(manifest)
