from __future__ import annotations

import os
from pathlib import Path

from click.testing import CliRunner

from cli.commands.update import InstallLane, _install_source_overlay, _verify_cli_surface
from cli.main import cli
from tests.test_install_script import build_fake_cli_package, write_executable


def test_update_uses_installer_managed_flow_for_source_overlay(monkeypatch) -> None:
    import cli.commands.update as update_module

    captured: dict[str, object] = {}

    monkeypatch.setattr(update_module, "_is_git_repo", lambda: False)
    monkeypatch.setattr(
        update_module,
        "_detect_install_lane",
        lambda: InstallLane("source-overlay", Path("/opt/homebrew/bin/mutx")),
    )

    def fake_update(lane: InstallLane, *, check: bool, force: bool) -> None:
        captured["lane"] = lane.kind
        captured["check"] = check
        captured["force"] = force

    monkeypatch.setattr(update_module, "_run_installer_managed_update", fake_update)

    runner = CliRunner()
    result = runner.invoke(cli, ["update", "--force"])

    assert result.exit_code == 0
    assert captured == {"lane": "source-overlay", "check": False, "force": True}


def test_update_unknown_lane_recommends_official_installer(monkeypatch) -> None:
    import cli.commands.update as update_module

    monkeypatch.setattr(update_module, "_is_git_repo", lambda: False)
    monkeypatch.setattr(update_module, "_detect_install_lane", lambda: None)

    runner = CliRunner()
    result = runner.invoke(cli, ["update"])

    assert result.exit_code == 1
    assert "unsupported for self-update" in result.output
    assert "curl -fsSL https://mutx.dev/install.sh | bash" in result.output
    assert "pip install mutx" not in result.output


def test_update_check_reports_source_overlay_status(monkeypatch) -> None:
    import cli.commands.update as update_module

    monkeypatch.setattr(update_module, "_is_git_repo", lambda: False)
    monkeypatch.setattr(
        update_module,
        "_detect_install_lane",
        lambda: InstallLane("source-overlay", Path("/opt/homebrew/bin/mutx")),
    )
    monkeypatch.setattr(update_module, "_brew_available", lambda: True)
    monkeypatch.setattr(update_module, "_verify_cli_surface", lambda binary=None: (True, None))
    monkeypatch.setattr(update_module, "_brew_formula_state", lambda: "installed")

    runner = CliRunner()
    result = runner.invoke(cli, ["update", "--check"])

    assert result.exit_code == 0
    assert "Install lane: source-overlay" in result.output
    assert "refresh the overlay" in result.output


def test_install_source_overlay_refreshes_and_relinks_mutx(monkeypatch, tmp_path: Path) -> None:
    source_ref = str(build_fake_cli_package(tmp_path / "source-cli"))
    brew_prefix = tmp_path / "brew-prefix"
    brew_bin = brew_prefix / "bin"
    brew_bin.mkdir(parents=True, exist_ok=True)

    write_executable(
        brew_bin / "brew",
        """#!/usr/bin/env bash
        set -euo pipefail

        prefix="${FAKE_BREW_PREFIX:?}"
        formula="${2:-mutx}"

        case "${1:-}" in
          --prefix)
            if [[ "${formula}" == "python@3.12" ]]; then
              echo "${prefix}"
              exit 0
            fi
            echo "${prefix}"
            exit 0
            ;;
          list|outdated|tap|install|upgrade|unlink|link)
            exit 0
            ;;
        esac

        exit 0
        """,
    )

    monkeypatch.setenv("MUTX_HOME_DIR", str(tmp_path / "mutx-home"))
    monkeypatch.setenv("MUTX_CLI_SOURCE_REF", source_ref)
    monkeypatch.setenv("FAKE_BREW_PREFIX", str(brew_prefix))
    monkeypatch.setenv("PATH", f"{brew_bin}:{os.environ['PATH']}")

    success, result = _install_source_overlay()

    assert success is True
    overlay_venv = Path(result)
    overlay_bin = overlay_venv / "bin" / "mutx"
    linked_bin = brew_prefix / "bin" / "mutx"

    assert overlay_bin.exists()
    assert linked_bin.is_symlink()
    assert linked_bin.resolve() == overlay_bin.resolve()
    assert _verify_cli_surface(overlay_bin) == (True, None)
