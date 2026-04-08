from __future__ import annotations

import os
import stat
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO_VALIDATE_SCRIPT = ROOT / "scripts" / "demo-validate.sh"
DEV_COMPOSE_FILE = ROOT / "infrastructure" / "docker" / "docker-compose.yml"


def _write_executable(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")
    path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def test_demo_validate_uses_project_scoped_compose_commands(tmp_path: Path) -> None:
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    docker_log = tmp_path / "docker.log"
    node_log = tmp_path / "node.log"

    _write_executable(
        bin_dir / "docker",
        f"""#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "{docker_log}"
if [[ "${{1:-}}" == "compose" && "${{2:-}}" == "version" ]]; then
  exit 0
fi
exit 0
""",
    )
    _write_executable(
        bin_dir / "node",
        f"""#!/usr/bin/env bash
set -euo pipefail
printf '%s|%s|%s|%s\\n' "${{DEMO_SKIP_START:-}}" "${{DEMO_API_URL:-}}" "${{DEMO_PORT:-}}" "${{DEMO_HOST:-}}" >> "{node_log}"
exit 0
""",
    )

    env = os.environ.copy()
    env["PATH"] = f"{bin_dir}:{env['PATH']}"
    env["MUTX_COMPOSE_PROJECT"] = "mutx-proof"
    env["DEMO_API_URL"] = "http://127.0.0.1:8008"
    env["DEMO_PORT"] = "3010"
    env["DEMO_HOST"] = "127.0.0.1"

    result = subprocess.run(
        ["bash", str(DEMO_VALIDATE_SCRIPT)],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    docker_calls = docker_log.read_text(encoding="utf-8").splitlines()
    assert any(
        call.startswith(
            f"compose -p mutx-proof -f {ROOT / 'infrastructure' / 'docker' / 'docker-compose.yml'} down --remove-orphans"
        )
        for call in docker_calls
    )
    assert any(
        call.startswith(
            f"compose -p mutx-proof -f {ROOT / 'infrastructure' / 'docker' / 'docker-compose.yml'} up --build -d postgres redis migrate api frontend"
        )
        for call in docker_calls
    )
    assert "Using Docker project: mutx-proof" in result.stdout
    assert (
        "Stop stack later with: docker compose -p mutx-proof -f infrastructure/docker/docker-compose.yml down"
        in result.stdout
    )
    assert node_log.read_text(encoding="utf-8").strip() == "1|http://127.0.0.1:8008|3010|127.0.0.1"


def test_dev_compose_is_project_scoped_without_fixed_container_names() -> None:
    compose = DEV_COMPOSE_FILE.read_text(encoding="utf-8")

    assert "name: ${MUTX_COMPOSE_PROJECT:-mutx}" in compose
    assert "container_name:" not in compose
    assert "dev-secret-change-in-production-123456" not in compose
    assert "JWT_SECRET:" not in compose
    assert "migrate:" in compose
    assert 'condition: service_completed_successfully' in compose
    assert 'http://localhost:8000/ready' in compose


def test_demo_env_example_does_not_ship_fixed_jwt_secret() -> None:
    env_example = (ROOT / ".env.example").read_text(encoding="utf-8")

    assert "dev-secret-change-in-production-123456" not in env_example
    assert "# JWT_SECRET=" in env_example
