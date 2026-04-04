from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_release_workflow_has_sdk_release_lane() -> None:
    workflow = read_text(".github/workflows/release.yml")

    assert "- 'sdk-v*'" in workflow
    assert "release-sdk:" in workflow
    assert "if: startsWith(github.ref, 'refs/tags/sdk-v')" in workflow
    assert "working-directory: sdk" in workflow
    assert "uv run --with twine twine upload dist/*" in workflow
