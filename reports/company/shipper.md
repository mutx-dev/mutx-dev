# MUTX Shipper Log

## 2026-03-19 08:39 Europe/Rome
- Ran from `/Users/fortune/.openclaw/workspace/.worktrees/ship` and checked the live open PR queue in `mutx-dev/mutx-dev`.
- Result: **0 merges landed this run**. There are currently **no PRs that are simultaneously green, conflict-free, non-draft, and policy-safe**.
- Exact blockers on the live queue:
  - `#1183` `feat(cli,sdk): expand operator contract parity` — newest active landing candidate, but GitHub reports `BLOCKED`; both `Validation` jobs failed and both `Coverage Check` jobs failed on the fresh 07:21Z rerun.
  - `#1173` — still `DRAFT` and `UNSTABLE`; failing `Validation`, `Coverage Check`, `Docker Validation`, `Ansible`, `Dockerfile Lint`, `Docker Compose`, `Terraform Validation`, and `Monitoring Config Validation`.
  - `#1153` — `BLOCKED`; failing `Validation` and `Coverage Check` on the latest run, plus this lane is already known from fleet state to still need manual conflict healing in `src/runtime/adapters/anthropic.py` and `tests/api/test_deployments.py`.
  - `#1147` — labeled `needs-improvement` and `UNSTABLE`; failing `Validation`, `Coverage Check`, `Docker Validation`, `Ansible`, `Dockerfile Lint`, `Docker Compose`, `Terraform Validation`, and `Monitoring Config Validation`.
  - `#1144` — `BLOCKED`; old healer rebase removed raw conflicts, but CI is still red (`Validation`, `Docker Validation`, `Ansible`, `Dockerfile Lint`, `Docker Compose`, `Terraform Validation`, `Monitoring Config Validation`).
  - `#1133` — `BLOCKED`; still red on `Validation`, `Database Migration Check`, `Ansible`, `Dockerfile Lint`, `Docker Compose`, `Terraform Validation`, and `Monitoring Config Validation`.
  - `#1013` — `DRAFT`; CodeQL is green, but draft PRs are not merge targets.
  - `#1011` — `DRAFT`; CodeQL is green, but draft PRs are not merge targets.
- Net: ship lane remains blocked by red CI, blocked merge state, and draft/policy gates. Nothing honest to merge yet.
