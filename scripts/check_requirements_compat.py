#!/usr/bin/env python3
"""Fail fast on known incompatible pinned dependency combinations."""

from __future__ import annotations

from pathlib import Path
import re
import sys


PIN_PATTERN = re.compile(r"^\s*([A-Za-z0-9_.-]+)==([0-9][A-Za-z0-9_.-]*)\s*$")


def parse_pinned_versions(requirements_path: Path) -> dict[str, str]:
    versions: dict[str, str] = {}
    for raw_line in requirements_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or line.startswith("-r "):
            continue
        match = PIN_PATTERN.match(line)
        if not match:
            continue
        package, version = match.groups()
        versions[package.lower()] = version
    return versions


def version_tuple(version: str) -> tuple[int, ...]:
    parts = []
    for part in version.split("."):
        if not part.isdigit():
            break
        parts.append(int(part))
    return tuple(parts)


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    requirements_path = repo_root / "requirements.txt"
    test_requirements_path = repo_root / "test-requirements.txt"
    versions = parse_pinned_versions(requirements_path)
    test_versions = parse_pinned_versions(test_requirements_path)
    test_requirements_text = test_requirements_path.read_text(encoding="utf-8")

    if "-r requirements.txt" not in test_requirements_text:
        print(
            "ERROR: test-requirements drift detected.\n"
            "test-requirements.txt must include '-r requirements.txt' so test installs start from runtime pins."
        )
        return 1

    if "passlib[bcrypt]" in test_requirements_text:
        print(
            "ERROR: test-requirements drift detected.\n"
            "passlib[bcrypt] is legacy auth baggage and should not be present in test-requirements.txt."
        )
        return 1

    for package_name in ("httpx", "aiosqlite", "sqlalchemy"):
        runtime_version = versions.get(package_name)
        test_version = test_versions.get(package_name)
        if runtime_version and test_version and runtime_version != test_version:
            print(
                "ERROR: test-requirements drift detected.\n"
                f"{package_name} runtime pin is {runtime_version} but test pin is {test_version}.\n"
                "Keep overlapping runtime/test pins in lockstep."
            )
            return 1

    pydantic = versions.get("pydantic")
    pydantic_settings = versions.get("pydantic-settings")

    if pydantic and pydantic_settings:
        pydantic_version = version_tuple(pydantic)
        pydantic_settings_version = version_tuple(pydantic_settings)
        if pydantic_settings_version >= (2, 7, 0) and pydantic_version < (2, 7, 0):
            print(
                "ERROR: Incompatible requirements pinning detected.\n"
                f"- pydantic=={pydantic}\n"
                f"- pydantic-settings=={pydantic_settings}\n"
                "pydantic-settings>=2.7.0 requires pydantic>=2.7.0.\n"
                "Either lower pydantic-settings below 2.7.0 or upgrade pydantic in lockstep."
            )
            return 1

    print("Dependency compatibility checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
