from __future__ import annotations

import hashlib
import json
import os
import platform
import shutil
import socket
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

RUN_SCHEMA_VERSION = "mutx.autonomy.run/v1alpha1"
VERIFICATION_RECEIPT_SCHEMA_VERSION = "mutx.autonomy.verification-receipt/v1alpha1"
RUN_ROOT = Path(".autonomy/runs")
VERIFICATION_RECEIPT_PATH = "verification/receipt.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def build_run_id(work_order: dict[str, Any]) -> str:
    issue = work_order.get("issue", "manual")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    return f"issue-{issue}-{timestamp}"


def canonical_json(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True) + "\n"


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git_output(args: list[str]) -> str | None:
    result = subprocess.run(
        ["git", *args],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    output = result.stdout.strip()
    return output or None


def git_snapshot() -> dict[str, Any]:
    status = git_output(["status", "--short"]) or ""
    return {
        "head": git_output(["rev-parse", "HEAD"]),
        "branch": git_output(["branch", "--show-current"]),
        "origin_url": git_output(["remote", "get-url", "origin"]),
        "dirty": bool(status),
        "status_lines": [line for line in status.splitlines() if line],
    }


def load_run_record(run_json_path: Path) -> dict[str, Any]:
    return json.loads(run_json_path.read_text())


def save_run_record(run_json_path: Path, record: dict[str, Any]) -> None:
    run_json_path.write_text(canonical_json(record))


def update_run_record(
    run_json_path: Path, mutator: Callable[[dict[str, Any]], None]
) -> dict[str, Any]:
    record = load_run_record(run_json_path)
    mutator(record)
    record["updated_at"] = utc_now()
    save_run_record(run_json_path, record)
    return record


def build_artifact_entry(
    artifact_path: Path,
    *,
    run_dir: Path,
    name: str,
    kind: str,
    source_path: str | None = None,
) -> dict[str, Any]:
    entry = {
        "name": name,
        "kind": kind,
        "path": str(artifact_path.relative_to(run_dir)),
        "sha256": file_sha256(artifact_path),
        "bytes": artifact_path.stat().st_size,
    }
    if source_path:
        entry["source_path"] = source_path
    return entry


def upsert_artifact(record: dict[str, Any], artifact: dict[str, Any]) -> None:
    artifacts = record.setdefault("artifacts", [])
    for index, existing in enumerate(artifacts):
        if existing.get("name") == artifact["name"]:
            artifacts[index] = artifact
            break
    else:
        artifacts.append(artifact)


def build_verification_summary(command_count: int, results: list[dict[str, Any]]) -> dict[str, Any]:
    completed_count = len(results)
    passed_count = sum(1 for result in results if result.get("exit_code") == 0)
    failed_count = sum(1 for result in results if result.get("exit_code") != 0)
    not_run_count = max(command_count - completed_count, 0)
    return {
        "command_count": command_count,
        "completed_count": completed_count,
        "passed_count": passed_count,
        "failed_count": failed_count,
        "not_run_count": not_run_count,
        "stopped_early": failed_count > 0 and not_run_count > 0,
    }


def build_artifact_lookup(record: dict[str, Any]) -> dict[str, dict[str, Any]]:
    artifacts = record.get("artifacts", [])
    if not isinstance(artifacts, list):
        return {}
    return {
        artifact["path"]: artifact
        for artifact in artifacts
        if isinstance(artifact, dict) and isinstance(artifact.get("path"), str)
    }


def artifact_reference(
    artifacts_by_path: dict[str, dict[str, Any]], artifact_path: str | None
) -> dict[str, Any] | None:
    if not artifact_path:
        return None
    artifact = artifacts_by_path.get(artifact_path)
    if artifact is None:
        return {"path": artifact_path}
    return {
        key: artifact[key] for key in ("name", "kind", "path", "sha256", "bytes") if key in artifact
    }


def build_verification_receipt_payload(
    run_json_path: Path, record: dict[str, Any]
) -> dict[str, Any]:
    verification = record.get("verification", {})
    commands = verification.get("commands", [])
    results = verification.get("results", [])
    summary = verification.get("summary")
    if not isinstance(summary, dict):
        summary = build_verification_summary(len(commands), results)

    artifacts_by_path = build_artifact_lookup(record)
    verification_results = []
    for index, result in enumerate(results, start=1):
        command = (
            commands[index - 1] if index - 1 < len(commands) else " ".join(result.get("argv", []))
        )
        entry = {
            "index": index,
            "command": command,
            "argv": result.get("argv", []),
            "status": result.get("status"),
            "exit_code": result.get("exit_code"),
            "started_at": result.get("started_at"),
            "finished_at": result.get("finished_at"),
        }
        stdout_artifact = artifact_reference(artifacts_by_path, result.get("stdout_artifact"))
        stderr_artifact = artifact_reference(artifacts_by_path, result.get("stderr_artifact"))
        if stdout_artifact:
            entry["stdout_artifact"] = stdout_artifact
        if stderr_artifact:
            entry["stderr_artifact"] = stderr_artifact
        verification_results.append(entry)

    input_paths = []
    provenance_inputs = record.get("provenance", {}).get("inputs", {})
    for input_name in ("work_order", "brief"):
        input_path = provenance_inputs.get(input_name, {}).get("path")
        input_artifact = artifact_reference(artifacts_by_path, input_path)
        if input_artifact:
            input_paths.append(input_artifact)

    command = record.get("command", {})
    command_summary = {
        "status": command.get("status"),
        "exit_code": command.get("exit_code"),
        "started_at": command.get("started_at"),
        "finished_at": command.get("finished_at"),
        "note": command.get("note"),
    }
    command_stdout = artifact_reference(artifacts_by_path, command.get("stdout_artifact"))
    command_stderr = artifact_reference(artifacts_by_path, command.get("stderr_artifact"))
    if command_stdout:
        command_summary["stdout_artifact"] = command_stdout
    if command_stderr:
        command_summary["stderr_artifact"] = command_stderr

    return {
        "schema_version": VERIFICATION_RECEIPT_SCHEMA_VERSION,
        "run_id": record.get("run_id"),
        "recorded_at": utc_now(),
        "run_status": record.get("status"),
        "verification": {
            "status": verification.get("status"),
            "commands": commands,
            "summary": summary,
            "results": verification_results,
        },
        "command": command_summary,
        "evidence": {
            "inputs": input_paths,
            "policy_checkpoints": artifact_reference(
                artifacts_by_path, "artifacts/policy-checkpoints.json"
            ),
            "guardrail_failure": artifact_reference(
                artifacts_by_path, "artifacts/guardrail-failure.json"
            ),
            "run_manifest": {"path": str(run_json_path.name)},
        },
        "provenance": {
            "capture_mode": record.get("provenance", {}).get("capture_mode"),
            "git_before": record.get("provenance", {}).get("git_before"),
            "git_after": record.get("provenance", {}).get("git_after"),
        },
    }


def write_verification_receipt(run_json_path: Path) -> dict[str, Any]:
    record = load_run_record(run_json_path)
    verification = record.get("verification", {})
    commands = verification.get("commands", [])
    results = verification.get("results", [])
    summary = build_verification_summary(len(commands), results)
    receipt = build_verification_receipt_payload(run_json_path, record)
    receipt["verification"]["summary"] = summary
    artifact = write_text_artifact(
        run_json_path,
        name="verification_receipt",
        kind="receipt",
        relative_path=VERIFICATION_RECEIPT_PATH,
        content=canonical_json(receipt),
    )

    def mutate(updated_record: dict[str, Any]) -> None:
        updated_record.setdefault("verification", {})
        updated_record["verification"]["summary"] = summary
        updated_record["verification"]["receipt_artifact"] = artifact["path"]

    update_run_record(run_json_path, mutate)
    return artifact


def copy_artifact_to_run(
    run_json_path: Path,
    source_path: Path,
    *,
    name: str,
    kind: str,
    relative_path: str,
) -> dict[str, Any]:
    run_dir = run_json_path.parent
    destination = run_dir / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, destination)
    artifact = build_artifact_entry(
        destination,
        run_dir=run_dir,
        name=name,
        kind=kind,
        source_path=str(source_path),
    )
    update_run_record(run_json_path, lambda record: upsert_artifact(record, artifact))
    return artifact


