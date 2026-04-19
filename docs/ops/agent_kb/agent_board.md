# MUTX Agent Board

Last updated: 2026-04-20

## Current mission

```text
run -> trace -> policy -> approval -> audit -> export
```

## Cron fleet (active)

| Cron | Schedule | Model | Purpose |
|---|---|---|---|
| govops-daily-repo-truth | 07:03 daily | glm-5.1 | Queue health + drift scan -> Discord |
| govops-p0-executor | 09:07 + 21:07 | glm-5.1 + glm-4.7 subagents | Reads prompts, ships PRs |
| govops-nightly-validation | 02:17 nightly | glm-5.1 | Full validation matrix -> Discord |
| govops-weekly-agt-watcher | Monday 08:13 | glm-5.1 | AGT parity refresh -> Discord |

## Wave status

| Wave | Name | Status | Gate | Branch |
|---|---|---|---|---|
| 0 | Align | DONE | Audit complete, parity matrix built, 7 issues opened | govops/wave0-align |
| 1 | Freeze the spine | Ready | Event contracts, auth gates, audit design | — |
| 2 | Wire the loop | Blocked on Wave 1 | Full loop: event -> policy -> approval -> audit | — |
| 3 | Make it visible | Blocked on Wave 2 | Dashboard, CLI, docs match reality | — |
| 4 | Extend | Blocked on Wave 3 | SRE, shadow, MCP, lifecycle | — |
| 5 | Sell what is true | Blocked on Wave 4 | QA pass, GTM honest copy | — |

## Wave 0 output

Commit: 9b8f3881 on govops/wave0-align
- docs/reports/repo_truth_audit_2026-04-20.md (8 findings)
- docs/roadmaps/agt_parity.md (16-capability matrix, P0/P1/P2)

## Open issues

| Issue | Title | Priority | Owner lane |
|-------|-------|----------|------------|
| #3775 | Adapter event sink drift (POST /v1/events, no route) | P0 | Event ingestion (04) |
| #3776 | CrewAI run_crew api_key="" | P0 | SDK adapter (05) |
| #3777 | Policy evaluation engine missing | P0 | Policy engine (06) |
| #3778 | Approvals not wired to policy | P0 | Approvals (08) |
| #3779 | OIDC path mismatch (oidc.py empty) | P1 | Auth/RBAC (10) |
| #3780 | Auth/RBAC pattern sprawl (3 sources) | P1 | Auth/RBAC (10) |
| #3781 | Audit missing fields for govops | P1 | Audit evidence (09) |

## Interfaces

| Interface | Owner | Status | Endpoint/schema | Consumers |
|---|---|---|---|---|
| RunEvent v1 | Event Contracts Agent | Not started (Wave 1) | TBD | API, SDK, audit, dashboard |
| Event ingestion | Ingest API Agent | Blocked on RunEvent | POST /v1/ingest/events (target) | SDK adapters |
| Policy evaluation | Policy Engine Agent | Blocked | POST /v1/policies/evaluate (target) | Adapters, audit, dashboard |
| Approval workflow | Approvals Agent | Blocked on policy | Extend existing /v1/approvals | Dashboard, audit |
| Evidence export | Audit Evidence Agent | Blocked | GET /v1/runs/{id}/evidence (target) | Dashboard, CLI, GTM |

## Blocked claims

| Claim | Why blocked | What unblocks it |
|---|---|---|
| "Trace every run" | Adapter events go to dead endpoint | Fix event ingestion (#3775) |
| "Enforce every risky step" | Policy engine doesn't evaluate | Build policy eval (#3777) |
| "Prove every decision" | No evidence export or hash chain | Build audit export (#3781) |
| "Governed operations layer" | Loop not closed end-to-end | Close full loop (Wave 2) |
| "Framework integrations" | Adapters POST to 404 | Fix ingestion sink (#3775) |
| "Compliance-ready" | No OWASP mapping | Build risk matrix (Wave 3) |

## Next action

Wave 1 ready to start. Three parallel tracks:
1. Prompt 03: Freeze RunEvent v1 contracts
2. Prompt 10: Auth/RBAC/OIDC reconciliation
3. Prompt 09: Audit evidence design pass
