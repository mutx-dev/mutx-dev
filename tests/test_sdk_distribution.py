from __future__ import annotations

import subprocess
import sys
from pathlib import Path
import tomllib


ROOT = Path(__file__).resolve().parents[1]
SDK_ROOT = ROOT / "sdk"


def test_cli_and_sdk_distributions_do_not_share_the_same_project_name() -> None:
    root_name = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"][
        "name"
    ]
    sdk_name = tomllib.loads((SDK_ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"][
        "name"
    ]

    assert root_name != sdk_name
    assert root_name == "mutx-cli"
    assert sdk_name == "mutx"


def test_sdk_installs_as_mutx_distribution_and_exports_mutx_client(tmp_path: Path) -> None:
    venv_dir = tmp_path / "venv"
    subprocess.run(
        [sys.executable, "-m", "venv", "--system-site-packages", str(venv_dir)],
        check=True,
        cwd=ROOT,
    )

    pip_bin = venv_dir / "bin" / "pip"
    python_bin = venv_dir / "bin" / "python"

    subprocess.run(
        [str(pip_bin), "install", "hatchling"],
        check=True,
        capture_output=True,
        text=True,
    )

    subprocess.run(
        [str(pip_bin), "install", "--no-deps", "--no-build-isolation", str(SDK_ROOT)],
        check=True,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    result = subprocess.run(
        [
            str(python_bin),
            "-c",
            (
                "import importlib.metadata as m; "
                "from mutx import MutxClient; "
                "print(m.distribution('mutx').metadata['Name']); "
                "print(MutxClient.__name__)"
            ),
        ],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert result.stdout.splitlines() == ["mutx", "MutxClient"]
