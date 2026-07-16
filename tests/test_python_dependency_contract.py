from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_test_requirements_do_not_drift_from_runtime_core_pins() -> None:
    runtime_requirements = read_text("requirements.txt")
    test_requirements = read_text("test-requirements.txt")

    assert "fastapi==0.135.3" in runtime_requirements
    assert "fastapi>=" not in runtime_requirements
    assert "pydantic-settings==2.10.1" in runtime_requirements
    assert "-r requirements.txt" in test_requirements
    assert "passlib[bcrypt]" not in test_requirements
    assert "httpx==0.28.1" in test_requirements
    assert "aiosqlite==0.20.0" in test_requirements
    assert "sqlalchemy==2.0.25" in test_requirements


def test_requirements_compat_script_checks_test_requirements_too() -> None:
    compat_script = read_text("scripts/check_requirements_compat.py")

    assert 'repo_root / "test-requirements.txt"' in compat_script
    assert "test-requirements drift detected" in compat_script


def test_langchain_runtime_stays_on_patched_03_compatibility_line() -> None:
    runtime_requirements = read_text("requirements.txt")

    expected_constraints = {
        "langchain>=0.3.30,<0.4.0",
        "langchain-core>=0.3.86,<0.4.0",
        "langchain-openai>=0.3.35,<0.4.0",
        "langchain-anthropic>=0.3.22,<0.4.0",
        "langchain-community>=0.3.31,<0.4.0",
        "langchain-text-splitters>=0.3.11,<0.4.0",
    }

    assert expected_constraints.issubset(set(runtime_requirements.splitlines()))


def test_langchain_sdk_extra_is_capped_below_v1() -> None:
    sdk_project = read_text("sdk/pyproject.toml")

    assert '"langchain>=0.3.30,<1.0.0"' in sdk_project
    assert '"langchain-core>=0.3.86,<1.0.0"' in sdk_project
    assert '"langchain-openai>=0.3.35,<1.0.0"' in sdk_project


def test_uv_lock_covers_the_langchain_03_compatibility_line() -> None:
    lockfile = read_text("uv.lock")

    expected_versions = {
        'name = "langchain"\nversion = "0.3.30"',
        'name = "langchain-core"\nversion = "0.3.86"',
        'name = "langchain-openai"\nversion = "0.3.35"',
        'name = "langchain-anthropic"\nversion = "0.3.22"',
        'name = "langchain-community"\nversion = "0.3.31"',
        'name = "langchain-text-splitters"\nversion = "0.3.11"',
    }

    for locked_package in expected_versions:
        assert locked_package in lockfile
