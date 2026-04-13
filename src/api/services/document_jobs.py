from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import logging
import os
import socket
from pathlib import Path
from typing import Any
import uuid

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.metrics import (
    mutx_document_artifact_ops_total,
    mutx_document_execution_duration_seconds,
    mutx_document_jobs_total,
    mutx_document_queue_depth,
)
from src.api.models import AgentRun, AgentRunTrace, DocumentArtifact, DocumentJob, User
from src.api.models.schemas import (
    DocumentArtifactRegistrationCreate,
    DocumentArtifactResponse,
    DocumentJobCreate,
    DocumentJobDispatchRequest,
    DocumentJobEventCreate,
    DocumentJobLocalLaunchResponse,
    DocumentJobResponse,
)
from src.api.services.analytics import AnalyticsEventType, log_analytics_event
from src.api.services.document_engine import (
    DOCUMENT_TRACE_EVENT_TYPES,
    DocumentEngineError,
    EngineExecutionResult,
    build_document_manifest,
    execute_document_manifest,
    get_document_engine_readiness,
)
from src.api.services.document_storage import (
    MANAGED_STORAGE_BACKENDS,
    StoredArtifactResult,
    register_artifact_reference,
    resolve_artifact_path,
    store_uploaded_artifact,
    sync_managed_output_artifact,
)
from src.api.services.document_templates import get_document_template
from src.api.services.usage import track_usage_best_effort

logger = logging.getLogger(__name__)

DOCUMENT_PENDING_STATUSES = {"queued", "dispatching"}
DOCUMENT_ACTIVE_STATUSES = {"running"}
DOCUMENT_TERMINAL_STATUSES = {"completed", "failed"}


@dataclass(frozen=True)
class ClaimedDocumentJob:
    job: DocumentJob
    claim_token: str
    worker_name: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _decode_run_metadata(value: str | dict[str, Any] | None) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}
    except (TypeError, json.JSONDecodeError):
        return {}


def _encode_run_metadata(value: dict[str, Any]) -> str:
    return json.dumps(value)


def ensure_documents_enabled() -> None:
    readiness = get_document_engine_readiness()
    if not readiness.enabled:
        raise HTTPException(status_code=404, detail="Document workflows are disabled")


def _subject_metadata(job_id: uuid.UUID, template_id: str, execution_mode: str) -> dict[str, Any]:
    template = get_document_template(template_id)
    subject_label = template.name if template is not None else template_id
    return {
        "subject_type": "document_job",
        "subject_id": str(job_id),
        "subject_label": subject_label,
        "template_id": template_id,
        "execution_mode": execution_mode,
    }


def _serialize_artifact(artifact: DocumentArtifact) -> DocumentArtifactResponse:
    return DocumentArtifactResponse(
        id=artifact.id,
        job_id=artifact.job_id,
        role=artifact.role,
        kind=artifact.kind,
        storage_backend=artifact.storage_backend,
        storage_uri=artifact.storage_uri,
        local_path=artifact.local_path,
        filename=artifact.filename,
        content_type=artifact.content_type,
        size_bytes=artifact.size_bytes,
        sha256=artifact.sha256,
        metadata=artifact.extra_metadata or {},
        created_at=artifact.created_at,
        updated_at=artifact.updated_at,
    )


def serialize_document_job(job: DocumentJob) -> DocumentJobResponse:
    loaded_artifacts = job.__dict__.get("artifacts") or []
    return DocumentJobResponse(
        id=job.id,
        run_id=job.run_id,
        template_id=job.template_id,
        execution_mode=job.execution_mode,
        status=job.status,
        parameters=job.parameters or {},
        result_summary=job.result_summary or {},
        error_message=job.error_message,
        claimed_by=job.claimed_by,
        claimed_at=job.claimed_at,
        last_heartbeat_at=job.last_heartbeat_at,
        attempts=job.attempts,
        dispatched_at=job.dispatched_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
        artifacts=[_serialize_artifact(item) for item in loaded_artifacts],
    )


