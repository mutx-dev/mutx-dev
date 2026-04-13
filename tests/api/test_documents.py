from __future__ import annotations

import io
from pathlib import Path

import pytest

from src.api.services.document_jobs import claim_next_document_job, execute_document_job
from src.api.services.document_engine import (
    DocumentEnginePrerequisiteError,
    EngineEvent,
    EngineExecutionResult,
    EngineManagedOutput,
    EngineReadiness,
)


@pytest.fixture(autouse=True)
def enable_document_workflows(monkeypatch, tmp_path):
    from src.api.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "documents_enabled", True)
    monkeypatch.setattr(settings, "artifacts_dir", str(tmp_path / "artifacts"))
    monkeypatch.setattr(settings, "document_max_upload_mb", 10)
    yield


def _ready_readiness(tmp_path: Path) -> EngineReadiness:
    return EngineReadiness(
        enabled=True,
        python_ok=True,
        predict_rlm_available=True,
        deno_available=True,
        credentials_ok=True,
        ready=True,
        driver="predict_rlm",
        artifacts_dir=str(tmp_path / "artifacts"),
        missing_requirements=(),
        configured_model_providers=("openai",),
    )


@pytest.fixture
def stub_predict_rlm_document_engine(monkeypatch, tmp_path):
    def readiness() -> EngineReadiness:
        return _ready_readiness(tmp_path)

    def execute(manifest: dict[str, object]) -> EngineExecutionResult:
        output_dir = tmp_path / "predict-rlm-outputs" / str(manifest["template_id"])
        output_dir.mkdir(parents=True, exist_ok=True)
        template_id = str(manifest["template_id"])

        summary = {"template_id": template_id, "driver": "predict_rlm"}
        events = [
            EngineEvent(
                event_type="rlm_iteration",
                message="Executed predict-rlm document workflow.",
                payload={"driver": "predict_rlm", "template_id": template_id},
            ),
            EngineEvent(
                event_type="tool_call",
                message="predict-rlm invoked its recursive execution environment.",
                payload={"lm": "openai/gpt-5.4", "sub_lm": "openai/gpt-5.1"},
            ),
        ]

        if template_id == "invoice_extraction":
            workbook_path = output_dir / "invoice-extraction.xlsx"
            workbook_path.write_bytes(b"predict-rlm workbook")
            summary_path = output_dir / "invoice-extraction-summary.json"
            summary_path.write_text('{"driver":"predict_rlm"}', encoding="utf-8")
            artifacts = [
                EngineManagedOutput(
                    path=workbook_path,
                    role="workbook",
                    kind="xlsx",
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ),
                EngineManagedOutput(
                    path=summary_path,
                    role="summary",
                    kind="json",
                    content_type="application/json",
                ),
            ]
        elif template_id == "document_redaction":
            redacted_path = output_dir / "redacted-input.txt"
            redacted_path.write_text("redacted", encoding="utf-8")
            report_path = output_dir / "verification.md"
            report_path.write_text("# Verification", encoding="utf-8")
            summary_path = output_dir / "document-redaction-summary.json"
            summary_path.write_text('{"driver":"predict_rlm"}', encoding="utf-8")
            artifacts = [
                EngineManagedOutput(
                    path=redacted_path,
                    role="redacted_document",
                    kind="file",
                    content_type="text/plain",
                ),
                EngineManagedOutput(
                    path=report_path,
                    role="verification_report",
                    kind="markdown",
                    content_type="text/markdown",
                ),
                EngineManagedOutput(
                    path=summary_path,
                    role="summary",
                    kind="json",
                    content_type="application/json",
                ),
            ]
        else:
            report_path = output_dir / f"{template_id}-report.md"
            report_path.write_text("# Report", encoding="utf-8")
            summary_path = output_dir / f"{template_id}-summary.json"
            summary_path.write_text('{"driver":"predict_rlm"}', encoding="utf-8")
            artifacts = [
                EngineManagedOutput(
                    path=report_path,
                    role="report",
                    kind="markdown",
                    content_type="text/markdown",
                ),
                EngineManagedOutput(
                    path=summary_path,
                    role="summary",
                    kind="json",
                    content_type="application/json",
                ),
            ]

        return EngineExecutionResult(
            driver="predict_rlm",
            status="completed",
            output_text=f"{template_id} completed with predict-rlm.",
            summary=summary,
            artifacts=artifacts,
            events=events,
        )

    monkeypatch.setattr("src.api.services.document_engine.get_document_engine_readiness", readiness)
    monkeypatch.setattr("src.api.services.document_jobs.get_document_engine_readiness", readiness)
    monkeypatch.setattr("src.api.services.document_jobs.execute_document_manifest", execute)
    yield


