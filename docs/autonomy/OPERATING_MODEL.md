# Autonomous Shipping Operating Model

This is the lightweight GitHub-native harness for autonomous 24/7 development.

## Goal

Ship a high volume of small, reviewed, testable changes every day without giving unattended agents direct production power.

## Principles

- optimize for trustworthy throughput, not chaotic output
- keep changes small and file ownership clear
- require review by a different agent than the author
- stage before production for anything that changes contracts, auth, runtime, or infrastructure
- enforce patch and changed-file guardrails so one autonomous pass stays small

## Lanes

### Lane A: Safe Auto-Merge
- docs
- test repairs
- small CLI and SDK parity fixes
- small frontend proxy or type alignment

Requirements:
- one reviewer agent
- required CI green
- labels `autonomy:safe` and `size:xs` or `size:s`

### Lane B: Staging-First Product Work
- backend route changes
- dashboard features
- observability improvements

Requirements:
- one reviewer agent
- required CI green
- staging deploy success

### Lane C: Human-Gated Risk
- auth/session changes
- runtime protocol changes
- infrastructure changes
- database migrations

Requirements:
- human approval
- targeted verification evidence

## Control Loop

1. Scheduled workflow runs every 15 minutes.
2. Orchestrator scans open issues labeled `autonomy:ready`.
3. Work is assigned to a single owning agent based on area labels.
4. Authoring agent creates a branch and PR.
5. Reviewer agent checks scope, ownership, validation, and drift.
6. CI gates run.
7. Safe PRs auto-merge; risky PRs stop for human approval.

## Required Labels

- area labels: `area:api`, `area:web`, `area:auth`, `area:cli-sdk`, `area:runtime`, `area:test`, `area:infra`, `area:ops`, `area:docs`
- risk labels: `risk:low`, `risk:medium`, `risk:high`
- autonomy labels: `autonomy:ready`, `autonomy:safe`, `autonomy:blocked`, `autonomy:claimed`
- size labels: `size:xs`, `size:s`, `size:m`, `size:l`

## Recommended Protections

- branch protection on `main`
- require PRs for all changes
- require at least one approval
- require CI
- enable auto-merge only after labels and checks pass
- block force-pushes to protected branches

## What Not To Automate Yet

- direct production infra changes
- auth-breaking changes
- broad schema migrations
- destructive data operations
- unreviewed runtime protocol changes

## First Four Agents To Activate

1. `mission-control-orchestrator`
2. `qa-reliability-engineer`
3. `cli-sdk-contract-keeper`
4. `control-plane-steward`

These four reduce drift and improve validation enough to safely expand the team.
