# Repo Truth Audit — 2026-04-20

HEAD: 2068314d
Auditor: CIPHER orchestrator (glm-5.1)
Branch: main

## Route inventory

36 route files in src/api/routes/. Key prefixes mounted via /v1/*:
- /v1/agents, /v1/deployments, /v1/runs, /v1/sessions
- /v1/ingest (agent-status, deployment-events, metrics)
- /v1/audit, /v1/policies, /v1/approvals
- /v1/runtime/governance/supervised (faramesh)
- /v1/telemetry, /v1/observability, /v1/monitoring
- /v1/rag, /v1/documents, /v1/reasoning
- /v1/webhooks, /v1/api-keys, /v1/budgets
- /v1/pico, /v1/payments, /v1/leads

## Finding 1: Adapter event sink drift — CONFIRMED DRIFT

**What:** All 4 SDK adapters (langchain, crewai, autogen) post to `/v1/events`:
```
sdk/mutx/adapters/langchain.py:  self._http.post("/v1/events", json=event)  [2 calls]
sdk/mutx/adapters/crewai.py:     self._http.post("/v1/events", json=event)  [4 calls]
sdk/mutx/adapters/autogen.py:    self._http.post("/v1/events", json=event)  [4 calls]
```

**But:** No `/v1/events` route exists in src/api/routes/. The ingest router has prefix `/ingest` with endpoints for agent-status, deployment-events, and metrics only — not a generic event sink.

**Impact:** SDK adapter events are silently lost. Any user running LangChain/CrewAI/AutoGen with MUTX callbacks gets HTTP 404 on every event and the adapter silently swallows or raises depending on strict mode.

**Fix:** Implement POST /v1/ingest/events as canonical event ingestion endpoint. Optionally alias /v1/events with deprecation notice.

## Finding 2: CrewAI api_key="" — CONFIRMED DRIFT

**What:** `sdk/mutx/adapters/crewai.py` line 221 in `run_crew()`:
```python
api_key="",  # Will be replaced when actually used
```

The MutxCrewAICallbackHandler constructor requires api_key (non-optional), but run_crew passes empty string.

**Impact:** run_crew creates a callback handler with empty API key, which sends `Authorization: Bearer ` (empty) to every event POST. Server rejects with 401.

**Fix:** run_crew should accept api_key parameter with MUTX_API_KEY env fallback. Raise ValueError if neither provided.

## Finding 3: OIDC path reconciliation — CONFIRMED (partially resolved)

**What:**
- `src/api/auth/oidc.py` exists but is EMPTY (0 bytes, only .pyc cache files present)
- `src/api/services/auth.py` contains the actual OIDC implementation: SSOProvider enum, PROVIDER_OIDC_CONFIG, PROVIDER_JWKS_URLS, verify_oauth_token(), create_access_token(), verify_access_token(), Role enum, check_role()
- AGENTS.md references `src/api/auth/oidc.py` as the OIDC token validation location
- docs/architecture/oidc.md references the OIDC architecture
- docs/releases/v1.4.md and roadmap.md both claim "OIDC token validation at src/api/auth/oidc.py"

**Reality:** The actual OIDC logic lives in `src/api/services/auth.py`. The oidc.py file is an empty stub. AGENTS.md, roadmap.md, and release notes point to the wrong file.

**Fix:**
- Option A: Move OIDC logic from services/auth.py to auth/oidc.py, import from there
- Option B: Update AGENTS.md and all docs to reference src/api/services/auth.py
- Option A is cleaner (matches the docs claim), Option B is lower risk

## Finding 4: Auth/RBAC pattern sprawl — CONFIRMED DRIFT (design, not bug)

**What:** Three different auth dependency patterns coexist:

1. `src/api/dependencies.py` — get_current_user(), require_roles(), SSOTokenUser class
2. `src/api/middleware/auth.py` — get_current_user (different impl), get_current_user_or_api_key
3. `src/api/routes/ingest.py` — custom get_ingest_auth() wrapping middleware/auth

Routes pick up auth from different sources:
- /v1/audit uses dependencies.get_current_user + dependencies.require_roles
- /v1/policies uses middleware.auth.get_current_user
- /v1/approvals uses middleware.auth.get_current_user
- /v1/ingest/* uses custom get_ingest_auth
- /v1/runtime/governance/supervised uses middleware.auth.get_current_user + domain check

**Impact:** No single auth facade. New route authors must guess which pattern to follow. Role checks are inconsistent (some use require_roles, some inline checks).

**Fix:** Create one auth facade that all routes import from. Deprecate the split patterns.

## Finding 5: Audit infrastructure — CONFIRMED (functional but limited)

**What:**
- `src/api/services/audit_log.py` uses aiosqlite with local `audit.db` file
- AuditEvent model has: event_id, agent_id, session_id, span_id, event_type (enum), payload, timestamp, trace_id
- Event types: AGENT_START, LLM_CALL, TOOL_CALL, POLICY_CHECK, GUARDRAIL_TRIGGER, AGENT_END
- No: run_id, parent_span_id, actor_type, actor_id, policy_decision_id, approval_id, cost_record, redaction_status, integrity hash
- No evidence export or hash chain capability
- OTel integration exists (trace_id/span_id extraction from active span)

**Impact:** Audit captures basic events but lacks the fields needed for decision receipts, evidence export, or the full governed operations loop.

**Fix:** Extend AuditEvent to match RunEvent v1 spec. Add run_id, actor fields, policy/approval references. Add integrity hash. Keep aiosqlite for dev but add export endpoint.

## Finding 6: Policies route — CONFIRMED (functional, missing evaluation)

**What:**
- `src/api/routes/policies.py` provides CRUD for policies (list, create, get, update, delete)
- `src/api/services/policy_store.py` stores Policy objects (Pydantic models)
- No `/v1/policies/evaluate` endpoint exists
- No PolicyEvaluationContext or PolicyDecision models exist
- No integration between policies and agent actions

**Impact:** You can store policies but cannot evaluate them against actions. The loop breaks at the policy step.

**Fix:** Add policy evaluation endpoint and service. Create PolicyDecision model. Wire into ingest/event pipeline.

## Finding 7: Approvals route — CONFIRMED (functional, not wired to policy)

**What:**
- `src/api/routes/approvals.py` has list, create, approve, reject endpoints
- `src/api/services/approval.py` has ApprovalRequest, ApprovalStatus, ApprovalService
- Role-based visibility checks exist (DEVELOPER/ADMIN)
- BUT: approvals are standalone — not triggered by policy require_approval decisions
- No escalation routing or expiry mechanism visible

**Impact:** Approvals exist as manual workflow, not as policy-gated enforcement. The policy -> approval -> audit chain is broken.

**Fix:** Wire policy require_approval to automatic approval request creation. Add expiry and escalation.

## Finding 8: Dashboard — CONFIRMED (placeholder surface, no evidence loop)

**What:**
- `app/dashboard/` has deployments, sessions, observability, channels, memory, orchestration, notifications, standup pages
- Many are untracked new files (?? status) — recently built
- No dedicated run-evidence or governance timeline view
- Dashboard overview route exists at app/api/dashboard/overview/route.ts

**Impact:** Dashboard shows operational data but cannot yet show the policy -> approval -> audit chain for a single run.

**Fix:** Add narrow run-evidence panel. Keep focused — one run, full timeline.

## Summary matrix

| # | Finding | Classification | Severity | Owner lane |
|---|---------|---------------|----------|------------|
| 1 | Adapter event sink drift (POST /v1/events, no route) | Confirmed drift | Critical | Event ingestion (04) |
| 2 | CrewAI api_key="" in run_crew | Confirmed drift | High | SDK adapter (05) |
| 3 | OIDC path mismatch (oidc.py empty, logic in services/auth.py) | Confirmed drift | Medium | Auth/RBAC (10) |
| 4 | Auth/RBAC pattern sprawl (3 dependency sources) | Confirmed drift | Medium | Auth/RBAC (10) |
| 5 | Audit limited fields (no run_id, actor, policy refs, hashes) | Confirmed limited | High | Audit evidence (09) |
| 6 | Policy CRUD exists, evaluation missing | Confirmed missing | Critical | Policy engine (06) |
| 7 | Approvals standalone, not wired to policy | Confirmed missing | High | Approvals (08) |
| 8 | Dashboard no evidence loop view | Confirmed missing | Medium | Dashboard (12) |

## Existing infrastructure to build on (not broken)

- 36 route files with solid CRUD patterns
- aiosqlite audit service with OTel integration
- Policy store with CRUD
- Approval service with role-based access
- 4 SDK adapters (langchain, crewai, autogen + base)
- CLI with 23 command files including doctor.py
- Helm chart in infrastructure/
- RBAC enforcement across routes (via multiple patterns)
- Ingest router with auth (JWT + API key)
