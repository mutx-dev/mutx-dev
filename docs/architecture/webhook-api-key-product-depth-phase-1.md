# Webhook And API-Key Product Depth, Phase 1

Issue: `#3592`

## Current State

- `components/dashboard/ApiKeysPageClient.tsx` already owns key create, rotate, revoke, one-time secret reveal, and simple health cues like active, recently used, and expiring soon.
- `components/webhooks/WebhooksPageClient.tsx` already owns webhook CRUD, test delivery, delivery history, search, and basic active/inactive presentation.
- `src/api/routes/api_keys.py` exposes the backend lifecycle contract for list, get, create, revoke, and rotate, with quota enforcement and one-time secret return.
- `src/api/routes/webhooks.py` exposes webhook create, list, get, patch, delete, test, and delivery history, with auth, URL validation, and delivery log access control.
- `cli/commands/api_keys.py` and `cli/commands/webhooks.py` mirror the same operational actions from the terminal, but they still present the two resources as separate operator paths.

## Architecture Decision

Make the dashboard the shared operator summary layer for webhook and API-key depth, while keeping the API and CLI as thin contract clients underneath it.

That means phase 1 should add truthful summary and status structure in the dashboard and CLI, not a new backend abstraction. The goal is to make the current lifecycle data easier to understand and compare, then leave deeper unification for later phases.

## Shared Status Vocabulary

- API keys keep a lifecycle state of `active`, `expired`, or `revoked`.
- Active API keys also expose a readiness cue of `ready`, `expires soon`, `unused`, or `stale`.
- Webhooks keep a lifecycle state of `active` or `inactive`.
- Active webhooks also expose a delivery cue of `healthy`, `recovering`, `failing`, `stale`, or `not exercised`.
- Dashboard and CLI compute those cues from existing list and delivery-history payloads only. No backend contract expansion is required for this phase.

## File-Level Map

- `components/dashboard/ApiKeysPageClient.tsx`
  - keep the existing lifecycle actions
  - surface compact key-risk summary signals that operators can scan quickly
  - use the shared lifecycle and readiness labels above
- `components/webhooks/WebhooksPageClient.tsx`
  - keep CRUD and delivery history
  - add a matching summary treatment so webhook state reads like an operator surface, not just a form
  - use recent delivery-history samples to compute truthful health cues
- `src/api/routes/api_keys.py`
  - remain the source of truth for API-key lifecycle and one-time secret issuance
- `src/api/routes/webhooks.py`
  - remain the source of truth for webhook lifecycle, delivery inspection, and test dispatch
- `cli/commands/api_keys.py`
  - keep command names and response handling aligned with the backend contract
  - render the same lifecycle/readiness labels as the dashboard
- `cli/commands/webhooks.py`
  - keep list/get/deliveries commands aligned with the backend contract
  - render the same lifecycle/delivery labels as the dashboard and expose the test action

## Phased Build Sequence

1. Phase 1: add the smallest truthful dashboard and CLI summary layer for keys and webhooks, using existing API payloads only.
2. Phase 2: decide whether create, update, delete, and test actions need more CLI parity or whether the current dashboard-first split is enough.
3. Phase 3: decide whether any backend aggregation endpoint is justified, but only after the UI proves a shared summary actually helps.

## Risks

- There is already some overlap between dashboard, API, CLI, and SDK behavior, so this lane should avoid introducing a second source of truth.
- Webhook and API-key payloads are not fully normalized for the same kinds of status signals, so summary copy must stay conservative.
- The dashboard pages are already functional; the main risk is adding polish without improving operator clarity.

## Validation

- Confirm the current state directly in:
  - `components/dashboard/ApiKeysPageClient.tsx`
  - `components/webhooks/WebhooksPageClient.tsx`
  - `src/api/routes/api_keys.py`
  - `src/api/routes/webhooks.py`
  - `cli/commands/api_keys.py`
  - `cli/commands/webhooks.py`
- Keep future validation lightweight for phase 1:
  - `sed` or `rg` for contract drift
  - targeted Jest tests for the shared readiness helpers
  - targeted CLI contract tests for status output and webhook test dispatch
  - local frontend build after dashboard changes land