def write_text_artifact(
    run_json_path: Path,
    *,
    name: str,
    kind: str,
    relative_path: str,
    content: str,
) -> dict[str, Any]:
    run_dir = run_json_path.parent
    artifact_path = run_dir / relative_path
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    artifact_path.write_text(content)
    artifact = build_artifact_entry(artifact_path, run_dir=run_dir, name=name, kind=kind)
    update_run_record(run_json_path, lambda record: upsert_artifact(record, artifact))
    return artifact


def initialize_run_artifact(
    work_order: dict[str, Any],
    work_order_path: Path,
    brief_path: Path,
    *,
    base_branch: str,
) -> Path:
    run_id = build_run_id(work_order)
    run_dir = RUN_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    run_json_path = run_dir / "run.json"

    work_order_copy = run_dir / "inputs/work-order.json"
    work_order_copy.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(work_order_path, work_order_copy)

    brief_copy = run_dir / "inputs/brief.md"
    brief_copy.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(brief_path, brief_copy)

    created_at = utc_now()
    record = {
        "schema_version": RUN_SCHEMA_VERSION,
        "run_id": run_id,
        "status": "prepared",
        "created_at": created_at,
        "updated_at": created_at,
        "finished_at": None,
        "params": {
            "issue": work_order.get("issue"),
            "title": work_order.get("title"),
            "url": work_order.get("url"),
            "labels": work_order.get("labels", []),
            "agent": work_order.get("agent"),
            "reviewer": work_order.get("reviewer"),
            "lane": work_order.get("lane"),
            "branch": work_order.get("branch"),
            "acceptance": work_order.get("acceptance", ""),
            "limits": {
                "max_changed_files": os.environ.get("AUTONOMY_MAX_CHANGED_FILES"),
                "max_patch_bytes": os.environ.get("AUTONOMY_MAX_PATCH_BYTES"),
                "open_pr": os.environ.get("AUTONOMY_OPEN_PR", "false"),
            },
        },
        "command": {
            "status": "pending",
            "template": None,
            "argv": [],
            "cwd": str(Path.cwd()),
            "started_at": None,
            "finished_at": None,
            "exit_code": None,
            "stdout_artifact": None,
            "stderr_artifact": None,
            "note": None,
        },
        "verification": {
            "status": "pending",
            "commands": [],
            "results": [],
            "summary": build_verification_summary(0, []),
            "receipt_artifact": None,
        },
        "artifacts": [
            build_artifact_entry(
                work_order_copy,
                run_dir=run_dir,
                name="work_order",
                kind="input",
                source_path=str(work_order_path),
            ),
            build_artifact_entry(
                brief_copy,
                run_dir=run_dir,
                name="brief",
                kind="input",
                source_path=str(brief_path),
            ),
        ],
        "provenance": {
            "capture_mode": "local-first",
            "executor": {
                "script": "scripts/autonomy/execute_work_order.py",
                "hostname": socket.gethostname(),
                "platform": platform.platform(),
                "python": platform.python_version(),
                "cwd": str(Path.cwd()),
            },
            "git_before": {
                **git_snapshot(),
                "base_branch": base_branch,
            },
            "git_after": None,
            "inputs": {
                "work_order": {
                    "path": "inputs/work-order.json",
                    "sha256": file_sha256(work_order_copy),
                },
                "brief": {
                    "path": "inputs/brief.md",
                    "sha256": file_sha256(brief_copy),
                },
            },
        },
    }
    save_run_record(run_json_path, record)
    return run_json_path


