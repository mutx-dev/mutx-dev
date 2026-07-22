from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_scheduled_terraform_drift_is_explicitly_opt_in() -> None:
    workflow = read_text(".github/workflows/infrastructure-drift.yml")

    assert "schedule:" in workflow
    assert "workflow_dispatch:" in workflow
    assert "vars.ENABLE_TERRAFORM_DRIFT == 'true'" in workflow
    assert "github.event_name == 'workflow_dispatch'" in workflow
    assert "needs: readiness" in workflow
    assert "Scheduled Terraform drift is disabled" in workflow


def test_manual_drift_remains_fail_closed_before_terraform_setup() -> None:
    workflow = read_text(".github/workflows/infrastructure-drift.yml")

    validation = workflow.index("- name: Validate required secrets")
    setup = workflow.index("- name: Set up Terraform")
    init = workflow.index("- name: Terraform init (remote backend)")
    plan = workflow.index("- name: Terraform plan (drift check)")

    assert validation < setup < init < plan
    assert "exit 1" in workflow[validation:setup]
    for secret in (
        "secrets.DO_TOKEN",
        "secrets.TF_STATE_ACCESS_KEY_ID",
        "secrets.TF_STATE_SECRET_ACCESS_KEY",
    ):
        assert secret in workflow


def test_infrastructure_docs_describe_current_and_alternate_deployments() -> None:
    for path in ("infrastructure/README.md", "docs/infrastructure.md"):
        docs = read_text(path)
        assert "Railway is the current production deployment path" in docs
        assert "ENABLE_TERRAFORM_DRIFT" in docs
        assert "dispatch remains fail-closed" in docs
        assert "repository or organization Actions secrets" in docs
        assert "environment-scoped secrets are not" in docs
