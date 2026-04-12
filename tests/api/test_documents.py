from __future__ import annotations

import io

import pytest

from src.api.services.document_jobs import claim_next_document_job, execute_document_job


@pytest.fixture(autouse=True)
def enable_document_workflows(monkeypatch, tmp_path):
    from src.api.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "documents_enabled", True)
    monkeypatch.setattr(settings, "artifacts_dir", str(tmp_path / "artifacts"))
    monkeypatch.setattr(settings, "document_max_upload_mb", 10)
    yield


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
async def test_managed_document_lifecycle_executes_through_worker(client, db_session):
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
async def test_local_document_lifecycle_supports_events_and_uploaded_outputs(client):
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
