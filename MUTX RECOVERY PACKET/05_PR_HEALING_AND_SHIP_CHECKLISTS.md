# PR Healing and Ship Checklists

## Part 1 — PR healing framework

When the repo has dozens of open PRs, stop treating them as equal.

## Triage buckets

### Bucket A — Merge now
Criteria:
- directly supports recovery roadmap
- passes or is easy to fix
- no duplicate superseding PR exists

### Bucket B — Cherry-pick then close
Criteria:
- good change, bad branch state
- overlaps with a stronger PR
- faster to salvage than rebase

### Bucket C — Rebase later
Criteria:
- useful but not on critical path
- broad conflict surface
- worth preserving after UI/control-plane recovery

### Bucket D — Close now
Criteria:
- duplicate
- obsolete
- superseded
- task no longer relevant
- WIP with no strategic value

---

## Required PR board

Maintain a single markdown board:

```md
# PR Healing Board

| PR | Title | Bucket | Why | Action Owner | Status |
|---|---|---|---|---|---|
```

---

## Part 2 — UI shipping checklist

Every operator-surface PR must include:

- [ ] route/entrypoint affected
- [ ] endpoint mapping
- [ ] loading state
- [ ] error state
- [ ] empty state
- [ ] screenshot(s)
- [ ] mobile sanity check
- [ ] “harvested / original / adapted / removed” note if MC-derived
- [ ] changelog or release-note snippet

---

## Part 3 — Adapter checklist

Every adapter PR must include:

- [ ] exact backend endpoints called
- [ ] normalized output type
- [ ] no Mission Control backend assumptions leaked
- [ ] auth/session behavior documented
- [ ] fallback behavior documented
- [ ] test or smoke-proof included

---

## Part 4 — OpenClaw flow checklist

For both “new deployment” and “link existing workspace”:

- [ ] entry CTA exists
- [ ] explanatory copy exists
- [ ] backend route/integration is real
- [ ] success state is visible on dashboard
- [ ] failure state is visible and operational
- [ ] logs/health accessible after connect/create

---

## Part 5 — Release candidate checklist

Before cutting a release:

### Product truth
- [ ] homepage matches actual product
- [ ] README matches actual product
- [ ] no fake screenshots
- [ ] no dead nav items exposed without labels

### Operator journey
- [ ] login works
- [ ] first-run path works
- [ ] create or link OpenClaw works
- [ ] dashboard reads live data
- [ ] one run/trace workflow works
- [ ] API-key management works
- [ ] webhook screen is real

### Engineering
- [ ] main branch green enough
- [ ] critical PR queue resolved
- [ ] no orphaned harvested files without status
- [ ] no duplicate dashboard entrypoints left confusing the app

### Positioning
- [ ] MUTX framed as control plane, not dashboard clone
- [ ] Mission Control parity exists at the UX shell level
- [ ] MUTX differentiation is visible in deployments/runs/traces/governance

---

## Suggested first merge order

1. contract drift fixes blocking shell
2. shell/nav ingest
3. overview adapters
4. onboarding/doctor + OpenClaw entry flows
5. deployments/runs/traces surfaces
6. API-key/webhook governance surfaces
7. docs repositioning
