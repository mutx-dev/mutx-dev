from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_railway_docs_call_out_live_backend_healthcheck_drift() -> None:
    railway_docs = read_text("docs/deployment/railway.md")

    assert (
        "Live Railway production currently runs the backend without an explicit healthcheckPath/healthcheckTimeout in the deployed service manifest"
        in railway_docs
    )
    assert (
        "Do not change backend Railway healthcheck behavior casually from repo config alone"
        in railway_docs
    )


def test_railway_docs_call_out_live_backend_predeploy_contract() -> None:
    railway_docs = read_text("docs/deployment/railway.md")

    assert (
        "python -m pip install -q psycopg2-binary alembic && python -m alembic upgrade head"
        in railway_docs
    )
    assert (
        "Treat the backend preDeployCommand as production-critical until Railway and repo config are intentionally reconciled"
        in railway_docs
    )
