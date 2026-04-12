from __future__ import annotations

import json

import click

from cli.config import current_config, get_client
from cli.services import CLIServiceError, DocumentsService


def _service() -> DocumentsService:
    return DocumentsService(config=current_config(), client_factory=get_client)


def _echo_service_error(error: CLIServiceError) -> None:
    click.echo(f"Error: {error}", err=True)


def _collect_parameters(
    *,
    instructions: str | None,
    redaction_policy: str | None,
) -> dict[str, object]:
    payload: dict[str, object] = {}
    if instructions:
        payload["instructions"] = instructions
    if redaction_policy:
        payload["redaction_policy"] = redaction_policy
    return payload


@click.group(name="documents")
def documents_group():
    """Operate document workflow templates and jobs."""
    pass


@documents_group.command(name="templates")
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def templates_command(output: str):
    try:
        templates = _service().list_templates()
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if output == "json":
        click.echo(
            json.dumps(
                [
                    {
                        "id": item.id,
                        "name": item.name,
                        "summary": item.summary,
                        "description": item.description,
                        "supports_managed": item.supports_managed,
                        "supports_local": item.supports_local,
                    }
                    for item in templates
                ],
                indent=2,
            )
        )
        return

    for item in templates:
        click.echo(
            f"{item.id} | {item.name} | managed={item.supports_managed} | local={item.supports_local}"
        )


@documents_group.command(name="list")
@click.option("--status", "status_filter", default=None, help="Filter jobs by status")
@click.option("--template-id", default=None, help="Filter jobs by template id")
@click.option("--limit", default=20, show_default=True)
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def list_command(status_filter: str | None, template_id: str | None, limit: int, output: str):
    try:
        history = _service().list_jobs(
            limit=limit, status_filter=status_filter, template_id=template_id
        )
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if output == "json":
        click.echo(
            json.dumps(
                {
                    "total": history.total,
                    "items": [
                        {
                            "id": item.id,
                            "template_id": item.template_id,
                            "execution_mode": item.execution_mode,
                            "status": item.status,
                            "created_at": item.created_at,
                        }
                        for item in history.items
                    ],
                },
                indent=2,
            )
        )
        return

    if not history.items:
        click.echo("No document jobs found.")
        return

    for item in history.items:
        click.echo(
            f"{item.id} | {item.template_id} | {item.execution_mode} | {item.status} | {item.created_at or 'n/a'}"
        )


@documents_group.command(name="get")
@click.argument("job_id")
@click.option("--output", type=click.Choice(["table", "json"]), default="table")
def get_command(job_id: str, output: str):
    try:
        job = _service().get_job(job_id)
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    if output == "json":
        click.echo(
            json.dumps(
                {
                    "id": job.id,
                    "run_id": job.run_id,
                    "template_id": job.template_id,
                    "execution_mode": job.execution_mode,
                    "status": job.status,
                    "parameters": job.parameters,
                    "result_summary": job.result_summary,
                    "artifacts": [
                        {
                            "id": artifact.id,
                            "role": artifact.role,
                            "kind": artifact.kind,
                            "filename": artifact.filename,
                            "storage_backend": artifact.storage_backend,
                        }
                        for artifact in job.artifacts
                    ],
                },
                indent=2,
            )
        )
        return

    click.echo(f"Job: {job.id}")
    click.echo(f"Template: {job.template_id}")
    click.echo(f"Mode: {job.execution_mode}")
    click.echo(f"Status: {job.status}")
    click.echo(f"Artifacts: {len(job.artifacts)}")
    if job.error_message:
        click.echo(f"Error: {job.error_message}")


@documents_group.command(name="run")
@click.option("--template-id", required=True, help="Document template id")
@click.option("--mode", type=click.Choice(["managed", "local"]), default="managed")
@click.option("--file", "documents", multiple=True, type=click.Path(exists=True, dir_okay=False))
@click.option("--base-document", type=click.Path(exists=True, dir_okay=False), default=None)
@click.option("--comparison-document", type=click.Path(exists=True, dir_okay=False), default=None)
@click.option("--instructions", default=None, help="Optional workflow instructions")
@click.option("--redaction-policy", default=None, help="Required for document_redaction")
@click.option("--output-dir", type=click.Path(file_okay=False), default=None)
def run_command(
    template_id: str,
    mode: str,
    documents: tuple[str, ...],
    base_document: str | None,
    comparison_document: str | None,
    instructions: str | None,
    redaction_policy: str | None,
    output_dir: str | None,
):
    service = _service()
    parameters = _collect_parameters(
        instructions=instructions,
        redaction_policy=redaction_policy,
    )

    try:
        job = service.create_job(
            template_id=template_id,
            execution_mode=mode,
            parameters=parameters,
        )

        for path in documents:
            if mode == "managed":
                service.upload_artifact(
                    job_id=job.id, role="documents", kind="file", file_path=path
                )
            else:
                service.register_artifact_reference(
                    job_id=job.id,
                    role="documents",
                    kind="file",
                    file_path=path,
                )

        if base_document:
            artifact_method = (
                service.upload_artifact
                if mode == "managed"
                else service.register_artifact_reference
            )
            artifact_method(
                job_id=job.id,
                role="base_document",
                kind="file",
                file_path=base_document,
            )
        if comparison_document:
            artifact_method = (
                service.upload_artifact
                if mode == "managed"
                else service.register_artifact_reference
            )
            artifact_method(
                job_id=job.id,
                role="comparison_document",
                kind="file",
                file_path=comparison_document,
            )

        if mode == "managed":
            job = service.dispatch_job(job_id=job.id, mode=mode)
            click.echo(f"Queued managed document job {job.id} ({job.template_id}).")
            return

        job = service.run_local_job(job=job, output_dir=output_dir)
        click.echo(f"Completed local document job {job.id} ({job.status}).")
    except CLIServiceError as exc:
        _echo_service_error(exc)


@documents_group.command(name="download-artifact")
@click.argument("job_id")
@click.argument("artifact_id")
@click.option("--output", "destination", type=click.Path(), default=None)
def download_artifact_command(job_id: str, artifact_id: str, destination: str | None):
    try:
        path = _service().download_artifact(
            job_id=job_id,
            artifact_id=artifact_id,
            destination=destination,
        )
    except CLIServiceError as exc:
        _echo_service_error(exc)
        return

    click.echo(f"Downloaded artifact to {path}")
