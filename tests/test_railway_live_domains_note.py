from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_railway_docs_call_out_live_custom_domains_and_project_source_of_truth() -> None:
    railway_docs = read_text("docs/deployment/railway.md")

    assert "Live production project: `zooming-youth`" in railway_docs
    assert "frontend custom domains: `mutx.dev`, `app.mutx.dev`" in railway_docs
    assert "backend custom domain: `api.mutx.dev`" in railway_docs
    assert "Use live Railway service manifests as the source of truth before changing production deployment behavior" in railway_docs
