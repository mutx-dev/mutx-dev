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


def test_langchain_runtime_uses_current_v1_ecosystem() -> None:
    runtime_requirements = read_text("requirements.txt")

    expected_constraints = {
        "langchain>=1.3.13,<2.0.0",
        "langchain-core>=1.4.9,<2.0.0",
        "langgraph>=1.2.9,<1.3.0",
        "langchain-openai>=1.3.5,<2.0.0",
        "langchain-anthropic>=1.4.8,<2.0.0",
        "langchain-text-splitters>=1.1.2,<2.0.0",
        "langchain-ollama>=1.1.0,<2.0.0",
        "langchain-huggingface>=1.2.2,<2.0.0",
    }

    assert expected_constraints.issubset(set(runtime_requirements.splitlines()))
    assert "langchain-community" not in runtime_requirements


def test_langchain_sdk_extra_requires_v1_and_python_310() -> None:
    sdk_project = read_text("sdk/pyproject.toml")

    assert 'requires-python = ">=3.10"' in sdk_project
    assert '"langchain>=1.3.13,<2.0.0"' in sdk_project
    assert '"langchain-core>=1.4.9,<2.0.0"' in sdk_project
    assert '"langgraph>=1.2.9,<1.3.0"' in sdk_project
    assert '"langchain-openai>=1.3.5,<2.0.0"' in sdk_project


def test_uv_lock_covers_langchain_v1_without_classic_compatibility_packages() -> None:
    lockfile = read_text("uv.lock")

    expected_versions = {
        'name = "langchain"\nversion = "1.3.13"',
        'name = "langchain-core"\nversion = "1.4.9"',
        'name = "langgraph"\nversion = "1.2.9"',
        'name = "langchain-openai"\nversion = "1.3.5"',
        'name = "langchain-anthropic"\nversion = "1.4.8"',
        'name = "langchain-text-splitters"\nversion = "1.1.2"',
        'name = "langchain-ollama"\nversion = "1.1.0"',
        'name = "langchain-huggingface"\nversion = "1.2.2"',
    }

    for locked_package in expected_versions:
        assert locked_package in lockfile

    assert 'name = "langchain-classic"' not in lockfile
    assert 'name = "langchain-community"' not in lockfile
