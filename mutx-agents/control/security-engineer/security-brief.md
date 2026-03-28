# Security Brief

## 2026-03-28

Lead: Ansible provisioning still has a fail-open SSH path (`ADMIN_CIDR` defaults to `0.0.0.0/0`) and stale tracked inventory/docs still use `StrictHostKeyChecking=no`, while Terraform already fails closed.

Best next move: make every infra path match Terraform's fail-closed posture, then add a regression guard so the gap does not come back.
