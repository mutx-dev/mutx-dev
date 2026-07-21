"""Fail-closed filesystem boundaries for autonomous work orders.

The contract is adapted from Mission Control v2.2.0's host-CLI dispatch
sandbox: resolve the execution directory through ``realpath``, keep it inside
the declared workspace, and clamp task-controlled limits before dispatch.

Upstream source (MIT, Copyright (c) 2026 Builderz Labs):
https://github.com/builderz-labs/mission-control/blob/0552b00b3b743ed12949e6deb19597655b02bbcc/src/lib/task-dispatch.ts
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


DEFAULT_MAX_CHANGED_FILES = 6
MAX_CHANGED_FILES_CEILING = 25
SANDBOX_BLOCKER_CLASS = "sandbox_violation"
_MAX_CHANGED_FILES = re.compile(r"^max_changed_files\s*=\s*(.+)$", re.IGNORECASE)


class WorkOrderSandboxError(ValueError):
    """A work order cannot be executed inside the declared boundary."""

    def __init__(self, reason: str, detail: str, **context: Any) -> None:
        super().__init__(detail)
        self.reason = reason
        self.detail = detail
        self.context = context

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": False,
            "reason": self.reason,
            "detail": self.detail,
            **self.context,
        }


@dataclass(frozen=True, slots=True)
class WorkOrderSandbox:
    """Validated execution boundary for one autonomous worker."""

    worktree: str
    base_commit: str
    allowed_paths: tuple[str, ...]
    max_changed_files: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": True,
            "worktree": self.worktree,
            "base_commit": self.base_commit,
            "allowed_paths": list(self.allowed_paths),
            "max_changed_files": self.max_changed_files,
        }


def _run_git(worktree: str | Path, args: list[str]) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["git", *args],
        cwd=str(worktree),
        capture_output=True,
        check=False,
    )


def resolve_git_worktree(raw_path: object) -> Path:
    """Resolve an exact Git worktree root, rejecting subdirectories and missing paths."""

    if not isinstance(raw_path, str) or not raw_path.strip():
        raise WorkOrderSandboxError("invalid_worktree", "Worktree must be a non-empty path")

    candidate = Path(raw_path).expanduser()
    try:
        resolved = candidate.resolve(strict=True)
    except OSError as exc:
        raise WorkOrderSandboxError(
            "invalid_worktree",
            "Worktree does not exist or cannot be resolved",
            worktree=raw_path,
        ) from exc
    if not resolved.is_dir():
        raise WorkOrderSandboxError(
            "invalid_worktree", "Worktree is not a directory", worktree=str(resolved)
        )

    top_level = _run_git(resolved, ["rev-parse", "--show-toplevel"])
    if top_level.returncode != 0:
        raise WorkOrderSandboxError(
            "invalid_worktree", "Worktree is not a Git checkout", worktree=str(resolved)
        )
    try:
        git_root = Path(top_level.stdout.decode().strip()).resolve(strict=True)
    except (OSError, UnicodeDecodeError) as exc:
        raise WorkOrderSandboxError(
            "invalid_worktree", "Git worktree root cannot be resolved", worktree=str(resolved)
        ) from exc
    if git_root != resolved:
        raise WorkOrderSandboxError(
            "worktree_not_root",
            "Execution must start at the exact Git worktree root",
            worktree=str(resolved),
            git_root=str(git_root),
        )
    return resolved


def _normalize_allowed_path(raw_path: object, worktree: Path) -> str:
    if not isinstance(raw_path, str) or not raw_path.strip():
        raise WorkOrderSandboxError(
            "invalid_allowed_path", "Allowed paths must be non-empty strings"
        )

    raw = raw_path.strip().rstrip("/")
    raw_parts = raw.split("/")
    parsed = PurePosixPath(raw)
    if (
        not raw
        or raw == "."
        or parsed.is_absolute()
        or "\\" in raw
        or "\x00" in raw
        or any(part in {"", ".", "..", ".git"} for part in raw_parts)
    ):
        raise WorkOrderSandboxError(
            "invalid_allowed_path",
            "Allowed paths must be repository-relative and cannot traverse or target .git",
            allowed_path=raw_path,
        )

    normalized = parsed.as_posix()
    resolved_target = (worktree / normalized).resolve(strict=False)
    if not resolved_target.is_relative_to(worktree):
        raise WorkOrderSandboxError(
            "allowed_path_escape",
            "Allowed path resolves outside the worktree",
            allowed_path=normalized,
        )
    return normalized


def normalize_allowed_paths(raw_paths: object, worktree: Path) -> tuple[str, ...]:
    """Validate and deduplicate repository-relative path prefixes."""

    if not isinstance(raw_paths, list) or not raw_paths:
        raise WorkOrderSandboxError(
            "missing_allowed_paths", "At least one allowed path is required"
        )
    normalized = tuple(dict.fromkeys(_normalize_allowed_path(path, worktree) for path in raw_paths))
    if not normalized:
        raise WorkOrderSandboxError(
            "missing_allowed_paths", "At least one allowed path is required"
        )
    return normalized


def max_changed_files_from_constraints(raw_constraints: object) -> int:
    """Read and clamp ``max_changed_files`` from untrusted work-order constraints."""

    if raw_constraints is None:
        return DEFAULT_MAX_CHANGED_FILES
    if not isinstance(raw_constraints, list):
        raise WorkOrderSandboxError("invalid_constraints", "Work-order constraints must be a list")

    requested_limits: list[int] = []
    for constraint in raw_constraints:
        if not isinstance(constraint, str):
            raise WorkOrderSandboxError(
                "invalid_constraints", "Every work-order constraint must be a string"
            )
        match = _MAX_CHANGED_FILES.fullmatch(constraint.strip())
        if not match:
            continue
        try:
            requested = int(match.group(1))
        except ValueError as exc:
            raise WorkOrderSandboxError(
                "invalid_changed_file_limit",
                "max_changed_files must be a positive integer",
                constraint=constraint,
            ) from exc
        if requested <= 0:
            raise WorkOrderSandboxError(
                "invalid_changed_file_limit",
                "max_changed_files must be a positive integer",
                constraint=constraint,
            )
        requested_limits.append(min(requested, MAX_CHANGED_FILES_CEILING))

    return min(requested_limits, default=DEFAULT_MAX_CHANGED_FILES)


def _decode_git_paths(payload: bytes) -> Iterable[str]:
    for raw_path in payload.split(b"\0"):
        if not raw_path:
            continue
        yield raw_path.decode("utf-8", errors="surrogateescape")


def current_commit(worktree: str | Path) -> str:
    result = _run_git(worktree, ["rev-parse", "--verify", "HEAD"])
    if result.returncode != 0:
        raise WorkOrderSandboxError(
            "missing_base_commit",
            "Autonomous execution requires a worktree with a committed HEAD",
            worktree=str(worktree),
        )
    try:
        return result.stdout.decode().strip()
    except UnicodeDecodeError as exc:
        raise WorkOrderSandboxError(
            "missing_base_commit",
            "Worktree HEAD cannot be decoded",
            worktree=str(worktree),
        ) from exc


def list_changed_files(worktree: str | Path, base_commit: str | None = None) -> list[str]:
    """Return committed, staged, unstaged, deleted, renamed, and untracked paths."""

    commands: list[list[str]] = [
        ["diff", "--name-only", "--no-renames", "-z"],
        ["diff", "--cached", "--name-only", "--no-renames", "-z"],
        ["ls-files", "--others", "--exclude-standard", "-z"],
    ]
    if base_commit:
        commands.insert(
            0,
            ["diff", base_commit, "--name-only", "--no-renames", "-z"],
        )
    changed: set[str] = set()
    for command in commands:
        result = _run_git(worktree, command)
        if result.returncode != 0:
            raise WorkOrderSandboxError(
                "git_status_failed",
                "Unable to inspect worktree changes",
                worktree=str(worktree),
            )
        changed.update(_decode_git_paths(result.stdout))
    return sorted(changed)


def _path_is_allowed(path: str, allowed_paths: tuple[str, ...]) -> bool:
    return any(path == allowed or path.startswith(f"{allowed}/") for allowed in allowed_paths)


def prepare_work_order_sandbox(work_order: dict[str, Any]) -> WorkOrderSandbox:
    """Validate a clean, realpath-confined execution boundary before dispatch."""

    worktree = resolve_git_worktree(work_order.get("worktree"))
    allowed_paths = normalize_allowed_paths(work_order.get("allowed_paths"), worktree)
    max_changed_files = max_changed_files_from_constraints(work_order.get("constraints"))
    dirty_paths = list_changed_files(worktree)
    if dirty_paths:
        raise WorkOrderSandboxError(
            "dirty_worktree",
            "Worktree must be clean before autonomous execution",
            worktree=str(worktree),
            changed_files=dirty_paths,
        )
    base_commit = current_commit(worktree)
    return WorkOrderSandbox(
        worktree=str(worktree),
        base_commit=base_commit,
        allowed_paths=allowed_paths,
        max_changed_files=max_changed_files,
    )


def assess_worktree_changes(sandbox: WorkOrderSandbox) -> dict[str, Any]:
    """Fail closed when a worker crosses its path or change-count boundary."""

    changed_files = list_changed_files(sandbox.worktree, sandbox.base_commit)
    head_commit = current_commit(sandbox.worktree)
    out_of_scope = [
        path for path in changed_files if not _path_is_allowed(path, sandbox.allowed_paths)
    ]
    if out_of_scope:
        return {
            **sandbox.to_dict(),
            "ok": False,
            "reason": "changed_path_outside_allowlist",
            "changed_files": changed_files,
            "out_of_scope": out_of_scope,
            "head_commit": head_commit,
        }
    if head_commit != sandbox.base_commit:
        return {
            **sandbox.to_dict(),
            "ok": False,
            "reason": "worker_mutated_git_history",
            "changed_files": changed_files,
            "head_commit": head_commit,
        }
    if len(changed_files) > sandbox.max_changed_files:
        return {
            **sandbox.to_dict(),
            "ok": False,
            "reason": "changed_file_limit_exceeded",
            "changed_files": changed_files,
            "changed_file_count": len(changed_files),
            "head_commit": head_commit,
        }
    return {**sandbox.to_dict(), "changed_files": changed_files, "head_commit": head_commit}