def _record_trace(
    db: AsyncSession,
    *,
    run: AgentRun,
    event_type: str,
    message: str | None,
    payload: dict[str, Any] | None = None,
    timestamp: datetime | None = None,
) -> AgentRunTrace:
    if event_type not in DOCUMENT_TRACE_EVENT_TYPES and event_type not in {
        "step",
        "tool_call",
        "prompt",
        "done",
    }:
        logger.debug("Recording non-standard trace event type %s for run %s", event_type, run.id)

    loaded_traces = run.__dict__.get("traces")
    if loaded_traces is None:
        sequence = 0
    else:
        sequence = len(loaded_traces)
    trace = AgentRunTrace(
        run=run,
        event_type=event_type,
        message=message,
        payload=json.dumps(payload or {}),
        sequence=sequence,
        timestamp=timestamp or _utcnow(),
    )
    db.add(trace)
    return trace


def _update_run_metadata(run: AgentRun, job: DocumentJob) -> None:
    metadata = _decode_run_metadata(run.run_metadata)
    metadata.update(_subject_metadata(job.id, job.template_id, job.execution_mode))
    run.run_metadata = _encode_run_metadata(metadata)


async def _get_document_job_query(
    db: AsyncSession, *, job_id: uuid.UUID, user_id: uuid.UUID
) -> DocumentJob | None:
    result = await db.execute(
        select(DocumentJob)
        .options(
            selectinload(DocumentJob.artifacts),
            selectinload(DocumentJob.run).selectinload(AgentRun.traces),
        )
        .where(DocumentJob.id == job_id, DocumentJob.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_document_job_or_404(
    db: AsyncSession, *, job_id: uuid.UUID, current_user: User
) -> DocumentJob:
    job = await _get_document_job_query(db, job_id=job_id, user_id=current_user.id)
    if job is None:
        raise HTTPException(status_code=404, detail="Document job not found")
    return job


async def get_document_artifact_or_404(
    db: AsyncSession,
    *,
    job_id: uuid.UUID,
    artifact_id: uuid.UUID,
    current_user: User,
) -> DocumentArtifact:
    job = await get_document_job_or_404(db, job_id=job_id, current_user=current_user)
    for artifact in job.artifacts:
        if artifact.id == artifact_id:
            return artifact
    raise HTTPException(status_code=404, detail="Document artifact not found")


def _validate_execution_mode(value: str) -> str:
    mode = value.strip().lower()
    if mode not in {"managed", "local"}:
        raise HTTPException(status_code=400, detail="execution_mode must be managed or local")
    return mode


def _required_input_names(template_id: str) -> set[str]:
    template = get_document_template(template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Document template not found")
    return {field.name for field in template.inputs if field.required}


def validate_job_inputs(job: DocumentJob, artifacts: list[DocumentArtifact]) -> None:
    required_names = _required_input_names(job.template_id)
    present_names = {artifact.role for artifact in artifacts}
    parameters = job.parameters or {}

    missing: list[str] = []
    for input_name in required_names:
        if input_name == "redaction_policy":
            if not str(parameters.get("redaction_policy") or "").strip():
                missing.append(input_name)
            continue
        if input_name not in present_names:
            missing.append(input_name)

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required inputs for template {job.template_id}: {', '.join(sorted(missing))}",
        )


def validate_artifact_registration_request(request: DocumentArtifactRegistrationCreate) -> None:
    if request.storage_backend != "local_reference":
        raise HTTPException(
            status_code=400,
            detail=(
                "Client artifact registration only supports local_reference storage_backend. "
                "Use multipart upload for managed files."
            ),
        )

    if not str(request.local_path or "").strip():
        raise HTTPException(
            status_code=400,
            detail="local_reference artifact registration requires local_path.",
        )

    if request.storage_uri:
        raise HTTPException(
            status_code=400,
            detail="local_reference artifact registration cannot set storage_uri.",
        )


def validate_dispatch_mode_artifacts(*, mode: str, artifacts: list[DocumentArtifact]) -> None:
    if mode != "managed":
        return

    invalid = [artifact.filename for artifact in artifacts if artifact.storage_backend not in MANAGED_STORAGE_BACKENDS]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=(
                "Managed execution requires artifacts in managed storage. "
                "Re-upload files with multipart or launch locally."
            ),
        )


async def create_document_job(
    db: AsyncSession,
    *,
    current_user: User,
    request: DocumentJobCreate,
) -> DocumentJob:
    ensure_documents_enabled()
    template = get_document_template(request.template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Document template not found")

    execution_mode = _validate_execution_mode(request.execution_mode)
    job_id = uuid.uuid4()
    run = AgentRun(
        agent_id=None,
        user_id=current_user.id,
        status="created",
        input_text=None,
        output_text=None,
        error_message=None,
        run_metadata=_encode_run_metadata(
            _subject_metadata(job_id, request.template_id, execution_mode)
        ),
        started_at=_utcnow(),
        completed_at=None,
    )
    db.add(run)
    await db.flush()

    job = DocumentJob(
        id=job_id,
        user_id=current_user.id,
        run_id=run.id,
        template_id=request.template_id,
        execution_mode=execution_mode,
        status="created",
        parameters=request.parameters or {},
        result_summary={},
    )
    db.add(job)
    await db.flush()
    _record_trace(
        db,
        run=run,
        event_type="job_created",
        message=f"Created document job for template {request.template_id}",
        payload={
            "job_id": str(job.id),
            "template_id": request.template_id,
            "execution_mode": execution_mode,
        },
    )
    await db.commit()

    mutx_document_jobs_total.labels(template_id=request.template_id, status="created").inc()
    await log_analytics_event(
        db,
        event_name="Document job created",
        event_type=AnalyticsEventType.AGENT_RUN_STARTED,
        user_id=current_user.id,
        properties={
            "job_id": str(job.id),
            "run_id": str(run.id),
            "template_id": request.template_id,
        },
    )
    await track_usage_best_effort(
        db=db,
        user_id=current_user.id,
        event_type="document_job_created",
        resource_type="document_job",
        resource_id=str(job.id),
        metadata={"template_id": request.template_id, "execution_mode": execution_mode},
    )
    refreshed = await _get_document_job_query(db, job_id=job.id, user_id=current_user.id)
    assert refreshed is not None
    return refreshed


async def list_document_jobs(
    db: AsyncSession,
    *,
    current_user: User,
    skip: int,
    limit: int,
    status_filter: str | None,
    template_id: str | None,
) -> tuple[list[DocumentJob], int]:
    ensure_documents_enabled()

    filters = [DocumentJob.user_id == current_user.id]
    if status_filter:
        filters.append(DocumentJob.status == status_filter)
    if template_id:
        filters.append(DocumentJob.template_id == template_id)

    total_stmt = select(func.count()).select_from(DocumentJob).where(*filters)
    total = (await db.execute(total_stmt)).scalar_one()

    query = (
        select(DocumentJob)
        .options(selectinload(DocumentJob.artifacts), selectinload(DocumentJob.run))
        .where(*filters)
        .order_by(DocumentJob.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = (await db.execute(query)).scalars().all()
    return items, total


async def register_document_artifact(
    db: AsyncSession,
    *,
    job: DocumentJob,
    request: DocumentArtifactRegistrationCreate,
) -> DocumentArtifact:
    validate_artifact_registration_request(request)
    artifact = await register_artifact_reference(
        db,
        job=job,
        role=request.role,
        kind=request.kind,
        filename=request.filename,
        storage_backend=request.storage_backend,
        local_path=request.local_path,
        storage_uri=request.storage_uri,
        content_type=request.content_type,
        size_bytes=request.size_bytes,
        sha256=request.sha256,
        metadata=request.metadata,
    )
    _record_trace(
        db,
        run=job.run,
        event_type="artifact_registered",
        message=f"Registered {request.role} artifact {request.filename}",
        payload={
            "artifact_id": str(artifact.id),
            "role": artifact.role,
            "storage_backend": artifact.storage_backend,
        },
    )
    mutx_document_artifact_ops_total.labels(
        operation="register", storage_backend=artifact.storage_backend
    ).inc()
    await db.commit()
    await db.refresh(job, attribute_names=["artifacts"])
    return artifact


async def store_document_upload(
    db: AsyncSession,
    *,
    job: DocumentJob,
    upload,
    role: str,
    kind: str,
    metadata: dict[str, Any] | None = None,
) -> StoredArtifactResult:
    result = await store_uploaded_artifact(
        db,
        job=job,
        upload=upload,
        role=role,
        kind=kind,
        metadata=metadata,
    )
    _record_trace(
        db,
        run=job.run,
        event_type="artifact_uploaded",
        message=f"Uploaded {role} artifact {result.artifact.filename}",
        payload={
            "artifact_id": str(result.artifact.id),
            "role": result.artifact.role,
            "storage_backend": result.artifact.storage_backend,
            "size_bytes": result.artifact.size_bytes,
        },
    )
    mutx_document_artifact_ops_total.labels(operation="upload", storage_backend="managed").inc()
    await db.commit()
    await db.refresh(job, attribute_names=["artifacts"])
    return result


async def dispatch_document_job(
    db: AsyncSession,
    *,
    job: DocumentJob,
    request: DocumentJobDispatchRequest,
) -> DocumentJob:
    ensure_documents_enabled()
    mode = _validate_execution_mode(request.mode or job.execution_mode)
    validate_dispatch_mode_artifacts(mode=mode, artifacts=job.artifacts)
    job.execution_mode = mode
    _update_run_metadata(job.run, job)
    validate_job_inputs(job, job.artifacts)
    job.status = "queued"
    job.dispatched_at = _utcnow()
    job.error_message = None
    job.run.status = "queued"
    _record_trace(
        db,
        run=job.run,
        event_type="dispatch_started",
        message="Document job dispatched",
        payload={"job_id": str(job.id), "execution_mode": job.execution_mode},
    )
    await db.commit()
    mutx_document_jobs_total.labels(template_id=job.template_id, status="queued").inc()
    return job


async def build_local_launch_response(
    db: AsyncSession,
    *,
    job: DocumentJob,
    output_dir: str | None,
) -> DocumentJobLocalLaunchResponse:
    ensure_documents_enabled()
    job.execution_mode = "local"
    _update_run_metadata(job.run, job)
    validate_job_inputs(job, job.artifacts)
    manifest = build_document_manifest(job, job.artifacts, output_dir=output_dir)
    await db.commit()
    return DocumentJobLocalLaunchResponse(
        job_id=job.id,
        template_id=job.template_id,
        execution_mode=job.execution_mode,
        manifest=manifest,
        artifacts=[_serialize_artifact(item) for item in job.artifacts],
    )


async def append_document_job_event(
    db: AsyncSession,
    *,
    job: DocumentJob,
    event: DocumentJobEventCreate,
) -> DocumentJob:
    timestamp = event.timestamp or _utcnow()
    _record_trace(
        db,
        run=job.run,
        event_type=event.event_type,
        message=event.message,
        payload=event.payload,
        timestamp=timestamp,
    )
    job.last_heartbeat_at = timestamp

    if event.status:
        job.status = event.status
        job.run.status = event.status

    if event.output_text is not None:
        job.run.output_text = event.output_text

    if event.error_message is not None:
        job.error_message = event.error_message
        job.run.error_message = event.error_message

    if event.result_summary is not None:
        job.result_summary = event.result_summary

    if event.status in DOCUMENT_TERMINAL_STATUSES:
        job.completed_at = timestamp
        job.run.completed_at = timestamp

    if event.event_type == "job_failed":
        mutx_document_jobs_total.labels(template_id=job.template_id, status="failed").inc()
    elif event.event_type == "job_completed":
        mutx_document_jobs_total.labels(template_id=job.template_id, status="completed").inc()

    await db.commit()
    return job


async def claim_next_document_job(
    db: AsyncSession,
    *,
    worker_name: str | None = None,
    stale_after_seconds: int = 300,
) -> ClaimedDocumentJob | None:
    ensure_documents_enabled()
    worker_identity = worker_name or f"{socket.gethostname()}:{os.getpid()}"
    now = _utcnow()
    stale_cutoff = now - timedelta(seconds=stale_after_seconds)

    result = await db.execute(
        select(DocumentJob)
        .options(
            selectinload(DocumentJob.artifacts),
            selectinload(DocumentJob.run).selectinload(AgentRun.traces),
        )
        .where(
            DocumentJob.status.in_(["queued", "running"]),
        )
        .order_by(DocumentJob.dispatched_at.asc().nullsfirst(), DocumentJob.created_at.asc())
    )
    candidates = result.scalars().all()
    for job in candidates:
        if (
            job.status == "running"
            and job.last_heartbeat_at
            and job.last_heartbeat_at > stale_cutoff
        ):
            continue

        claim_token = uuid.uuid4().hex
        job.status = "running"
        job.claimed_by = worker_identity
        job.claim_token = claim_token
        job.claimed_at = now
        job.last_heartbeat_at = now
        job.attempts = (job.attempts or 0) + 1
        job.run.status = "running"
        _record_trace(
            db,
            run=job.run,
            event_type="dispatch_started",
            message=f"Claimed by worker {worker_identity}",
            payload={"worker": worker_identity, "attempt": job.attempts},
        )
        await db.commit()
        return ClaimedDocumentJob(job=job, claim_token=claim_token, worker_name=worker_identity)
    return None


async def heartbeat_document_job(
    db: AsyncSession,
    *,
    job: DocumentJob,
    claim_token: str,
) -> None:
    if job.claim_token != claim_token:
        raise DocumentEngineError("Claim token mismatch")
    job.last_heartbeat_at = _utcnow()
    await db.commit()


async def _persist_execution_artifacts(
    db: AsyncSession,
    *,
    job: DocumentJob,
    execution_result: EngineExecutionResult,
) -> None:
    for item in execution_result.artifacts:
        stored = await sync_managed_output_artifact(
            db,
            job=job,
            source_path=item.path,
            role=item.role,
            kind=item.kind,
            content_type=item.content_type,
            metadata=item.metadata,
            filename=item.filename,
        )
        _record_trace(
            db,
            run=job.run,
            event_type="artifact_synced",
            message=f"Synced output artifact {stored.artifact.filename}",
            payload={
                "artifact_id": str(stored.artifact.id),
                "role": stored.artifact.role,
                "kind": stored.artifact.kind,
            },
        )
        mutx_document_artifact_ops_total.labels(operation="sync", storage_backend="managed").inc()


async def finalize_document_job_execution(
    db: AsyncSession,
    *,
    job: DocumentJob,
    execution_result: EngineExecutionResult,
    started_at: datetime,
) -> DocumentJob:
    await _persist_execution_artifacts(db, job=job, execution_result=execution_result)
    now = _utcnow()
    job.status = execution_result.status
    job.result_summary = execution_result.summary
    job.error_message = None
    job.completed_at = now
    job.last_heartbeat_at = now
    job.run.status = execution_result.status
    job.run.output_text = execution_result.output_text
    job.run.error_message = None
    job.run.completed_at = now

    for event in execution_result.events:
        _record_trace(
            db,
            run=job.run,
            event_type=event.event_type,
            message=event.message,
            payload=event.payload,
        )

    _record_trace(
        db,
        run=job.run,
        event_type="job_completed",
        message="Document job completed successfully",
        payload={"driver": execution_result.driver},
    )
    mutx_document_execution_duration_seconds.labels(
        template_id=job.template_id,
        status=execution_result.status,
    ).observe(max((_utcnow() - started_at).total_seconds(), 0))
    mutx_document_jobs_total.labels(template_id=job.template_id, status="completed").inc()
    await db.commit()
    await db.refresh(job, attribute_names=["artifacts", "run"])
    return job


async def fail_document_job_execution(
    db: AsyncSession,
    *,
    job: DocumentJob,
    error: Exception,
    started_at: datetime,
) -> DocumentJob:
    now = _utcnow()
    job.status = "failed"
    job.error_message = str(error)
    job.completed_at = now
    job.last_heartbeat_at = now
    job.run.status = "failed"
    job.run.error_message = str(error)
    job.run.completed_at = now
    _record_trace(
        db,
        run=job.run,
        event_type="job_failed",
        message="Document job failed",
        payload={"error": str(error)},
    )
    mutx_document_execution_duration_seconds.labels(
        template_id=job.template_id,
        status="failed",
    ).observe(max((_utcnow() - started_at).total_seconds(), 0))
    mutx_document_jobs_total.labels(template_id=job.template_id, status="failed").inc()
    await db.commit()
    await db.refresh(job, attribute_names=["artifacts", "run"])
    return job


async def execute_document_job(
    db: AsyncSession,
    *,
    claimed_job: ClaimedDocumentJob,
) -> DocumentJob:
    job = claimed_job.job
    started_at = _utcnow()
    try:
        validate_job_inputs(job, job.artifacts)
        manifest = build_document_manifest(job, job.artifacts)
        execution_result = execute_document_manifest(manifest)
        return await finalize_document_job_execution(
            db,
            job=job,
            execution_result=execution_result,
            started_at=started_at,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Document job %s failed: %s", job.id, exc)
        return await fail_document_job_execution(db, job=job, error=exc, started_at=started_at)


async def update_document_queue_depth(db: AsyncSession) -> None:
    total = (
        await db.execute(
            select(func.count())
            .select_from(DocumentJob)
            .where(DocumentJob.status.in_(DOCUMENT_PENDING_STATUSES | DOCUMENT_ACTIVE_STATUSES))
        )
    ).scalar_one()
    mutx_document_queue_depth.set(total)


def get_artifact_download_path(artifact: DocumentArtifact) -> Path:
    return resolve_artifact_path(artifact)
