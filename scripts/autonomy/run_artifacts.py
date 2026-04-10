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
from urllib.parse import urlsplit, urlunsplit


RUN_SCHEMA_VERSION = "mutx.autonomy.run/v1alpha1"
RUN_ROOT = Path(".autonomy/runs")


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
        "origin_url": sanitize_git_remote_url(git_output(["remote", "get-url", "origin"])),
        "dirty": bool(status),
        "status_lines": [line for line in status.splitlines() if line],
    }


def sanitize_git_remote_url(url: str | None) -> str | None:
    if not url:
        return url
    split_url = urlsplit(url)
    if not split_url.scheme or not split_url.netloc or "@" not in split_url.netloc:
        return url
    sanitized_netloc = split_url.netloc.rsplit("@", maxsplit=1)[-1]
    return urlunsplit(
        (split_url.scheme, sanitized_netloc, split_url.path, split_url.query, split_url.fragment)
    )


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
        status = "passed" if all(result.get("exit_code") == 0 for result in results) else "failed"

    def mutate(record: dict[str, Any]) -> None:
        record["verification"] = {
            "status": status,
            "commands": [" ".join(command) for command in commands],
            "results": results,
        }

    update_run_record(run_json_path, mutate)


def finalize_run(run_json_path: Path, *, status: str) -> None:
    def mutate(record: dict[str, Any]) -> None:
        record["status"] = status
        record["finished_at"] = utc_now()
        record["provenance"]["git_after"] = git_snapshot()

    update_run_record(run_json_path, mutate)
