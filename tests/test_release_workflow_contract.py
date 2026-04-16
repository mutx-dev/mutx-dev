from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_cli_release_workflow_installs_or_inlines_twine_for_publish() -> None:
    release_workflow = read_text(".github/workflows/release.yml")

    assert "uv run --with twine twine upload dist/*" in release_workflow
    assert "run: twine upload dist/*" not in release_workflow


def test_railway_promotion_release_notes_path_is_version_derived() -> None:
    workflow = read_text(".github/workflows/railway-production-promotion.yml")

    assert 'release_notes_file="docs/releases/v$(echo "${version}" | cut -d. -f1-2).md"' in workflow
    assert "test -f docs/releases/v1.3.md" not in workflow


def test_container_scan_uses_the_real_frontend_dockerfile() -> None:
    workflow = read_text(".github/workflows/ci.yml")

    assert "file: infrastructure/docker/Dockerfile.frontend" in workflow
    assert "tags: mutx-frontend:latest" in workflow
    assert "scan-ref: 'mutx-frontend:latest'" in workflow