def _not_ready_readiness(tmp_path: Path) -> EngineReadiness:
    return EngineReadiness(
        enabled=True,
        python_ok=True,
        predict_rlm_available=False,
        deno_available=False,
        credentials_ok=False,
        ready=False,
        driver="unavailable",
        artifacts_dir=str(tmp_path / "artifacts"),
        missing_requirements=("deno", "predict_rlm"),
        configured_model_providers=("openai",),
    )


@pytest.mark.asyncio
async def test_document_template_catalog_returns_expected_templates(client):
    response = await client.get("/v1/documents/templates")

    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload] == [
        "document_analysis",
        "contract_comparison",
        "invoice_extraction",
        "document_redaction",
    ]


def test_document_engine_readiness_reports_missing_model_credentials(monkeypatch, tmp_path):
    from src.api.services import document_engine

    monkeypatch.setattr(document_engine.importlib.util, "find_spec", lambda name: object())
    monkeypatch.setattr(document_engine.shutil, "which", lambda name: "/usr/bin/deno")
    monkeypatch.setenv("MUTX_DOCUMENTS_LM", "openai/gpt-5.4")
    monkeypatch.setenv("MUTX_DOCUMENTS_SUB_LM", "openai/gpt-5.1")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    readiness = document_engine.get_document_engine_readiness()

    assert readiness.enabled is True
    assert readiness.predict_rlm_available is True
    assert readiness.deno_available is True
    assert readiness.credentials_ok is False
    assert readiness.configured_model_providers == ("openai",)
    assert "OPENAI_API_KEY" in readiness.missing_requirements


@pytest.mark.asyncio
async def test_document_job_dispatch_validates_required_inputs(client):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_analysis",
            "execution_mode": "managed",
            "parameters": {},
        },
    )
    assert create_response.status_code == 201
    job_id = create_response.json()["id"]

    dispatch_response = await client.post(
        f"/v1/documents/jobs/{job_id}/dispatch",
        json={"mode": "managed"},
    )

    assert dispatch_response.status_code == 400
    assert "Missing required inputs" in dispatch_response.json()["detail"]


@pytest.mark.asyncio
async def test_document_artifact_upload_and_download_are_user_scoped(
    client,
    other_user_client,
):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_analysis",
            "execution_mode": "managed",
            "parameters": {},
        },
    )
    assert create_response.status_code == 201
    job_id = create_response.json()["id"]

    upload_response = await client.post(
        f"/v1/documents/jobs/{job_id}/artifacts",
        files={"file": ("brief.txt", io.BytesIO(b"incident summary"), "text/plain")},
        data={"role": "documents", "kind": "file"},
    )
    assert upload_response.status_code == 201
    artifact = upload_response.json()

    download_response = await client.get(f"/v1/documents/jobs/{job_id}/artifacts/{artifact['id']}")
    assert download_response.status_code == 200
    assert download_response.content == b"incident summary"

    forbidden_response = await other_user_client.get(
        f"/v1/documents/jobs/{job_id}/artifacts/{artifact['id']}"
    )
    assert forbidden_response.status_code == 404


