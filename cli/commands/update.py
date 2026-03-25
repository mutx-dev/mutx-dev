"""
mutx update command - Update MUTX to the latest version.

This command pulls the latest changes from git and reinstalls MUTX
without requiring a full reinstallation.
"""

import subprocess
import sys
from pathlib import Path

import click


MUTX_INSTALL_DIR = Path(__file__).parent.parent.parent
MUTX_REPO_DIR = Path(__file__).parent.parent.parent


def _get_current_version() -> str | None:
    """Get the currently installed MUTX version."""
    try:
        result = subprocess.run(
            ["mutx", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def _get_git_version() -> str | None:
    """Get the git describe version of the local repo."""
    try:
        result = subprocess.run(
            ["git", "describe", "--tags", "--always"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def _get_git_branch() -> str | None:
    """Get the current git branch."""
    try:
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def _is_git_repo() -> bool:
    """Check if MUTX is a git repository."""
    return (MUTX_REPO_DIR / ".git").exists()


def _has_upstream() -> bool:
    """Check if the git repo has an upstream remote."""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "upstream"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.returncode == 0
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.returncode == 0
    except Exception:
        pass
    return False


def _run_pip_install_editable() -> tuple[bool, str]:
    """Run pip install -e . to update the local installation."""
    try:
        python_bin = sys.executable
        result = subprocess.run(
            [python_bin, "-m", "pip", "install", "-e", ".", "--quiet"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode == 0:
            return True, "Updated successfully"
        else:
            error = result.stderr.strip() or result.stdout.strip()
            return False, f"Update failed: {error}"
    except subprocess.TimeoutExpired:
        return False, "Update timed out after 120 seconds"
    except Exception as e:
        return False, f"Update failed: {str(e)}"


@click.command(name="update")
@click.option("--check", "-c", is_flag=True, help="Check for updates without installing")
@click.option("--force", "-f", is_flag=True, help="Force reinstall even if up to date")
@click.option("--pip-args", "-a", help="Additional arguments to pass to pip")
def update_command(check: bool, force: bool, pip_args: str | None) -> None:
    """
    Update MUTX to the latest version from git.

    This command:
    1. Fetches latest changes from git
    2. Checks if updates are available
    3. Reinstalls MUTX using 'pip install -e .'

    Use 'mutx update --check' to see if updates are available
    without actually installing them.
    """
    if not _is_git_repo():
        click.echo("Error: MUTX is not installed from git. Cannot update.", err=True)
        click.echo("To update, reinstall from source:", err=True)
        click.echo("  pip install mutx", err=True)
        sys.exit(1)

    if not _has_upstream():
        click.echo("Error: No git remote configured. Cannot update.", err=True)
        sys.exit(1)

    click.echo("Checking for updates...")

    current_branch = _get_git_branch() or "main"
    git_version = _get_git_version()

    try:
        fetch_result = subprocess.run(
            ["git", "fetch", "--all", "--tags"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if fetch_result.returncode != 0:
            click.echo(f"Warning: git fetch failed: {fetch_result.stderr.strip()}", err=True)

    except subprocess.TimeoutExpired:
        click.echo("Warning: git fetch timed out", err=True)
    except Exception as e:
        click.echo(f"Warning: git fetch error: {e}", err=True)

    if current_branch != "main":
        try:
            subprocess.run(
                ["git", "fetch", "origin", current_branch],
                cwd=MUTX_REPO_DIR,
                capture_output=True,
                timeout=30,
            )
        except Exception:
            pass

    status_result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=MUTX_REPO_DIR,
        capture_output=True,
        text=True,
        timeout=10,
    )
    has_local_changes = bool(status_result.stdout.strip())

    try:
        diff_result = subprocess.run(
            ["git", "diff", "@{u}..HEAD"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=10,
        )
        commits_behind = len(
            [line for line in diff_result.stdout.splitlines() if line.startswith("-")]
        )

        log_result = subprocess.run(
            ["git", "log", "@{u}..HEAD", "--oneline"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=10,
        )
        commits_ahead = (
            len(log_result.stdout.strip().splitlines()) if log_result.stdout.strip() else 0
        )

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

        pull_result = subprocess.run(
            ["git", "pull", "--ff-only"],
            cwd=MUTX_REPO_DIR,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if pull_result.returncode != 0:
            click.echo(f"Error: git pull failed: {pull_result.stderr.strip()}", err=True)
            click.echo(
                "There may be merge conflicts. Resolve them and run 'mutx update' again.", err=True
            )
            sys.exit(1)

    click.echo("Reinstalling MUTX...")

    python_bin = sys.executable
    install_cmd = [python_bin, "-m", "pip", "install", "-e", "."]
    if pip_args:
        install_cmd.extend(pip_args.split())

    install_result = subprocess.run(
        install_cmd,
        cwd=MUTX_REPO_DIR,
        capture_output=True,
        text=True,
        timeout=120,
    )

    if install_result.returncode != 0:
        error = install_result.stderr.strip() or install_result.stdout.strip()
        click.echo(f"Error: pip install failed: {error}", err=True)
        sys.exit(1)

    new_version = _get_git_version()
    click.echo("Successfully updated MUTX!")
    click.echo(f"New version: {new_version or 'unknown'}")

    new_git_version = _get_git_version()
    if new_git_version and new_git_version != git_version:
        click.echo(f"Git commit: {new_git_version}")