def record_command_start(
    run_json_path: Path,
    *,
    template: str,
    argv: list[str],
    cwd: str,
) -> None:
    def mutate(record: dict[str, Any]) -> None:
        record["status"] = "running"
        record["command"].update(
            {
                "status": "running",
                "template": template,
                "argv": argv,
                "cwd": cwd,
                "started_at": utc_now(),
                "finished_at": None,
                "exit_code": None,
                "stdout_artifact": None,
                "stderr_artifact": None,
                "note": None,
            }
        )

    update_run_record(run_json_path, mutate)


def record_command_skipped(run_json_path: Path, *, note: str) -> None:
    def mutate(record: dict[str, Any]) -> None:
        record["command"].update(
            {
                "status": "skipped",
                "finished_at": utc_now(),
                "exit_code": 0,
                "note": note,
            }
        )

    update_run_record(run_json_path, mutate)


def record_command_finish(
    run_json_path: Path,
    *,
    exit_code: int,
    stdout_artifact: str | None,
    stderr_artifact: str | None,
) -> None:
    def mutate(record: dict[str, Any]) -> None:
        record["command"].update(
            {
                "status": "succeeded" if exit_code == 0 else "failed",
                "finished_at": utc_now(),
                "exit_code": exit_code,
                "stdout_artifact": stdout_artifact,
                "stderr_artifact": stderr_artifact,
            }
        )

    update_run_record(run_json_path, mutate)


def record_verification_results(
    run_json_path: Path,
    *,
    commands: list[list[str]],
    results: list[dict[str, Any]],
) -> None:
    status = "skipped"
    if commands:
        status = (
            "passed"
            if len(results) == len(commands)
            and all(result.get("exit_code") == 0 for result in results)
            else "failed"
        )
    summary = build_verification_summary(len(commands), results)

    def mutate(record: dict[str, Any]) -> None:
        record["verification"] = {
            "status": status,
            "commands": [" ".join(command) for command in commands],
            "results": results,
            "summary": summary,
            "receipt_artifact": record.get("verification", {}).get("receipt_artifact"),
        }

    update_run_record(run_json_path, mutate)
    write_verification_receipt(run_json_path)


def finalize_run(run_json_path: Path, *, status: str) -> None:
    def mutate(record: dict[str, Any]) -> None:
        record["status"] = status
        record["finished_at"] = utc_now()
        record["provenance"]["git_after"] = git_snapshot()

    update_run_record(run_json_path, mutate)
    write_verification_receipt(run_json_path)
