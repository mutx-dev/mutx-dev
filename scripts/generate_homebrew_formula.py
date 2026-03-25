#!/usr/bin/env python3
"""Generate the MUTX Homebrew formula for the published tap."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import textwrap
import tomllib
from typing import Any
from urllib.request import urlopen


DEFAULT_HOMEPAGE = "https://mutx.dev"
DEFAULT_REPOSITORY = "mutx-dev/mutx-dev"
DEFAULT_PYTHON_FORMULA = "python@3.12"
DEFAULT_OPTIONAL_EXTRAS = "tui"
FORMULA_CLASS_NAME = "Mutx"
FORMULA_TEST_IMPORTS = ("click", "httpx", "textual")


@dataclass(frozen=True)
class HomebrewResource:
    name: str
    url: str
    sha256: str


def _normalize_package_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def _escape_ruby(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _load_project_metadata(repo_root: Path) -> dict[str, Any]:
    pyproject_path = repo_root / "pyproject.toml"
    with pyproject_path.open("rb") as handle:
        data = tomllib.load(handle)
    return data["project"]


def _extract_license(project_metadata: dict[str, Any]) -> str:
    license_value = project_metadata.get("license")
    if isinstance(license_value, str) and license_value.strip():
        return license_value.strip()
    if isinstance(license_value, dict):
        text = license_value.get("text")
        if isinstance(text, str) and text.strip():
            return text.strip()
    raise ValueError("project.license must be a string or table with a non-empty text value")


def _expected_cli_tag(version: str) -> str:
    return f"cli-v{version}"


def validate_release_tag(version: str, tag: str) -> None:
    expected_tag = _expected_cli_tag(version)
    if tag != expected_tag:
        raise ValueError(
            f"release tag mismatch: expected {expected_tag!r} for project version {version!r}, got {tag!r}"
        )


def source_archive_url(repository: str, tag: str) -> str:
    return f"https://codeload.github.com/{repository}/tar.gz/refs/tags/{tag}"


def sha256_for_url(url: str) -> str:
    digest = hashlib.sha256()
    with urlopen(url) as response:  # noqa: S310 - release automation downloads a trusted artifact URL
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _run_pip_report(repo_root: Path, optional_extras: str, python_executable: str) -> dict[str, Any]:
    requirement = f".[{optional_extras}]" if optional_extras else "."
    with tempfile.TemporaryDirectory(prefix="mutx-homebrew-formula-") as temp_dir:
        report_path = Path(temp_dir) / "pip-report.json"
        command = [
            python_executable,
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "--quiet",
            "--dry-run",
            "--ignore-installed",
            "--report",
            str(report_path),
            requirement,
        ]
        completed = subprocess.run(
            command,
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            error = completed.stderr.strip() or completed.stdout.strip() or "pip report failed"
            raise RuntimeError(error)
        return json.loads(report_path.read_text(encoding="utf-8"))


def dependency_resources_from_report(report: dict[str, Any], project_name: str) -> list[HomebrewResource]:
    project_key = _normalize_package_name(project_name)
    resources: dict[str, HomebrewResource] = {}
    for item in report.get("install", []):
        metadata = item.get("metadata") or {}
        name = metadata.get("name")
        if not isinstance(name, str) or not name.strip():
            continue
        normalized_name = _normalize_package_name(name)
        if normalized_name == project_key:
            continue

        download_info = item.get("download_info") or {}
        url = download_info.get("url")
        archive_info = download_info.get("archive_info") or {}
        hashes = archive_info.get("hashes") or {}
        sha256 = hashes.get("sha256")
        if not isinstance(url, str) or not url.strip() or not isinstance(sha256, str) or not sha256.strip():
            raise ValueError(f"missing download url or sha256 for dependency {name!r}")

        resource = HomebrewResource(name=normalized_name, url=url, sha256=sha256)
        existing = resources.get(normalized_name)
        if existing and existing != resource:
            raise ValueError(f"conflicting resource entries generated for {normalized_name!r}")
        resources[normalized_name] = resource

    return sorted(resources.values(), key=lambda item: item.name)


def resolve_dependency_resources(
    repo_root: Path,
    project_name: str,
    optional_extras: str,
    python_executable: str,
) -> list[HomebrewResource]:
    report = _run_pip_report(repo_root, optional_extras, python_executable)
    return dependency_resources_from_report(report, project_name)


def render_formula(
    *,
    description: str,
    homepage: str,
    source_url: str,
    source_sha256: str,
    license_name: str,
    version: str,
    python_formula: str,
    resources: list[HomebrewResource],
) -> str:
    resource_blocks = "\n\n".join(
        textwrap.dedent(
            f"""\
              resource "{_escape_ruby(resource.name)}" do
                url "{_escape_ruby(resource.url)}"
                sha256 "{resource.sha256}"
              end"""
        )
        for resource in resources
    )
    if resource_blocks:
        resource_section = "\n".join(f"  {line}" if line else "" for line in resource_blocks.splitlines())
        resource_section = f"{resource_section}\n\n"
    else:
        resource_section = ""

    imports = ", ".join(FORMULA_TEST_IMPORTS)
    body = f"""\
