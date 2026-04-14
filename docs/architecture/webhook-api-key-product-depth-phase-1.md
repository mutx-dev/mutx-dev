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

That means phase 1 should add truthful summary and status structure in the dashboard, not a new backend abstraction. The goal is to make the current lifecycle data easier to understand and compare, then leave deeper unification for later phases.

## Parity Contract

- API keys:
  - `active` means the key is still marked active and has not passed `expires_at`.
  - `revoked` means `is_active` is false.
  - `expired` means the key is still visible for audit, but `expires_at` is already in the past.
  - `expires soon` is a warning layer on top of an otherwise active key, based on the live `expires_at` timestamp.
  - `last used` comes from `last_used` or `last_used_at`; missing data stays `never` instead of being guessed.
- Webhooks:
  - Route state stays `active` or `inactive` from `is_active`.
  - Delivery health comes from the latest recorded delivery attempt, not an invented aggregate score.
  - `healthy` means the latest delivery succeeded.
  - `failing` means the latest delivery failed and should surface its real status code and retry count.
  - `no deliveries` means the route exists but the current history lane has no delivery attempts yet.
- CLI and dashboard:
  - The dashboard may summarize these states visually, but the CLI should expose the same underlying labels where possible.
  - No new backend fields are introduced for phase 1; the parity story is built from current live endpoints only.

## File-Level Map

- `components/dashboard/ApiKeysPageClient.tsx`
  - keep the existing lifecycle actions
  - surface compact key-risk summary signals that operators can scan quickly
- `components/webhooks/WebhooksPageClient.tsx`
  - keep CRUD and delivery history
  - add a matching summary treatment so webhook state reads like an operator surface, not just a form
- `src/api/routes/api_keys.py`
  - remain the source of truth for API-key lifecycle and one-time secret issuance
- `src/api/routes/webhooks.py`
  - remain the source of truth for webhook lifecycle, delivery inspection, and test dispatch
- `cli/commands/api_keys.py`
  - keep command names and response handling aligned with the backend contract
- `cli/commands/webhooks.py`
  - keep list/get/deliveries commands aligned with the backend contract

## Phased Build Sequence

1. Phase 1: add the smallest truthful dashboard summary layer for keys and webhooks, using existing API payloads only.
2. Phase 2: tighten naming, status labels, and empty states so the two surfaces read consistently across dashboard and CLI.
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
  - local frontend build or targeted tests only if code changes land later
