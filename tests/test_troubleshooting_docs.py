from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_playwright_docs_match_local_standalone_reality() -> None:
    faq = read_text("docs/troubleshooting/faq.md")
    common_issues = read_text("docs/troubleshooting/common-issues.md")
    debugging = read_text("docs/troubleshooting/debugging.md")

    assert "Playwright config starts the local standalone app server" in faq
    assert "build first when `.next/standalone` is missing" in faq
    assert "hosted MUTX surface" not in faq

    assert "missing build output for the standalone app server" in common_issues
    assert "package.json` now exposes `npm test`" in common_issues
    assert "hosted MUTX surface" not in common_issues
    assert "package.json` has no `test` script" not in common_issues

    assert (
        'npx playwright test tests/website.spec.ts -g "no console errors or remote Guild asset requests"'
        in debugging
    )
    assert "waitlist verification failure is surfaced to the user" not in debugging
