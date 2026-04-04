from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_repo_declares_npm_as_the_canonical_package_manager() -> None:
    package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

    assert package_json["packageManager"] == "npm@10.7.0"


def test_setup_and_frontend_docker_use_the_same_npm_install_lane() -> None:
    setup_script = read_text("scripts/setup.sh")
    frontend_dockerfile = read_text("infrastructure/docker/Dockerfile.frontend")

    assert "npm ci --legacy-peer-deps" in setup_script
    assert "RUN npm ci --legacy-peer-deps" in frontend_dockerfile
    assert "RUN npm install --force" not in frontend_dockerfile
