from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import httpx

from cli.config import LOCAL_API_URL
from cli.errors import CLIServiceError

DEFAULT_CONTROL_PLANE_SOURCE_REF = (
    os.getenv("MUTX_CONTROL_SOURCE_REF")
    or os.getenv("MUTX_CLI_SOURCE_REF")
    or "https://github.com/mutx-dev/mutx-dev/archive/refs/heads/main.tar.gz"
)


class LocalControlPlaneError(CLIServiceError):
    """Raised when MUTX cannot prepare or start the managed localhost stack."""


@dataclass(frozen=True)
class LocalControlPlaneState:
    api_url: str
    checkout_root: Path
    managed_root: Path
    source_kind: str
    bootstrapped_now: bool


def _run_system_command(command: list[str]) -> int:
    result = subprocess.run(command, check=False)
    return int(result.returncode)


def _docker_daemon_ready() -> bool:
    docker_bin = shutil.which("docker")
    if not docker_bin:
        return False
    try:
        result = subprocess.run(
            [docker_bin, "info"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        return False
    return result.returncode == 0


def ensure_local_container_runtime(
    *,
    progress: Callable[[str], None] | None = None,
    prompt_install: Callable[[str], bool] | None = None,
    system_command_runner: Callable[[list[str]], int] | None = None,
    docker_ready_checker: Callable[[], bool] | None = None,
    wait_timeout: int = 120,
) -> None:
    ready = docker_ready_checker or _docker_daemon_ready
    run_command = system_command_runner or _run_system_command
    docker_bin = shutil.which("docker")

    if ready():
        return

    if sys.platform == "darwin":
        if docker_bin is None:
            prompt = (
                "Docker Desktop is required for the Local lane. "
                "Install it with Homebrew now?"
            )
            if prompt_install is None or not prompt_install(prompt):
                raise LocalControlPlaneError(
                    "Docker Desktop is required for the Local lane. "
                    "Install it, then rerun `mutx setup local`, or use `mutx setup hosted` "
                    "for the zero-Docker path."
                )
            if progress is not None:
                progress("Installing Docker Desktop for the Local lane")
            if run_command(["brew", "install", "--cask", "docker"]) != 0:
                raise LocalControlPlaneError(
                    "MUTX could not install Docker Desktop automatically. "
                    "Run `brew install --cask docker`, open Docker Desktop, then rerun "
                    "`mutx setup local`."
                )

        if progress is not None:
            progress("Starting Docker Desktop")
        run_command(["open", "-a", "Docker"])

        deadline = time.monotonic() + max(wait_timeout, 10)
        while time.monotonic() < deadline:
            if ready():
                if progress is not None:
                    progress("Docker Desktop is ready")
                return
            time.sleep(1)

        raise LocalControlPlaneError(
            "Docker Desktop was launched, but the daemon never became ready. "
            "Finish Docker's first-run prompts, then rerun `mutx setup local`, or use "
            "`mutx setup hosted` if you do not want local container dependencies."
        )

    if docker_bin is None:
        raise LocalControlPlaneError(
            "Docker is required for the Local lane and is not installed. "
            "Install Docker, then rerun `mutx setup local`, or use `mutx setup hosted` "
            "for the managed path."
        )

    raise LocalControlPlaneError(
        "Docker is installed but the daemon is not running. "
        "Start Docker and rerun `mutx setup local`, or use `mutx setup hosted` "
        "for the managed path."
    )


def mutx_home_dir() -> Path:
    return Path(os.getenv("MUTX_HOME_DIR") or (Path.home() / ".mutx"))


def managed_local_control_root(*, home_dir: Path | None = None) -> Path:
    return (home_dir or mutx_home_dir()) / "runtime" / "local-control"


def managed_local_control_checkout(*, home_dir: Path | None = None) -> Path:
    return managed_local_control_root(home_dir=home_dir) / "repo"


def managed_local_control_manifest_path(*, home_dir: Path | None = None) -> Path:
    return managed_local_control_root(home_dir=home_dir) / "manifest.json"


def local_control_plane_ready(api_url: str = LOCAL_API_URL, *, timeout: float = 2.0) -> bool:
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            for suffix in ("/health", "/ready"):
                try:
                    response = client.get(f"{api_url.rstrip('/')}{suffix}")
                except httpx.HTTPError:
                    continue
                if 200 <= response.status_code < 400:
                    return True
    except httpx.HTTPError:
        return False
    return False


def detect_local_repo_root(start: Path | None = None) -> Path | None:
    current = (start or Path.cwd()).resolve()
    while True:
        if _is_valid_checkout_root(current):
            return current
        if current.parent == current:
            return None
        current = current.parent


def ensure_local_control_plane(
    *,
    api_url: str = LOCAL_API_URL,
    progress: Callable[[str], None] | None = None,
    source_ref: str | None = None,
    home_dir: Path | None = None,
    cwd: Path | None = None,
    command_runner: Callable[[list[str], Path], int] | None = None,
    container_runtime_ensurer: Callable[[Callable[[str], None] | None], None] | None = None,
    ready_checker: Callable[[str], bool] | None = None,
    wait_timeout: int = 120,
) -> LocalControlPlaneState:
    ready = ready_checker or local_control_plane_ready
    managed_root = managed_local_control_root(home_dir=home_dir)

    checkout_root = detect_local_repo_root(cwd)
    source_kind = "existing_checkout" if checkout_root is not None else "external_runtime"

    if ready(api_url):
        if checkout_root is None:
            managed_checkout = managed_local_control_checkout(home_dir=home_dir)
            if _is_valid_checkout_root(managed_checkout):
                checkout_root = managed_checkout
                source_kind = "managed_checkout"
            else:
                checkout_root = managed_root
        return LocalControlPlaneState(
            api_url=api_url,
            checkout_root=checkout_root,
            managed_root=managed_root,
            source_kind=source_kind,
            bootstrapped_now=False,
        )

    if container_runtime_ensurer is not None:
        container_runtime_ensurer(progress)

    if checkout_root is None:
        checkout_root = ensure_managed_local_control_checkout(
            source_ref=source_ref,
            home_dir=home_dir,
            progress=progress,
        )
        source_kind = "managed_checkout"

    if progress is not None:
        target = "~/.mutx/runtime/local-control" if source_kind == "managed_checkout" else str(checkout_root)
        progress(f"Starting the local control plane from {target}")

    return_code = _run_dev_up(checkout_root, command_runner=command_runner)
    if return_code != 0:
        raise LocalControlPlaneError(
            "Could not start the local control plane. "
            f"Check Docker and rerun, or inspect `{checkout_root / 'scripts' / 'dev.sh'} up` directly."
        )

    if progress is not None:
        progress(f"Waiting for the local control plane at {api_url}")

    deadline = time.monotonic() + max(wait_timeout, 5)
    while time.monotonic() < deadline:
        if ready(api_url):
            state = LocalControlPlaneState(
                api_url=api_url,
                checkout_root=checkout_root,
                managed_root=managed_root,
                source_kind=source_kind,
                bootstrapped_now=True,
            )
            _write_manifest(state, source_ref=source_ref or DEFAULT_CONTROL_PLANE_SOURCE_REF)
            return state
        time.sleep(1)

    raise LocalControlPlaneError(
        f"MUTX started the local control plane checkout at {checkout_root}, "
        f"but {api_url} never became ready. Run `{checkout_root / 'scripts' / 'dev.sh'} logs` and retry."
    )


def ensure_managed_local_control_checkout(
    *,
    source_ref: str | None = None,
    home_dir: Path | None = None,
    progress: Callable[[str], None] | None = None,
) -> Path:
    managed_root = managed_local_control_root(home_dir=home_dir)
    checkout_root = managed_local_control_checkout(home_dir=home_dir)
    managed_root.mkdir(parents=True, exist_ok=True)

    if _is_valid_checkout_root(checkout_root):
        return checkout_root

    if progress is not None:
        progress("Provisioning a managed localhost stack under ~/.mutx/runtime/local-control")

    resolved_source_ref = source_ref or DEFAULT_CONTROL_PLANE_SOURCE_REF
    with tempfile.TemporaryDirectory(prefix="mutx-local-control-", dir=str(managed_root)) as tmp_dir:
        staging_root = Path(tmp_dir) / "source"
        staging_root.mkdir(parents=True, exist_ok=True)
        extracted_root = _materialize_source_ref(resolved_source_ref, staging_root)
        source_root = _resolve_checkout_root(extracted_root)
        prepared_root = Path(tmp_dir) / "repo"
        shutil.copytree(source_root, prepared_root, dirs_exist_ok=True)

        previous_env = checkout_root / ".env"
        if previous_env.exists():
            shutil.copy2(previous_env, prepared_root / ".env")

        _replace_tree(checkout_root, prepared_root)

    state = LocalControlPlaneState(
        api_url=LOCAL_API_URL,
        checkout_root=checkout_root,
        managed_root=managed_root,
        source_kind="managed_checkout",
        bootstrapped_now=False,
    )
    _write_manifest(state, source_ref=resolved_source_ref)
    return checkout_root


def _run_dev_up(
    checkout_root: Path,
    *,
    command_runner: Callable[[list[str], Path], int] | None = None,
) -> int:
    command = ["/bin/bash", str(checkout_root / "scripts" / "dev.sh"), "up"]
    if command_runner is not None:
        return command_runner(command, checkout_root)
    result = subprocess.run(command, cwd=checkout_root, check=False)
    return int(result.returncode)


def _materialize_source_ref(source_ref: str, destination: Path) -> Path:
    candidate = Path(source_ref).expanduser()
    if candidate.exists():
        if candidate.is_dir():
            target = destination / candidate.name
            shutil.copytree(candidate, target, dirs_exist_ok=True)
            return target
        if candidate.is_file():
            _extract_archive(candidate, destination)
            return destination

    if source_ref.startswith(("http://", "https://")):
        archive_path = destination / "control-plane.tar.gz"
        with urllib.request.urlopen(source_ref) as response, open(archive_path, "wb") as handle:
            shutil.copyfileobj(response, handle)
        _extract_archive(archive_path, destination)
        return destination

    raise LocalControlPlaneError(
        "MUTX could not provision the local control plane source. "
        f"Unsupported source ref: {source_ref}"
    )


def _extract_archive(archive_path: Path, destination: Path) -> None:
    with tarfile.open(archive_path, "r:*") as archive:
        archive.extractall(destination)


def _resolve_checkout_root(path: Path) -> Path:
    if _is_valid_checkout_root(path):
        return path
    for child in sorted(path.iterdir()):
        if child.is_dir() and _is_valid_checkout_root(child):
            return child
    raise LocalControlPlaneError(
        "MUTX downloaded a source bundle for the local control plane, "
        "but it did not look like a runnable checkout."
    )


def _is_valid_checkout_root(path: Path) -> bool:
    return (
        path.is_dir()
        and (path / "scripts" / "dev.sh").exists()
        and (path / "infrastructure" / "docker" / "docker-compose.yml").exists()
        and (path / ".env.example").exists()
    )


def _replace_tree(target: Path, source: Path) -> None:
    if target.is_symlink() or target.is_file():
        target.unlink()
    elif target.exists():
        shutil.rmtree(target)
    source.rename(target)


def _write_manifest(state: LocalControlPlaneState, *, source_ref: str) -> None:
    manifest_path = state.managed_root / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "api_url": state.api_url,
        "checkout_root": str(state.checkout_root),
        "managed_root": str(state.managed_root),
        "source_kind": state.source_kind,
        "source_ref": source_ref,
        "last_started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
