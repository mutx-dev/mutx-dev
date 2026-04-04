from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_railway_api_manifest_uses_real_backend_dockerfile() -> None:
    railway_api = read_text("railway-api.json")

    assert '"dockerfilePath": "infrastructure/docker/Dockerfile.backend"' in railway_api
    assert '"dockerfilePath": "Dockerfile.backend"' not in railway_api


def test_railway_docs_reference_real_backend_dockerfile_paths() -> None:
    railway_docs = read_text("docs/deployment/railway.md")

    assert '"dockerfilePath": "infrastructure/docker/Dockerfile.backend"' in railway_docs
    assert "Create `api/Dockerfile`:" not in railway_docs
    assert '"dockerfilePath": "Dockerfile.backend"' not in railway_docs


def test_production_compose_uses_real_dockerfiles() -> None:
    compose_production = read_text("infrastructure/docker/docker-compose.production.yml")

    assert "dockerfile: infrastructure/docker/Dockerfile.api" in compose_production
    assert "dockerfile: infrastructure/docker/Dockerfile.frontend" in compose_production
    assert "dockerfile: Dockerfile.api" not in compose_production
    assert "dockerfile: Dockerfile.frontend" not in compose_production
