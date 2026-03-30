# Multi-Agent Execution Plan — OpenCode / Codex / ACP / ACPX

## Goal

Once limits lift, use a small, disciplined agent fleet to execute the roadmap fast without recreating the chaos of 50 blind workers.

## Principles

- 3–6 active workers max
- each worker owns one bounded lane
- each worker writes to one deterministic output
- one coordinator agent merges the truth
- no speculative work outside assigned lane
- no worker directly edits another worker’s files

---

## Fleet layout

## 0. Coordinator (main OpenClaw agent)
**Purpose**
- own plan sequencing
- assign work
- receive outputs
- decide merge order
- block drift

**Never delegates**
- product ontology decisions
- adapter contract approval
- release/no-release calls
- main branch merge decisions

---

## 1. Cockpit Harvester
**Best model**
- Codex/OpenCode strong code model

**Owns**
- Mission Control shell ingestion
- layout/nav/panel components
- UI import ledger

**Inputs**
- Mission Control source tree
- `03_MISSION_CONTROL_HARVEST_MAP.md`

**Outputs**
- `reports/cockpit-harvest-ledger.md`
- PRs limited to shell/UI ingestion
- screenshots for each imported view

**Rules**
- no backend edits
- no data-model invention
- no renaming until mounted

---

## 2. Adapter Engineer
**Owns**
- `lib/mc-adapters/*`
- component-to-FastAPI binding
- payload normalization

**Inputs**
- MUTX route surfaces
- current dashboard/API clients
- harvested shell components

**Outputs**
- adapter contracts
- route mapping docs
- PRs that bind UI to real endpoints

**Rules**
- no visual redesign
- no backend rewrites
- no silent schema changes

---

## 3. Contract Keeper
**Owns**
- CLI/SDK/backend drift
- `/v1` mismatches
- payload/flag/doc mismatches
- contract tests

**Inputs**
- FastAPI routes
- CLI commands
- SDK methods
- docs

**Outputs**
- `reports/contract-drift.md`
- failing/green contract tests
- minimal fixes only

**Rules**
- optimize for parity, not elegance
- no new features
- update docs whenever contracts change

---

## 4. OpenClaw Integration Worker
**Owns**
- new OpenClaw deployment flow
- link existing workspace flow
- integration boundary docs
- backend/runtime linkage where already supported

**Inputs**
- runtime services
- agent/deployment routes
- onboarding shell

**Outputs**
- `reports/openclaw-entry-flows.md`
- PRs for entry path UX + integration glue

**Rules**
- OpenClaw is first-class but explicit
- no accidental product takeover by OpenClaw assumptions
- label all integration boundaries clearly

---

## 5. Healer / PR Triage Worker
**Owns**
- open PR inventory
- duplicates
- rebase order
- cherry-pick recommendations
- blocked PR queue

**Inputs**
- GitHub PR list
- branch statuses
- release priorities

**Outputs**
- `reports/pr-healing-board.md`
- close/merge/rebase plan
- one prioritized healing queue

**Rules**
- no sentimental PR preservation
- close duplicates aggressively
- focus on unblock value, not fairness

---

## 6. Docs / Positioning Worker
**Owns**
- homepage
- README
- docs landing pages
- release notes

**Inputs**
- product thesis
- actual shipped state
- current capabilities only

**Outputs**
- `reports/positioning-diff.md`
- docs PRs
- release draft

**Rules**
- no claims beyond demoable reality
- frame MUTX as control plane, not dashboard clone
- surface OpenClaw compatibility as intentional strength

---

## Suggested execution cadence

## Hour 0–2
- Coordinator refreshes roadmap
- Contract Keeper produces drift report
- Healer produces PR triage board
- Cockpit Harvester prepares ingest ledger

## Hour 2–6
- Adapter Engineer wires overview + nav
- OpenClaw Integration Worker drafts entry flows
- Docs Worker updates hero/README in parallel

## Hour 6–12
- Harvester + Adapter Engineer finish first `/app` shell pass
- Contract Keeper patches route/doc drift blocking the shell
- Healer consolidates PR queue for a merge window

## Day 2+
- deployments/runs/traces/API keys/webhooks
- onboarding/doctor
- release candidate
- demo video / screenshots

---

## ACP / ACPX usage guidance

### Use ACP/ACPX when
- you need high-volume repo edits with bounded scope
- a worker has a single clear directory/contract
- branch isolation is clean

### Avoid ACP/ACPX when
- ontology is still unclear
- multiple workers would touch the same contracts
- main branch is unstable
- the task is mostly architectural judgment

---

## Branch strategy

```text
main
├── feat/mc-shell-ingest
├── feat/mc-adapters-overview
├── feat/mc-adapters-runtime
├── feat/openclaw-entry-flows
├── fix/contract-drift-wave-1
├── chore/pr-healing-wave-1
└── docs/reposition-mutx
```

### Rules
- one branch per lane
- no worker edits shared files without lock/ownership
- coordinator only merges
- screenshots/video attached to UI PRs
- branch rebases happen in healer lane, not all workers ad hoc

---

## Mandatory artifacts each worker must produce

### Every worker writes:
- `reports/<worker-name>-status.md`

### Template
```md
# Worker Status

## Scope
## Files touched
## Decisions made
## Blockers
## Proof
## Next recommendation
```

This keeps your main OpenClaw agent from drowning in terminal noise.

---

## Anti-chaos rules

1. No more than 6 active workers
2. No subagent spawn unless model is explicitly confirmed
3. No worker starts until its output file path is known
4. No code deletion without an integration-or-removal note
5. No “done” claims without proof artifact
6. No UI-only PR without endpoint mapping
7. No backend feature work unless tied to one visible operator workflow
