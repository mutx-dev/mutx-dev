from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_release_notes_are_linked_from_repo_docs_entrypoints() -> None:
    assert "docs/releases/v1.3.md" in read_text("SUMMARY.md")
    assert "releases/v1.3.md" in read_text("docs/README.md")
    assert "./releases/v1.3.md" in read_text("docs/changelog-status.md")
    assert "docs/releases/v1.3.md" in read_text("README.md")


def test_v13_release_notes_describe_supported_and_preview_surfaces() -> None:
    release_notes = read_text("docs/releases/v1.3.md")

    assert "mutx.dev/releases" in release_notes
    assert "mutx.dev/download/macos" in release_notes
    assert "app.mutx.dev/dashboard" in release_notes
    assert "app.mutx.dev/control/*" in release_notes
    assert "Railway" in release_notes
    assert "GitHub Releases" in release_notes


def test_release_issue_template_links_use_mutx_org_repo() -> None:
    config = read_text(".github/ISSUE_TEMPLATE/config.yml")

    assert "github.com/mutx-dev/mutx-dev/blob/main/support.md" in config
    assert "github.com/mutx-dev/mutx-dev/blob/main/SECURITY.md" in config
    assert "fortunexbt" not in config


def test_release_runbook_mentions_railway_promotion_and_public_smoke() -> None:
    checklist = read_text("docs/releases/v1.3-checklist.md")
    railway_doc = read_text("docs/deployment/railway.md")

    assert "Railway production promotion" in checklist
    assert "verify-production-release.sh" in checklist
    assert "RAILWAY_FRONTEND_SERVICE_ID" in railway_doc
    assert "RAILWAY_API_SERVICE_ID" in railway_doc
