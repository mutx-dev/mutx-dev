from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_canonical_quickstart_surfaces_share_assistant_first_commands() -> None:
    readme = read_text("README.md")
    quickstart = read_text("docs/deployment/quickstart.md")
    landing = read_text("app/page.tsx")
    install_script = read_text("public/install.sh")

    for content in (readme, quickstart, landing):
        assert "curl -fsSL https://mutx.dev/install.sh | bash" in content
        assert "OpenClaw" in content

    for content in (readme, quickstart):
        assert "mutx setup hosted" in content
        assert "mutx setup local" in content
        assert "mutx doctor" in content
        assert "personal_assistant" in content or "Personal Assistant" in content

    assert "mutx setup hosted --import-openclaw" in landing
    assert "Hosted" in landing
    assert "mutx setup hosted" in install_script
    assert "mutx setup local" in install_script
    assert "mutx doctor" in install_script
    assert "mutx login" not in install_script


def test_quickstart_redirect_points_to_canonical_doc() -> None:
    quickstart_redirect = read_text("docs/quickstart.md")

    assert "Deployment Quickstart" in quickstart_redirect
    assert "./deployment/quickstart.md" in quickstart_redirect


def test_readme_uses_access_token_config_shape() -> None:
    readme = read_text("README.md")

    assert '"access_token": null' in readme
    assert '"api_key": null' not in readme
