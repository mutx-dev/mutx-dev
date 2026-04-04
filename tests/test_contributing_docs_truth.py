from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_contributing_playwright_docs_match_local_standalone_reality() -> None:
    contributing = read_text("contributing/README.md")

    assert "npm run build" in contributing
    assert "Playwright targets the local standalone app server" in contributing
    assert "https://mutx.dev" not in contributing


def test_clone_policy_uses_current_mutx_ci_node_version() -> None:
    clone_policy = read_text("docs/clone-policy.md")

    assert "Node 24 (CI standard)" in clone_policy
    assert "Node 20 (CI standard)" not in clone_policy