@pytest.mark.asyncio
async def test_document_artifact_registration_rejects_client_managed_backends(client):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_analysis",
            "execution_mode": "managed",
            "parameters": {},
        },
    )
    assert create_response.status_code == 201
    job_id = create_response.json()["id"]

    register_response = await client.post(
        f"/v1/documents/jobs/{job_id}/artifacts",
        json={
            "role": "documents",
            "kind": "file",
            "storage_backend": "managed",
            "filename": "server-secret.txt",
            "local_path": "/tmp/server-secret.txt",
            "metadata": {},
        },
    )

    assert register_response.status_code == 400
    assert "local_reference" in register_response.json()["detail"]


@pytest.mark.asyncio
async def test_managed_dispatch_rejects_local_reference_artifacts(client):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_redaction",
            "execution_mode": "managed",
            "parameters": {"redaction_policy": "Remove secrets"},
        },
    )
    assert create_response.status_code == 201
    job_id = create_response.json()["id"]

    register_response = await client.post(
        f"/v1/documents/jobs/{job_id}/artifacts",
        json={
            "role": "documents",
            "kind": "file",
            "storage_backend": "local_reference",
            "filename": "input.txt",
            "local_path": "/tmp/input.txt",
            "metadata": {},
        },
    )
    assert register_response.status_code == 201

    dispatch_response = await client.post(
        f"/v1/documents/jobs/{job_id}/dispatch",
        json={"mode": "managed"},
    )

    assert dispatch_response.status_code == 400
    assert "managed storage" in dispatch_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_managed_dispatch_requires_predict_rlm_readiness(client, monkeypatch, tmp_path):
    monkeypatch.setattr(
        "src.api.services.document_jobs.get_document_engine_readiness",
        lambda: _not_ready_readiness(tmp_path),
    )

    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_analysis",
            "execution_mode": "managed",
            "parameters": {"instructions": "Summarize the uploaded file"},
        },
    )
    assert create_response.status_code == 201
    job = create_response.json()

    upload_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/artifacts",
        files={"file": ("brief.txt", io.BytesIO(b"system nominal"), "text/plain")},
        data={"role": "documents", "kind": "file"},
    )
    assert upload_response.status_code == 201

    dispatch_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/dispatch",
        json={"mode": "managed"},
    )
    assert dispatch_response.status_code == 503
    assert "predict-rlm document execution is unavailable" in dispatch_response.json()["detail"]


def test_execute_document_manifest_requires_predict_rlm(monkeypatch, tmp_path):
    from src.api.services.document_engine import execute_document_manifest

    monkeypatch.setattr(
        "src.api.services.document_engine.get_document_engine_readiness",
        lambda: _not_ready_readiness(tmp_path),
    )

    with pytest.raises(DocumentEnginePrerequisiteError, match="predict-rlm document execution"):
        execute_document_manifest({"template_id": "document_analysis"})


@pytest.mark.asyncio
async def test_managed_document_lifecycle_executes_through_worker(
    client, db_session, stub_predict_rlm_document_engine
):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_analysis",
            "execution_mode": "managed",
            "parameters": {"instructions": "Summarize the uploaded file"},
        },
    )
    assert create_response.status_code == 201
    job = create_response.json()

    upload_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/artifacts",
        files={"file": ("brief.txt", io.BytesIO(b"system nominal"), "text/plain")},
        data={"role": "documents", "kind": "file"},
    )
    assert upload_response.status_code == 201

    dispatch_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/dispatch",
        json={"mode": "managed"},
    )
    assert dispatch_response.status_code == 200
    assert dispatch_response.json()["status"] == "queued"

    claimed = await claim_next_document_job(db_session, worker_name="test-worker")
    assert claimed is not None
    executed = await execute_document_job(db_session, claimed_job=claimed)

    assert executed.status == "completed"
    assert executed.run.status == "completed"
    assert any(artifact.role == "report" for artifact in executed.artifacts)
    assert any(artifact.role == "summary" for artifact in executed.artifacts)

    run_response = await client.get(f"/v1/runs/{job['run_id']}")
    assert run_response.status_code == 200
    run_payload = run_response.json()
    assert run_payload["agent_id"] is None
    assert run_payload["subject_type"] == "document_job"
    assert run_payload["subject_id"] == job["id"]
    assert run_payload["template_id"] == "document_analysis"
    assert run_payload["execution_mode"] == "managed"
    assert any(trace["event_type"] == "job_completed" for trace in run_payload["traces"])


