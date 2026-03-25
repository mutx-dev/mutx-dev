"""
mutx update command - Update MUTX to the latest version.

Supports both developer git checkouts and the installer-managed
Homebrew/source-overlay lane used by the public install script.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import click


MUTX_INSTALL_DIR = Path(__file__).parent.parent.parent
MUTX_REPO_DIR = Path(__file__).parent.parent.parent
DEFAULT_SOURCE_REF = "https://github.com/mutx-dev/mutx-dev/archive/refs/heads/main.tar.gz"


@dataclass(frozen=True)
class InstallLane:
    kind: str
    current_bin: Path | None = None


def _mutx_home_dir() -> Path:
    return Path(os.getenv("MUTX_HOME_DIR") or (Path.home() / ".mutx"))


def _overlay_root() -> Path:
    return _mutx_home_dir() / "runtime" / "source-cli"


def _overlay_venv() -> Path:
    return _overlay_root() / "venv"


def _overlay_bin() -> Path:
    return _overlay_venv() / "bin" / "mutx"


def _formula_name() -> str:
    return os.getenv("MUTX_FORMULA") or "mutx"


def _tap_name() -> str:
    return os.getenv("MUTX_TAP") or "mutx-dev/homebrew-tap"


def _source_ref() -> str:
    return os.getenv("MUTX_CLI_SOURCE_REF") or DEFAULT_SOURCE_REF


def _path_is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def _run_command(
    command: list[str],
    *,
    cwd: Path | None = None,
    timeout: int = 30,
    capture_output: bool = True,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        capture_output=capture_output,
        text=True,
        timeout=timeout,
        check=False,
    )


def _get_current_version() -> str | None:
    try:
        result = _run_command(["mutx", "--version"], timeout=10)
    except Exception:
        return None
    if result.returncode == 0:
        return result.stdout.strip() or None
    return None


def _get_git_version() -> str | None:
    try:
        result = _run_command(
            ["git", "describe", "--tags", "--always"],
            cwd=MUTX_REPO_DIR,
            timeout=10,
        )
    except Exception:
        return None
    if result.returncode == 0:
        return result.stdout.strip() or None
    return None


def _get_git_branch() -> str | None:
    try:
        result = _run_command(
            ["git", "branch", "--show-current"],
            cwd=MUTX_REPO_DIR,
            timeout=10,
        )
    except Exception:
        return None
    if result.returncode == 0:
        return result.stdout.strip() or None
    return None


def _is_git_repo() -> bool:
    return (MUTX_REPO_DIR / ".git").exists()


def _has_upstream() -> bool:
    for remote in ("upstream", "origin"):
        try:
            result = _run_command(
                ["git", "remote", "get-url", remote],
                cwd=MUTX_REPO_DIR,
                timeout=5,
            )
        except Exception:
            continue
        if result.returncode == 0:
            return True
    return False


def _brew_available() -> bool:
    return shutil.which("brew") is not None


def _brew_prefix(formula: str | None = None) -> Path | None:
    if not _brew_available():
        return None
    command = ["brew", "--prefix"]
    if formula:
        command.append(formula)
    try:
        result = _run_command(command, timeout=30)
    except Exception:
        return None
    if result.returncode != 0:
        return None
    value = result.stdout.strip()
    return Path(value) if value else None


def _brew_formula_state() -> str:
    if not _brew_available():
        return "unavailable"
    try:
        result = _run_command(
            ["brew", "list", "--versions", _formula_name()],
            timeout=30,
        )
    except Exception:
        return "unavailable"
    if result.returncode != 0:
        return "not-installed"

    try:
        outdated = _run_command(
            ["brew", "outdated", "--quiet", _formula_name()],
            timeout=30,
        )
    except Exception:
        return "installed"
    if outdated.returncode == 0 and outdated.stdout.strip():
        return "outdated"
    return "installed"


def _resolve_mutx_bin() -> Path | None:
    candidate = shutil.which("mutx")
    if candidate:
        candidate_path = Path(candidate)
        if candidate_path.is_symlink():
            try:
                resolved = candidate_path.resolve()
            except OSError:
                resolved = None
            if resolved is not None and resolved.exists() and os.access(resolved, os.X_OK):
                return candidate_path
        elif candidate_path.exists() and os.access(candidate_path, os.X_OK):
            return candidate_path

    candidates = [
        Path("/opt/homebrew/bin/mutx"),
        Path("/usr/local/bin/mutx"),
        _overlay_bin(),
    ]
    for fallback in candidates:
        if fallback.exists() and os.access(fallback, os.X_OK):
            return fallback

    cellar = _brew_prefix(_formula_name())
    if cellar is not None:
        for fallback in (cellar / "bin" / "mutx", cellar / "libexec" / "bin" / "mutx"):
            if fallback.exists() and os.access(fallback, os.X_OK):
                return fallback
    return None


def _resolve_python_bin() -> Path | None:
    candidate = shutil.which("python3")
    if candidate:
        return Path(candidate)

    prefix = _brew_prefix("python@3.12")
    if prefix is None:
        return None

    for binary in (prefix / "bin" / "python3", prefix / "bin" / "python3.12"):
        if binary.exists() and os.access(binary, os.X_OK):
            return binary
    return None


def _verify_cli_surface(binary: Path | None = None) -> tuple[bool, str | None]:
    target = binary or _resolve_mutx_bin()
    if target is None:
        return False, "mutx command not found"

    checks = [
        ([str(target), "--help"], ("onboard", "setup", "doctor")),
        ([str(target), "setup", "--help"], ("hosted", "local")),
        (
            [str(target), "setup", "hosted", "--help"],
            ("--install-openclaw", "--import-openclaw"),
        ),
        (
            [str(target), "setup", "local", "--help"],
            ("--install-openclaw", "--import-openclaw"),
        ),
        ([str(target), "runtime", "--help"], ("inspect", "open")),
        ([str(target), "onboard", "--help"], ()),
    ]
    for command, required_tokens in checks:
        try:
            result = _run_command(command, timeout=30)
        except Exception as exc:
            return False, str(exc)
        if result.returncode != 0:
            return False, f"{' '.join(command[1:]) or '--help'} failed"
        output = result.stdout + result.stderr
        if any(token not in output for token in required_tokens):
            return False, f"{' '.join(command[1:]) or '--help'} is missing required commands"
    return True, None


def _sync_tap() -> tuple[bool, str | None]:
    if not _brew_available():
        return False, "Homebrew is required for installer-managed updates."
    try:
        result = _run_command(["brew", "tap", _tap_name()], timeout=120)
    except Exception as exc:
        return False, str(exc)
    if result.returncode == 0:
        return True, None
    error = result.stderr.strip() or result.stdout.strip() or "brew tap failed"
    return False, error


def _install_or_upgrade_formula() -> tuple[bool, str | None]:
    state = _brew_formula_state()
    if state == "unavailable":
        return False, "Homebrew is unavailable."
    if state == "installed":
        return True, None

    command = ["brew", "install", _formula_name()] if state == "not-installed" else [
        "brew",
        "upgrade",
        _formula_name(),
    ]
    try:
        result = _run_command(command, timeout=300, capture_output=True)
    except Exception as exc:
        return False, str(exc)
    if result.returncode == 0:
        return True, None
    error = result.stderr.strip() or result.stdout.strip() or "brew update failed"
    return False, error


def _relink_formula() -> tuple[bool, str | None]:
    if not _brew_available():
        return False, "Homebrew is required for relinking."
    try:
        _run_command(["brew", "unlink", _formula_name()], timeout=60)
        result = _run_command(
            ["brew", "link", "--overwrite", _formula_name()],
            timeout=120,
        )
    except Exception as exc:
        return False, str(exc)
    if result.returncode == 0:
        return True, None
    error = result.stderr.strip() or result.stdout.strip() or "brew link failed"
    return False, error


def _install_source_overlay() -> tuple[bool, str]:
    python_bin = _resolve_python_bin()
    if python_bin is None:
        return False, "python3 is required to refresh the source overlay."
    brew_prefix = _brew_prefix()
    if brew_prefix is None:
        return False, "Homebrew is required to relink the MUTX command."

    overlay_root = _overlay_root()
    overlay_root.mkdir(parents=True, exist_ok=True)
    target_venv = _overlay_venv()
    running_from_target = _path_is_relative_to(Path(sys.executable), target_venv)
    backup_venv = overlay_root / "venv.previous"

    try:
        if backup_venv.exists():
            shutil.rmtree(backup_venv, ignore_errors=True)
        if target_venv.exists():
            target_venv.rename(backup_venv)

        steps = [
            ([str(python_bin), "-m", "venv", str(target_venv)], 120),
            (
                [
                    str(target_venv / "bin" / "pip"),
                    "install",
                    "--disable-pip-version-check",
                    "--quiet",
                    "--upgrade",
                    "pip",
                    "setuptools",
                    "wheel",
                ],
                300,
            ),
            (
                [
                    str(target_venv / "bin" / "pip"),
                    "install",
                    "--disable-pip-version-check",
                    "--quiet",
                    "--upgrade",
                    _source_ref(),
                ],
                300,
            ),
            (
                [
                    str(target_venv / "bin" / "pip"),
                    "install",
                    "--disable-pip-version-check",
                    "--quiet",
                    "--upgrade",
                    "textual>=0.58.0,<2.0.0",
                ],
                300,
            ),
        ]
        for command, timeout in steps:
            result = _run_command(command, timeout=timeout)
            if result.returncode != 0:
                error = result.stderr.strip() or result.stdout.strip() or "overlay install failed"
                if target_venv.exists():
                    shutil.rmtree(target_venv, ignore_errors=True)
                if backup_venv.exists():
                    backup_venv.rename(target_venv)
                return False, error

        overlay_bin = target_venv / "bin" / "mutx"
        if not overlay_bin.exists():
            if target_venv.exists():
                shutil.rmtree(target_venv, ignore_errors=True)
            if backup_venv.exists():
                backup_venv.rename(target_venv)
            return False, "source overlay installed but mutx is still not runnable"

        bin_dir = brew_prefix / "bin"
        bin_dir.mkdir(parents=True, exist_ok=True)
        link_path = bin_dir / "mutx"
        if link_path.exists() or link_path.is_symlink():
            link_path.unlink()
        link_path.symlink_to(target_venv / "bin" / "mutx")

        if backup_venv.exists() and not running_from_target:
            shutil.rmtree(backup_venv, ignore_errors=True)
        return True, str(target_venv)
    except Exception:
        if target_venv.exists():
            shutil.rmtree(target_venv, ignore_errors=True)
        if backup_venv.exists():
            backup_venv.rename(target_venv)
        raise


def _detect_install_lane() -> InstallLane | None:
    current_bin = _resolve_mutx_bin()
    executable = Path(sys.executable)
    if _path_is_relative_to(executable, _overlay_root()):
        return InstallLane("source-overlay", current_bin)
    if current_bin is not None:
        try:
            resolved_bin = current_bin.resolve()
        except OSError:
            resolved_bin = current_bin
        if _path_is_relative_to(resolved_bin, _overlay_root()):
            return InstallLane("source-overlay", current_bin)
        if str(resolved_bin).startswith(("/opt/homebrew/", "/usr/local/")):
            return InstallLane("homebrew", current_bin)
    if _overlay_bin().exists():
        return InstallLane("source-overlay", current_bin)
    if _brew_formula_state() in {"installed", "outdated", "not-installed"}:
        return InstallLane("homebrew", current_bin)
    return None


def _run_git_update(check: bool, force: bool, pip_args: str | None) -> None:
    if not _has_upstream():
        click.echo("Error: No git remote configured. Cannot update.", err=True)
        sys.exit(1)

    click.echo("Checking for updates...")

    current_branch = _get_git_branch() or "main"
    git_version = _get_git_version()

    try:
        fetch_result = _run_command(
            ["git", "fetch", "--all", "--tags"],
            cwd=MUTX_REPO_DIR,
            timeout=30,
        )
        if fetch_result.returncode != 0:
            click.echo(f"Warning: git fetch failed: {fetch_result.stderr.strip()}", err=True)
    except subprocess.TimeoutExpired:
        click.echo("Warning: git fetch timed out", err=True)
    except Exception as exc:
        click.echo(f"Warning: git fetch error: {exc}", err=True)

    if current_branch != "main":
        try:
            _run_command(
                ["git", "fetch", "origin", current_branch],
                cwd=MUTX_REPO_DIR,
                timeout=30,
            )
        except Exception:
            pass

    status_result = _run_command(
        ["git", "status", "--porcelain"],
        cwd=MUTX_REPO_DIR,
        timeout=10,
    )
    has_local_changes = bool(status_result.stdout.strip())

    try:
        diff_result = _run_command(
            ["git", "diff", "@{u}..HEAD"],
            cwd=MUTX_REPO_DIR,
            timeout=10,
        )
        commits_behind = len(
            [line for line in diff_result.stdout.splitlines() if line.startswith("-")]
        )

        log_result = _run_command(
            ["git", "log", "@{u}..HEAD", "--oneline"],
            cwd=MUTX_REPO_DIR,
            timeout=10,
        )
        commits_ahead = len(log_result.stdout.strip().splitlines()) if log_result.stdout.strip() else 0
    except Exception:
        commits_behind = 0
        commits_ahead = 0

    if check:
        click.echo(f"Current branch: {current_branch}")
        click.echo(f"Git version: {git_version or 'unknown'}")

        if has_local_changes:
            click.echo("Status: Local changes detected")
            click.echo("Run 'mutx update' without --check to update and keep local changes")
            return

        if commits_behind > 0:
            click.echo(f"Status: {commits_behind} commit(s) behind upstream")
            click.echo("Run 'mutx update' to update")
        elif commits_ahead > 0:
            click.echo(f"Status: {commits_ahead} commit(s) ahead of upstream")
            click.echo("Your local changes have not been pushed")
        else:
            click.echo("Status: Up to date")
        return

    if has_local_changes and not force:
        click.echo("Error: Local changes detected. Use --force to discard them.", err=True)
        click.echo("Or commit your changes and run 'mutx update' again.")
        sys.exit(1)

    if commits_behind == 0 and not force:
        click.echo("MUTX is already up to date!")
        return

    click.echo(f"Updating MUTX (branch: {current_branch})...")

    if commits_behind > 0:
        click.echo(f"Pulling {commits_behind} update(s)...")
        pull_result = _run_command(
            ["git", "pull", "--ff-only"],
            cwd=MUTX_REPO_DIR,
            timeout=30,
        )
        if pull_result.returncode != 0:
            click.echo(f"Error: git pull failed: {pull_result.stderr.strip()}", err=True)
            click.echo(
                "There may be merge conflicts. Resolve them and run 'mutx update' again.",
                err=True,
            )
            sys.exit(1)

    click.echo("Reinstalling MUTX...")

    install_cmd = [sys.executable, "-m", "pip", "install", "-e", "."]
    if pip_args:
        install_cmd.extend(pip_args.split())

    install_result = _run_command(
        install_cmd,
        cwd=MUTX_REPO_DIR,
        timeout=120,
    )
    if install_result.returncode != 0:
        error = install_result.stderr.strip() or install_result.stdout.strip()
        click.echo(f"Error: pip install failed: {error}", err=True)
        sys.exit(1)

    click.echo("Successfully updated MUTX!")
    new_git_version = _get_git_version()
    if new_git_version and new_git_version != git_version:
        click.echo(f"Git commit: {new_git_version}")


def _run_installer_managed_update(lane: InstallLane, *, check: bool, force: bool) -> None:
    if not _brew_available():
        click.echo("Error: Homebrew is required for installer-managed updates.", err=True)
        click.echo("Run the official installer after installing Homebrew: ", err=True)
        click.echo("  curl -fsSL https://mutx.dev/install.sh | bash", err=True)
        sys.exit(1)

    surface_ok, surface_reason = _verify_cli_surface(lane.current_bin)
    formula_state = _brew_formula_state()

    if check:
        click.echo(f"Install lane: {lane.kind}")
        if formula_state == "outdated":
            click.echo("Status: Homebrew package behind tap")
            return
        if lane.kind == "source-overlay":
            click.echo("Status: Source overlay active")
            click.echo("Run 'mutx update' to refresh the overlay from the configured source ref")
            return
        if not surface_ok:
            click.echo(f"Status: Packaged CLI surface incomplete ({surface_reason})")
            click.echo("Run 'mutx update' to refresh the fallback overlay")
            return
        click.echo("Status: Up to date")
        return

    click.echo(f"Updating MUTX ({lane.kind})...")

    tapped, tap_error = _sync_tap()
    if not tapped:
        click.echo(f"Warning: unable to sync Homebrew tap: {tap_error}", err=True)

    formula_ok = True
    install_ok, install_error = _install_or_upgrade_formula()
    if not install_ok:
        formula_ok = False
        click.echo(
            f"Warning: Homebrew package update failed; switching to source overlay ({install_error})",
            err=True,
        )

    if formula_ok:
        relinked, relink_error = _relink_formula()
        if not relinked:
            formula_ok = False
            click.echo(
                f"Warning: Homebrew relink failed; switching to source overlay ({relink_error})",
                err=True,
            )

    active_bin = _resolve_mutx_bin()
    active_surface_ok, active_surface_error = _verify_cli_surface(active_bin)
    needs_overlay_refresh = (
        lane.kind == "source-overlay" or force or not formula_ok or not active_surface_ok
    )

    if needs_overlay_refresh:
        if not active_surface_ok and active_surface_error:
            click.echo(
                f"Packaged CLI is incomplete; refreshing source overlay ({active_surface_error})"
            )
        elif lane.kind == "source-overlay":
            click.echo("Refreshing source overlay...")
        refreshed, overlay_result = _install_source_overlay()
        if not refreshed:
            click.echo(f"Error: source overlay refresh failed: {overlay_result}", err=True)
            sys.exit(1)
        active_bin = _resolve_mutx_bin()
        overlay_surface_ok, overlay_surface_error = _verify_cli_surface(active_bin)
        if not overlay_surface_ok:
            click.echo(
                f"Error: installed CLI is still incomplete after source overlay refresh: {overlay_surface_error}",
                err=True,
            )
            sys.exit(1)
        click.echo(f"Using refreshed source overlay at {overlay_result}")
    else:
        click.echo("Using packaged Homebrew CLI")

    resolved_bin = _resolve_mutx_bin()
    click.echo(f"mutx resolves to {resolved_bin or 'unknown'}")
    current_version = _get_current_version()
    if current_version:
        click.echo(f"Version: {current_version}")


@click.command(name="update")
@click.option("--check", "-c", is_flag=True, help="Check for updates without installing")
@click.option("--force", "-f", is_flag=True, help="Force refresh even if up to date")
@click.option("--pip-args", "-a", help="Additional arguments to pass to pip for git installs")
def update_command(check: bool, force: bool, pip_args: str | None) -> None:
    """
    Update MUTX.

    - Git checkouts update via git pull + editable reinstall
    - Installer-managed Homebrew/source-overlay installs refresh in place
    """
    if _is_git_repo():
        _run_git_update(check=check, force=force, pip_args=pip_args)
        return

    lane = _detect_install_lane()
    if lane is not None:
        _run_installer_managed_update(lane, check=check, force=force)
        return

    click.echo("Error: MUTX install lane is unsupported for self-update.", err=True)
    click.echo("Use the official installer:", err=True)
    click.echo("  curl -fsSL https://mutx.dev/install.sh | bash", err=True)
    click.echo("Or reinstall in a dedicated pipx/venv environment.", err=True)
    sys.exit(1)
