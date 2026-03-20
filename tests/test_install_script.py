from __future__ import annotations

import inspect
import os
import pty
import select
import stat
import subprocess
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INSTALL_SCRIPT = ROOT / "public" / "install.sh"


def write_executable(path: Path, content: str) -> None:
    path.write_text(f"{inspect.cleandoc(content)}\n", encoding="utf-8")
    path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def build_fake_cli_package(package_dir: Path) -> Path:
    package_dir.mkdir(parents=True, exist_ok=True)
    (package_dir / "pyproject.toml").write_text(
        inspect.cleandoc(
            """
            [build-system]
            requires = ["setuptools>=61.0", "wheel"]
            build-backend = "setuptools.build_meta"

            [project]
            name = "mutx"
            version = "9.9.9"

            [project.scripts]
            mutx = "fakecli:main"
            """
        )
        + "\n",
        encoding="utf-8",
    )
    (package_dir / "fakecli.py").write_text(
        inspect.cleandoc(
            """
            from __future__ import annotations

            import sys


            def main() -> None:
                args = sys.argv[1:]
                if not args or args == ["--help"]:
                    print("Usage: mutx [OPTIONS] COMMAND [ARGS]...")
                    print("")
                    print("Commands:")
                    print("  doctor")
                    print("  setup")
                    print("  status")
                    print("  tui")
                    return

                if args in (
                    ["setup", "--help"],
                    ["setup", "hosted", "--help"],
                    ["setup", "local", "--help"],
                    ["doctor", "--help"],
                    ["tui", "--help"],
                ):
                    return

                if args[:2] == ["setup", "hosted"]:
                    print("HOSTED SETUP", " ".join(args[2:]).strip())
                    return

                if args[:2] == ["setup", "local"]:
                    print("LOCAL SETUP", " ".join(args[2:]).strip())
                    return

                if args and args[0] == "doctor":
                    print("doctor ok")
                    return
            """
        )
        + "\n",
        encoding="utf-8",
    )
    return package_dir


def build_install_env(tmp_path: Path, *, source_ref: str | None = None) -> tuple[dict[str, str], Path]:
    brew_prefix = tmp_path / "brew-prefix"
    brew_bin = brew_prefix / "bin"
    brew_bin.mkdir(parents=True, exist_ok=True)
    (brew_prefix / "python" / "bin").mkdir(parents=True, exist_ok=True)

    write_executable(
        brew_bin / "brew",
        """#!/usr/bin/env bash
        set -euo pipefail

        prefix="${FAKE_BREW_PREFIX:?}"

        case "${1:-}" in
          --prefix)
            if [[ "${2:-}" == "python@3.12" ]]; then
              echo "${prefix}/python"
              exit 0
            fi
            echo "${prefix}"
            exit 0
            ;;
          tap|upgrade|install|link)
            exit 0
            ;;
          list)
            if [[ "${2:-}" == "--versions" ]]; then
              echo "mutx 0.2.0"
              exit 0
            fi
            ;;
        esac

        exit 0
        """,
    )

    env = os.environ.copy()
    env["FAKE_BREW_PREFIX"] = str(brew_prefix)
    env["HOME"] = str(tmp_path / "home")
    env["MUTX_HOME_DIR"] = str(tmp_path / "mutx-home")
    env["MUTX_NO_ANIMATION"] = "1"
    env["MUTX_OPEN_TUI"] = "0"
    env["HOMEBREW_NO_AUTO_UPDATE"] = "1"
    env["HOMEBREW_NO_INSTALL_FROM_API"] = "1"
    env["PATH"] = f"{brew_bin}:{env['PATH']}"
    if source_ref is not None:
      env["MUTX_CLI_SOURCE_REF"] = source_ref

    return env, brew_prefix


