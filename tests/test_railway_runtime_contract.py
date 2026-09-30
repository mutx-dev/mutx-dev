import json
import os
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def backend_production_command() -> list[str]:
    dockerfile = read_text("infrastructure/docker/Dockerfile.backend")
    lines = dockerfile.splitlines()
    production_start = next(
        index
        for index, line in enumerate(lines)
        if line.startswith("FROM ") and line.endswith(" AS production")
    )
    production_end = next(
        (
            index
            for index in range(production_start + 1, len(lines))
            if lines[index].startswith("FROM ")
        ),
        len(lines),
    )
    command_line = next(
        line for line in lines[production_start:production_end] if line.startswith("CMD ")
    )
    return json.loads(command_line.removeprefix("CMD "))


def test_railway_frontend_manifest_keeps_runner_target_and_standalone_start() -> None:
    manifest = read_text("railway-frontend.json")

    assert '"dockerfilePath": "infrastructure/docker/Dockerfile.frontend"' in manifest
    assert '"target": "runner"' in manifest
    assert '"startCommand": "node .next/standalone/server.js"' in manifest


def test_railway_backend_manifest_keeps_healthcheck_contract() -> None:
    manifest = read_text("railway-api.json")

    assert '"dockerfilePath": "infrastructure/docker/Dockerfile.backend"' in manifest
    assert '"healthcheckPath": "/health"' in manifest
    assert '"healthcheckTimeout": 60' in manifest


def test_active_railway_backend_uses_the_locked_image_boot_contract() -> None:
    manifest = json.loads(read_text("railway.json"))
    backend = manifest["services"]["backend"]
    dockerfile = read_text("infrastructure/docker/Dockerfile.backend")
    runtime_lock = read_text("requirements-runtime.lock")

    assert backend["build"]["dockerfilePath"] == "infrastructure/docker/Dockerfile.backend"
    assert "startCommand" not in backend.get("deploy", {})
    assert "--require-hashes" in dockerfile
    assert "--only-binary=:all:" in dockerfile
    assert "--from=builder --chown=appuser:appuser /opt/venv /opt/venv" in dockerfile
    command = backend_production_command()
    assert command[:2] == ["sh", "-c"]
    assert command[2].startswith(': "${FORWARDED_ALLOW_IPS:?')
    assert "&& alembic upgrade head && exec uvicorn src.api.main:app" in command[2]
    assert "${PORT:-8000}" in dockerfile
    assert (
        "${FORWARDED_ALLOW_IPS:?FORWARDED_ALLOW_IPS must list Railway trusted proxy CIDRs}"
        in dockerfile
    )
    assert "psycopg==3.3.4" in runtime_lock
    assert "psycopg2-binary" not in dockerfile
    assert "pip install" not in read_text("railway.json")


def test_railway_backend_preflights_proxy_setting_before_migrations() -> None:
    command = backend_production_command()

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        bin_path = temp_path / "bin"
        bin_path.mkdir()
        boot_log = temp_path / "boot.log"

        for executable in ("alembic", "uvicorn"):
            stub = bin_path / executable
            stub.write_text(
                "#!/bin/sh\n"
                f"printf '{executable}:%s\\n' \"$*\" >> \"$MUTX_BOOT_LOG\"\n",
                encoding="utf-8",
            )
            stub.chmod(0o755)

        base_env = os.environ.copy()
        base_env["PATH"] = f"{bin_path}{os.pathsep}{os.defpath}"
        base_env["MUTX_BOOT_LOG"] = str(boot_log)
        base_env["PORT"] = "8000"

        for proxy_value in (None, ""):
            env = base_env.copy()
            if proxy_value is None:
                env.pop("FORWARDED_ALLOW_IPS", None)
            else:
                env["FORWARDED_ALLOW_IPS"] = proxy_value

            result = subprocess.run(
                command,
                env=env,
                text=True,
                capture_output=True,
                check=False,
                timeout=5,
            )

            assert result.returncode != 0
            assert "FORWARDED_ALLOW_IPS" in result.stderr
            assert not boot_log.exists() or not boot_log.read_text(encoding="utf-8")

        valid_env = base_env.copy()
        valid_env["FORWARDED_ALLOW_IPS"] = "10.24.0.0/16"
        result = subprocess.run(
            command,
            env=valid_env,
            text=True,
            capture_output=True,
            check=False,
            timeout=5,
        )

        assert result.returncode == 0, result.stderr
        assert boot_log.read_text(encoding="utf-8").splitlines() == [
            "alembic:upgrade head",
            "uvicorn:src.api.main:app --host 0.0.0.0 --port 8000 --proxy-headers "
            "--forwarded-allow-ips=10.24.0.0/16",
        ]


def test_local_api_build_target_uses_the_locked_venv() -> None:
    dockerfile = read_text("infrastructure/docker/Dockerfile.api")
    compose = read_text("infrastructure/docker/docker-compose.yml")

    assert "COPY --from=builder /opt/venv /opt/venv" in dockerfile
    assert "AS development" in dockerfile
    assert "target: development" in compose
    assert "/usr/local/lib/python3.11/site-packages" not in dockerfile
    assert "--require-hashes" in dockerfile


def test_ci_builds_the_exact_railway_and_local_api_targets() -> None:
    workflow = read_text(".github/workflows/ci.yml")

    for contract in (
        "image: railway-backend\n            dockerfile: infrastructure/docker/Dockerfile.backend\n            target: production",
        "image: local-api\n            dockerfile: infrastructure/docker/Dockerfile.api\n            target: development",
        "--target '${{ matrix.target }}'",
        "-c 'import src.api.main'",
    ):
        assert contract in workflow


def test_railway_promotion_script_requires_both_frontend_and_backend_service_ids() -> None:
    script = read_text("scripts/promote-railway-production.sh")

    assert "RAILWAY_FRONTEND_SERVICE_ID" in script
    assert "RAILWAY_API_SERVICE_ID" in script
    assert 'deploy_service "${RAILWAY_FRONTEND_SERVICE_ID}" "frontend"' in script
    assert 'deploy_service "${RAILWAY_API_SERVICE_ID}" "backend"' in script
    assert 'wait_for_release_identity "API" "${API_RELEASE_IDENTITY_URL}"' in script
    assert 'wait_for_release_identity "frontend" "${FRONTEND_RELEASE_IDENTITY_URL}"' in script
    assert "src/api/mutx-release.json" in script