class {FORMULA_CLASS_NAME} < Formula
  include Language::Python::Virtualenv

  desc "{_escape_ruby(description)}"
  homepage "{_escape_ruby(homepage)}"
  url "{_escape_ruby(source_url)}"
  sha256 "{source_sha256}"
  license "{_escape_ruby(license_name)}"
  version "{version}"

  depends_on "{python_formula}"

{resource_section}  def install
    virtualenv_install_with_resources using: "{python_formula}"
  end

  test do
    assert_match "Usage: mutx onboard [OPTIONS]", shell_output("#{{bin}}/mutx onboard --help")
    assert_match "--install-openclaw", shell_output("#{{bin}}/mutx setup hosted --help")
    assert_match "inspect", shell_output("#{{bin}}/mutx runtime --help")
    system libexec/"bin/python", "-c", "import {imports}"
  end
end
"""
    return body


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".", help="Path to the MUTX repository root")
    parser.add_argument("--repository", default=DEFAULT_REPOSITORY, help="GitHub owner/repo slug")
    parser.add_argument("--homepage", default=DEFAULT_HOMEPAGE, help="Formula homepage URL")
    parser.add_argument("--tag", help="CLI release tag (defaults to cli-v<project-version>)")
    parser.add_argument("--optional-extras", default=DEFAULT_OPTIONAL_EXTRAS, help="Extras to include")
    parser.add_argument(
        "--python-formula",
        default=DEFAULT_PYTHON_FORMULA,
        help="Homebrew Python dependency formula",
    )
    parser.add_argument(
        "--python-executable",
        default=sys.executable,
        help="Python interpreter to use for pip dependency resolution",
    )
    parser.add_argument("--source-url", help="Override the source archive URL")
    parser.add_argument("--source-sha256", help="Override the source archive SHA256")
    parser.add_argument("--output", required=True, help="Path to write the generated formula")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = Path(args.repo_root).resolve()
    output_path = Path(args.output).resolve()

    project_metadata = _load_project_metadata(repo_root)
    version = str(project_metadata["version"])
    project_name = str(project_metadata["name"])
    tag = args.tag or _expected_cli_tag(version)
    validate_release_tag(version, tag)

    resources = resolve_dependency_resources(
        repo_root=repo_root,
        project_name=project_name,
        optional_extras=args.optional_extras,
        python_executable=args.python_executable,
    )

    source_url = args.source_url or source_archive_url(args.repository, tag)
    source_sha256 = args.source_sha256 or sha256_for_url(source_url)

    formula = render_formula(
        description=str(project_metadata["description"]),
        homepage=args.homepage,
        source_url=source_url,
        source_sha256=source_sha256,
        license_name=_extract_license(project_metadata),
        version=version,
        python_formula=args.python_formula,
        resources=resources,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(formula, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