def run_install_script(tmp_path: Path, *, mutx_script: str, source_ref: str | None = None) -> tuple[subprocess.CompletedProcess[str], Path]:
    env, brew_prefix = build_install_env(tmp_path, source_ref=source_ref)
    write_executable(brew_prefix / "bin" / "mutx", mutx_script)

    result = subprocess.run(
        ["bash", str(INSTALL_SCRIPT)],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    return result, brew_prefix


def run_install_script_in_tty(
    tmp_path: Path,
    *,
    mutx_script: str,
    source_ref: str,
    replies: list[tuple[str, str]],
    timeout_seconds: float = 45.0,
) -> tuple[int, str, Path]:
    env, brew_prefix = build_install_env(tmp_path, source_ref=source_ref)
    env["MUTX_OPEN_TUI"] = "1"
    env["TERM"] = "xterm-256color"
    write_executable(brew_prefix / "bin" / "mutx", mutx_script)

    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(ROOT)
        os.execvpe("bash", ["bash", str(INSTALL_SCRIPT)], env)

    transcript = ""
    pending = list(replies)
    deadline = time.time() + timeout_seconds
    exit_code: int | None = None

    while True:
        if pending and pending[0][0] in transcript:
            os.write(fd, pending[0][1].encode("utf-8"))
            pending.pop(0)

        if time.time() > deadline:
            os.kill(pid, 9)
            raise TimeoutError(transcript)

        ready, _, _ = select.select([fd], [], [], 0.1)
        if fd in ready:
            try:
                chunk = os.read(fd, 4096).decode("utf-8", errors="replace")
            except OSError:
                chunk = ""
            transcript += chunk

        done_pid, status = os.waitpid(pid, os.WNOHANG)
        if done_pid == pid:
            exit_code = os.waitstatus_to_exitcode(status)
            break

    while True:
        try:
            chunk = os.read(fd, 4096).decode("utf-8", errors="replace")
        except OSError:
            break
        if not chunk:
            break
        transcript += chunk

    os.close(fd)
    assert exit_code is not None
    return exit_code, transcript, brew_prefix


STALE_MUTX_SCRIPT = """#!/usr/bin/env bash
set -euo pipefail

case "${*:-}" in
  "--help")
    cat <<'EOF'
Usage: mutx [OPTIONS] COMMAND [ARGS]...

Commands:
  login
  logout
  status
  tui
  webhooks
  whoami
EOF
    exit 0
    ;;
  "setup"|"setup --help"|"setup hosted --help"|"setup local --help")
    echo "Usage: mutx [OPTIONS] COMMAND [ARGS]..." >&2
    echo "Try 'mutx --help' for help." >&2
    echo >&2
    echo "Error: No such command 'setup'." >&2
    exit 2
    ;;
  "doctor"|"doctor --help")
    echo "Usage: mutx [OPTIONS] COMMAND [ARGS]..." >&2
    echo "Try 'mutx --help' for help." >&2
    echo >&2
    echo "Error: No such command 'doctor'." >&2
    exit 2
    ;;
esac

exit 0
"""


CURRENT_MUTX_SCRIPT = """#!/usr/bin/env bash
set -euo pipefail

case "${*:-}" in
  "--help")
    cat <<'EOF'
Usage: mutx [OPTIONS] COMMAND [ARGS]...

Commands:
  doctor
  setup
  status
  tui
EOF
    exit 0
    ;;
  "setup --help"|"setup hosted --help"|"setup local --help"|"doctor --help")
    exit 0
    ;;
esac

exit 0
"""


def test_install_script_bootstraps_current_cli_when_packaged_binary_is_stale(tmp_path: Path) -> None:
    source_ref = str(build_fake_cli_package(tmp_path / "source-cli"))
    result, brew_prefix = run_install_script(tmp_path, mutx_script=STALE_MUTX_SCRIPT, source_ref=source_ref)

    assert result.returncode == 0
    assert "Recovering current CLI surface" in result.stdout
    assert "Install complete" in result.stdout
    assert "mutx setup hosted" in result.stdout
    assert "mutx setup local" in result.stdout
    assert "mutx-dev/homebrew-tap" not in result.stdout
    assert "formula:" not in result.stdout
    assert result.stderr == ""

    setup_help = subprocess.run(
        [str(brew_prefix / "bin" / "mutx"), "setup", "--help"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert setup_help.returncode == 0


def test_install_script_allows_assistant_first_cli_surface_without_recovery(tmp_path: Path) -> None:
    result, _ = run_install_script(tmp_path, mutx_script=CURRENT_MUTX_SCRIPT)

    assert result.returncode == 0
    assert "Recovering current CLI surface" not in result.stdout
    assert "Checking onboarding surface" in result.stdout
    assert "Install complete" in result.stdout
    assert "mutx-dev/homebrew-tap" not in result.stdout
    assert result.stderr == ""


def test_install_script_tty_can_skip_hosted_and_launch_local_setup_after_recovery(tmp_path: Path) -> None:
    source_ref = str(build_fake_cli_package(tmp_path / "source-cli"))
    exit_code, transcript, brew_prefix = run_install_script_in_tty(
        tmp_path,
        mutx_script=STALE_MUTX_SCRIPT,
        source_ref=source_ref,
        replies=[
            ("Select a lane [1/2/3]", "2\n"),
        ],
    )

    assert exit_code == 0
    assert "Recovering current CLI surface" in transcript
    assert "Setup Wizard" in transcript
    assert "Select a lane [1/2/3]" in transcript
    assert "Hosted lane" in transcript
    assert "Local lane" in transcript
    assert "Launching:" in transcript
    assert "LOCAL SETUP --open-tui" in transcript
    assert "No such command 'setup'" not in transcript

    setup_help = subprocess.run(
        [str(brew_prefix / "bin" / "mutx"), "setup", "local", "--help"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert setup_help.returncode == 0
