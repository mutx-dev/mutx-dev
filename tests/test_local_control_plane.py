from __future__ import annotations

import json
from pathlib import Path

from cli.local_control_plane import (
    ensure_local_container_runtime,
    ensure_local_control_plane,
    ensure_managed_local_control_checkout,
    managed_local_control_manifest_path,
)


def _build_fake_control_plane_repo(root: Path) -> Path:
    (root / "scripts").mkdir(parents=True, exist_ok=True)
    (root / "infrastructure" / "docker").mkdir(parents=True, exist_ok=True)
    (root / ".env.example").write_text(
        "JWT_SECRET=replace-with-a-stable-secret\n", encoding="utf-8"
    )
    (root / "scripts" / "dev.sh").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8")
    (root / "infrastructure" / "docker" / "docker-compose.yml").write_text(
        "services: {}\n",
        encoding="utf-8",
    )
    return root


def test_ensure_managed_local_control_checkout_materializes_source_and_manifest(
    tmp_path: Path,
) -> None:
    source_repo = _build_fake_control_plane_repo(tmp_path / "source-repo")
    home_dir = tmp_path / "home"

    checkout = ensure_managed_local_control_checkout(
        source_ref=str(source_repo),
        home_dir=home_dir,
    )

    assert (checkout / "scripts" / "dev.sh").exists()
    manifest = json.loads(
        managed_local_control_manifest_path(home_dir=home_dir).read_text(encoding="utf-8")
    )
    assert manifest["checkout_root"] == str(checkout)
    assert manifest["source_ref"] == str(source_repo)


def test_ensure_local_control_plane_bootstraps_managed_checkout_and_waits_for_ready(
    tmp_path: Path,
) -> None:
    source_repo = _build_fake_control_plane_repo(tmp_path / "source-repo")
    home_dir = tmp_path / "home"
    progress: list[str] = []
    ready_state = {"value": False}
    started: dict[str, object] = {}

    def command_runner(command: list[str], cwd: Path) -> int:
        started["command"] = command
        started["cwd"] = cwd
        ready_state["value"] = True
        return 0

    state = ensure_local_control_plane(
        home_dir=home_dir,
        cwd=tmp_path / "outside",
        source_ref=str(source_repo),
        progress=progress.append,
        command_runner=command_runner,
        container_runtime_ensurer=lambda progress_callback: None,
        ready_checker=lambda api_url: ready_state["value"],
        wait_timeout=2,
    )

    assert state.bootstrapped_now is True
    assert state.source_kind == "managed_checkout"
    assert started["cwd"] == state.checkout_root
    assert started["command"] == [
        "/bin/bash",
        str(state.checkout_root / "scripts" / "dev.sh"),
        "up",
    ]
    assert any("Provisioning a managed localhost stack" in message for message in progress)
    assert any("Starting the local control plane" in message for message in progress)


def test_ensure_local_container_runtime_starts_docker_desktop_on_macos(
    tmp_path: Path, monkeypatch
) -> None:
    progress: list[str] = []
    commands: list[list[str]] = []
    ready_checks = {"count": 0}

    monkeypatch.setattr("cli.local_control_plane.sys.platform", "darwin")
    monkeypatch.setattr(
        "cli.local_control_plane.shutil.which", lambda name: "/usr/local/bin/docker"
    )

    def fake_ready() -> bool:
        ready_checks["count"] += 1
        return ready_checks["count"] >= 3

    ensure_local_container_runtime(
        progress=progress.append,
        docker_ready_checker=fake_ready,
        system_command_runner=lambda command: commands.append(command) or 0,
        wait_timeout=5,
    )

    assert ["open", "-a", "Docker"] in commands
    assert any("Starting Docker Desktop" in message for message in progress)
    assert any("Docker Desktop is ready" in message for message in progress)


def test_ensure_local_container_runtime_can_install_docker_desktop_on_macos(
    tmp_path: Path, monkeypatch
) -> None:
    progress: list[str] = []
    commands: list[list[str]] = []
    installed = {"value": False}

    monkeypatch.setattr("cli.local_control_plane.sys.platform", "darwin")
    monkeypatch.setattr(
        "cli.local_control_plane.shutil.which",
        lambda name: None if not installed["value"] else "/usr/local/bin/docker",
    )

    def fake_system(command: list[str]) -> int:
        commands.append(command)
        if command[:3] == ["brew", "install", "--cask"]:
            installed["value"] = True
        return 0

    ensure_local_container_runtime(
        progress=progress.append,
        prompt_install=lambda prompt: True,
        docker_ready_checker=lambda: installed["value"],
        system_command_runner=fake_system,
        wait_timeout=2,
    )

    assert ["brew", "install", "--cask", "docker"] in commands
    assert ["open", "-a", "Docker"] in commands
    assert any("Installing Docker Desktop" in message for message in progress)