@pytest.mark.asyncio
async def test_local_launch_requires_predict_rlm_readiness(client, monkeypatch, tmp_path):
    monkeypatch.setattr(
        "src.api.services.document_jobs.get_document_engine_readiness",
        lambda: _not_ready_readiness(tmp_path),
    )

    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_redaction",
            "execution_mode": "local",
            "parameters": {"redaction_policy": "Remove SSNs"},
        },
    )
    assert create_response.status_code == 201
    job = create_response.json()

    register_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/artifacts",
        json={
            "role": "documents",
            "kind": "file",
            "storage_backend": "local_reference",
            "filename": "input.txt",
            "local_path": "/tmp/input.txt",
            "metadata": {},
        },
    )
    assert register_response.status_code == 201

    launch_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/launch-local",
        json={"output_dir": "/tmp/mutx-local-docs"},
    )
    assert launch_response.status_code == 503
    assert "predict-rlm document execution is unavailable" in launch_response.json()["detail"]


@pytest.mark.asyncio
async def test_local_document_lifecycle_supports_events_and_uploaded_outputs(
    client, stub_predict_rlm_document_engine
):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "document_redaction",
            "execution_mode": "local",
            "parameters": {"redaction_policy": "Remove SSNs"},
        },
    )
    assert create_response.status_code == 201
    job = create_response.json()

    register_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/artifacts",
        json={
            "role": "documents",
            "kind": "file",
            "storage_backend": "local_reference",
            "filename": "input.txt",
            "local_path": "/tmp/input.txt",
            "metadata": {},
        },
    )
    assert register_response.status_code == 201

    launch_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/launch-local",
        json={"output_dir": "/tmp/mutx-local-docs"},
    )
    assert launch_response.status_code == 200
    assert launch_response.json()["manifest"]["template_id"] == "document_redaction"

    running_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/events",
        json={
            "event_type": "dispatch_started",
            "message": "Local execution started",
            "status": "running",
        },
    )
    assert running_response.status_code == 200
    assert running_response.json()["status"] == "running"

    upload_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/artifacts",
        files={
            "file": (
                "verification.md",
                io.BytesIO(b"# Verification\n\nNo residual identifiers found."),
                "text/markdown",
            )
        },
        data={"role": "verification_report", "kind": "markdown"},
    )
    assert upload_response.status_code == 201

    complete_response = await client.post(
        f"/v1/documents/jobs/{job['id']}/events",
        json={
            "event_type": "job_completed",
            "message": "Local execution finished",
            "status": "completed",
            "output_text": "Local redaction complete",
            "result_summary": {"redacted_outputs": 1},
        },
    )
    assert complete_response.status_code == 200
    payload = complete_response.json()
    assert payload["status"] == "completed"
    assert payload["result_summary"] == {"redacted_outputs": 1}
    assert any(artifact["role"] == "verification_report" for artifact in payload["artifacts"])


@pytest.mark.asyncio
async def test_document_jobs_appear_in_runs_listing(client):
    create_response = await client.post(
        "/v1/documents/jobs",
        json={
            "template_id": "invoice_extraction",
            "execution_mode": "managed",
            "parameters": {},
        },
    )
    assert create_response.status_code == 201
    job = create_response.json()

    runs_response = await client.get("/v1/runs")
    assert runs_response.status_code == 200
    runs = runs_response.json()["items"]
    document_run = next(item for item in runs if item["id"] == job["run_id"])
    assert document_run["agent_id"] is None
    assert document_run["subject_label"] == "Invoice Extraction"
    assert document_run["template_id"] == "invoice_extraction"
