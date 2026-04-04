from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_test_requirements_do_not_drift_from_runtime_core_pins() -> None:
    test_requirements = read_text("test-requirements.txt")

    assert "-r requirements.txt" in test_requirements
    assert "passlib[bcrypt]" not in test_requirements
    assert "httpx==0.26.0" in test_requirements
    assert "aiosqlite==0.20.0" in test_requirements
    assert "sqlalchemy==2.0.25" in test_requirements


def test_requirements_compat_script_checks_test_requirements_too() -> None:
    compat_script = read_text("scripts/check_requirements_compat.py")

    assert 'repo_root / "test-requirements.txt"' in compat_script
    assert "test-requirements drift detected" in compat_script
