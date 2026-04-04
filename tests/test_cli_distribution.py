from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_installed_cli_entrypoint_exposes_setup_commands_without_repo_on_sys_path(
    tmp_path: Path,
) -> None:
    venv_dir = tmp_path / "venv"
    subprocess.run(
        [sys.executable, "-m", "venv", "--system-site-packages", str(venv_dir)],
        check=True,
        cwd=ROOT,
    )

    pip_bin = venv_dir / "bin" / "pip"
    python_bin = venv_dir / "bin" / "python"
    mutx_bin = venv_dir / "bin" / "mutx"

    subprocess.run(
        [str(pip_bin), "install", "setuptools", "wheel"],
        check=True,
        capture_output=True,
        text=True,
    )

    subprocess.run(
        [str(pip_bin), "install", "--no-deps", "--no-build-isolation", str(ROOT)],
        check=True,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    metadata_name = subprocess.run(
        [
            str(python_bin),
            "-c",
            "import importlib.metadata as m; print(m.distribution('mutx-cli').metadata['Name'])",
        ],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    result = subprocess.run(
        [str(mutx_bin), "setup", "--help"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert metadata_name.returncode == 0
    assert metadata_name.stdout.strip() == "mutx-cli"
    assert result.returncode == 0
    assert "Guided assistant-first onboarding." in result.stdout
