from __future__ import annotations

from pathlib import Path

import pytest

from scripts.generate_homebrew_formula import (
    HomebrewResource,
    dependency_resources_from_report,
    main,
    render_formula,
    validate_release_tag,
)


def test_dependency_resources_from_report_skips_root_package_and_normalizes_names() -> None:
    report = {
        "install": [
            {
                "metadata": {"name": "mutx", "version": "1.2.0"},
                "download_info": {"url": "file:///repo", "dir_info": {}},
            },
            {
                "metadata": {"name": "typing_extensions", "version": "4.15.0"},
                "download_info": {
                    "url": "https://files.example.test/typing_extensions-4.15.0.whl",
                    "archive_info": {"hashes": {"sha256": "bbb"}},
                },
            },
            {
                "metadata": {"name": "Pygments", "version": "2.19.2"},
                "download_info": {
                    "url": "https://files.example.test/pygments-2.19.2.whl",
                    "archive_info": {"hashes": {"sha256": "aaa"}},
                },
            },
        ]
    }

    resources = dependency_resources_from_report(report, project_name="mutx")

    assert resources == [
        HomebrewResource(
            name="pygments",
            url="https://files.example.test/pygments-2.19.2.whl",
            sha256="aaa",
        ),
        HomebrewResource(
            name="typing-extensions",
            url="https://files.example.test/typing_extensions-4.15.0.whl",
            sha256="bbb",
        ),
    ]


def test_validate_release_tag_rejects_version_mismatch() -> None:
    with pytest.raises(ValueError, match="release tag mismatch"):
        validate_release_tag("1.2.0", "cli-v1.2.1")


def test_render_formula_uses_tagged_source_and_non_network_smoke_checks() -> None:
    formula = render_formula(
        description='CLI "operator" shell',
        homepage="https://mutx.dev",
        source_url="https://codeload.github.com/mutx-dev/mutx-dev/tar.gz/refs/tags/cli-v1.2.0",
        source_sha256="deadbeef",
        license_name="MIT",
        version="1.2.0",
        python_formula="python@3.12",
        resources=[
            HomebrewResource(
                name="click",
                url="https://files.example.test/click-8.3.1.whl",
                sha256="abc123",
            )
        ],
    )

    assert 'url "https://codeload.github.com/mutx-dev/mutx-dev/tar.gz/refs/tags/cli-v1.2.0"' in formula
    assert 'version "1.2.0"' in formula
    assert 'resource "click" do' in formula
    assert 'assert_match "Usage: mutx onboard [OPTIONS]"' in formula
    assert 'assert_match "--install-openclaw"' in formula
    assert 'assert_match "inspect"' in formula
    assert 'system libexec/"bin/python", "-c", "import click, httpx, textual"' in formula


def test_main_writes_formula_with_resolved_resources(monkeypatch, tmp_path: Path) -> None:
    repo_root = tmp_path / "repo"
    repo_root.mkdir()
    (repo_root / "pyproject.toml").write_text(
        """
[project]
name = "mutx"
version = "1.2.0"
description = "CLI for mutx.dev"
license = { text = "MIT" }
""".strip()
        + "\n",
        encoding="utf-8",
    )

    output_path = tmp_path / "Formula" / "mutx.rb"

    monkeypatch.setattr(
        "scripts.generate_homebrew_formula.resolve_dependency_resources",
        lambda **_: [
            HomebrewResource(
                name="click",
                url="https://files.example.test/click-8.3.1.whl",
                sha256="abc123",
            )
        ],
    )
    monkeypatch.setattr(
        "scripts.generate_homebrew_formula.sha256_for_url",
        lambda url: "feedface",
    )

    exit_code = main(
        [
            "--repo-root",
            str(repo_root),
            "--tag",
            "cli-v1.2.0",
            "--output",
            str(output_path),
        ]
    )

    assert exit_code == 0
    formula = output_path.read_text(encoding="utf-8")
    assert 'desc "CLI for mutx.dev"' in formula
    assert 'sha256 "feedface"' in formula
    assert 'resource "click" do' in formula
