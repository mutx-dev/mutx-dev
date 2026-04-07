# Desenrollador (Brazil Debt Agent) Implementation Plan

> For Hermes/CIPHER: use `subagent-driven-development` to execute this plan task-by-task. MUTX is the control plane, not the debt math engine. Keep business truth outside chat memory.

**Goal:** Build a Brazil-first, chat-first debt renegotiation and refinancing agent for low-income users that explains debt in plain PT-BR, compares “stay vs switch” honestly, and moves the user to a real next action: creditor negotiation, deep link, Pix/boleto handoff, or a ready-to-send WhatsApp script.

**Architecture:** Use MUTX as the operator/control/governance shell around the agent, OpenClaw as the day-1 runtime substrate, deterministic backend services for debt math and offer ranking, and a Hermes-style follow-up layer for memory and scheduled recontact. Keep all regulated calculations, offer truth, receipts, and settlement state in deterministic services and databases, never in the model prompt.

**Tech Stack:** MUTX control plane (FastAPI + Next.js + CLI/TUI + `/v1/*` API), OpenClaw runtime, Faramesh/FPL governance, AARM-style action mediation/receipts, PostgreSQL, Redis, object storage for artifacts, Python `Decimal` for finance math, Next.js web UI, WhatsApp/web channels, signed webhooks, ingest endpoints, and warehouse-backed analytics.

---

## 0. Reality Boundary: what is verified vs what is aspirational

The builder must not overclaim the platform.

### Verified from current MUTX docs/repo

1. MUTX is an operator/control plane with:
   - FastAPI public routes under `/v1/*`
   - root probes at `/`, `/health`, `/ready`, `/metrics`
   - a Next.js app/dashboard surface
   - a Python CLI and TUI
   - a Python SDK
   - webhook management under `/v1/webhooks/*`
   - ingest routes under `/v1/ingest/*`
   - governance via Faramesh/FPL
   - runtime monitoring/heartbeats and deployment state

2. OpenClaw is the clearest first-class runtime substrate in MUTX today:
   - setup flows explicitly adopt/import OpenClaw
   - MUTX tracks OpenClaw runtime state and resyncs snapshots back to the control plane
   - the CLI/TUI/docs treat OpenClaw as the default personal assistant runtime

3. Hermes exists in the MUTX autonomy operating model as the executive/orchestrator brain, not as the canonical debt-math engine.

4. MUTX docs explicitly warn that some surfaces are partial or preview-only:
   - dashboard does not cover every backend capability
   - scheduler and RAG are not universal production truth yet
   - some docs still drift versus live routes
   - Vault is not fully real everywhere yet

### Working assumptions, not yet first-class contracts

1. PicoClaw should be treated as a future adapter target or edge runtime, not as the default debt-agent runtime.
2. Hermes memory/follow-up capabilities are a strong fit for recontact and session continuity, but the regulated financial core must remain deterministic and policy-gated.
3. Any “self-improving” capability must be forbidden from mutating formulas, CET logic, ranking rules, settlement rules, or compliance copy automatically.

---

## 1. How MUTX works in this project

Explain MUTX to the partner team like this:

### 1.1 MUTX is the control plane, not the debt calculator

MUTX is the shell that makes an agent operable like production software. It provides:
- identity and authenticated operator access
- agent/deployment/session/run control surfaces
- signed outbound webhooks
- ingest endpoints for runtime status/metrics/deployment updates
- monitoring and heartbeats
- governance hooks and approval lanes
- CLI/TUI/dashboard/operator surfaces

For Desenrollador, MUTX should own:
- deployment lifecycle
- runtime health
- control-plane telemetry
- policy enforcement and approvals
- operator visibility
- signed event delivery to downstream systems

MUTX should not own:
- debt math source of truth
- CET computation source of truth
- offer ranking source of truth
- payment settlement ledger
- creditor contract normalization
- regulated disclosures authored dynamically by the model

### 1.2 MUTX public surfaces relevant to Desenrollador

Use these surfaces as integration anchors:
- `POST /v1/webhooks/` and related webhook endpoints for outbound event delivery
- `POST /v1/ingest/agent-status` for runtime state updates
- `POST /v1/ingest/deployment` for deployment lifecycle events
- `POST /v1/ingest/metrics` for runtime metrics
- `/v1/agents`, `/v1/deployments`, `/v1/sessions`, `/v1/runs`, `/v1/monitoring` for control-plane visibility

Design rule:
- Use MUTX webhooks and ingest for runtime/control signals.
- Use the Desenrollador product database and warehouse for debt business truth.

### 1.3 Governance layer inside MUTX

MUTX integrates Faramesh as the governance engine and uses FPL policies to return `PERMIT`, `DENY`, or `DEFER` for tool calls.

For Desenrollador this is critical. It lets us enforce policies like:
- permit read-only debt intake tools during intake
- deny browser/shell tools on consumer-facing surfaces
- defer generation of payment instruments above thresholds
- defer direct negotiation execution for certain creditor classes
- cap per-session spend or payment attempts
- block any tool call that would reveal secrets or raw partner credentials

### 1.4 Observability boundary

MUTX is strongest as runtime/control observability.

Desenrollador still needs its own product event layer for:
- debt snapshots
- offer snapshots
- simulations
- recommendations
- payment artifacts
- settlements
- follow-up outcomes

Never collapse these into “agent status.” That loses domain truth.

---

## 2. Framework and harness model

This section is what Diego’s technical team needs to understand.

### 2.1 OpenClaw = runtime harness

Role in this project:
- live conversation runtime
- tool execution substrate
- channel adapter host
- browser-assisted creditor workflows where explicitly permitted
- execution environment for the conversational agent

Why it fits day 1:
- it is the most concrete runtime fit in the current MUTX stack
- MUTX setup/import/resync flows already point at OpenClaw
- it supports the mental model of “runtime beneath the control plane” cleanly

Constraints:
- keep it isolated from financial source-of-truth logic
- do not expose broad tools to end users
- pair sensitive tools to trusted/operator-approved nodes only
- do not let OpenClaw memory become the canonical ledger

### 2.2 Hermes = executive + memory/follow-up harness

Role in this project:
- orchestrator behavior
- short-term memory of abandoned simulations
- scheduled recontact after 72 hours
- session continuity across channels
- retrieval of prior simulation context before follow-up
- optional specialist delegation for internal ops and backoffice workflows

Hermes is a good fit for:
- “the user simulated three days ago and did not close”
- “re-hydrate the last valid recommendation bundle”
- “send a follow-up if the offer is still valid, otherwise resimulate first”

Hermes must not:
- change formula versions automatically
- invent creditor offers
- store sensitive debt truth as uncontrolled conversational memory
- bypass Faramesh policies

### 2.3 PicoClaw = future edge/cost harness

Treat PicoClaw as a phase-2 or phase-3 optimization path.

Possible role later:
- low-footprint satellite workers
- cost-optimized regional runtime nodes
- lightweight recontact workers
- specific narrow automation tasks with tightly bounded tools

Not day-1 scope:
- it is not the default financial runtime
- do not block v1 on PicoClaw integration

### 2.4 Faramesh/FPL = governance harness

Faramesh evaluates tool requests before execution.

Use it to define phase-aware policy:
- intake phase
- compare phase
- recommend phase
- negotiate phase
- execute/payment phase
- follow-up phase

Example policy stance for this product:
- `permit` read-only tools in intake and comparison
- `defer` negotiation execution or payment generation above threshold or when consent is weak
- `deny!` shell/browser/file-system tools on public channels
- `deny!` raw secret material to model-visible context

### 2.5 AARM-style layer = receipts/mediation harness

Use AARM ideas for:
- action mediation
- approval service
- policy engine
- tamper-evident receipts
- telemetry export

Every externally consequential action should leave a receipt:
- imported debt data
- captured offer snapshot
- computed simulation
- recommended option bundle
- generated negotiation artifact
- generated payment artifact
- settlement confirmation
- follow-up delivery

### 2.6 agent-run style schema = observability harness

Use a runtime-centric schema for:
- runs
- steps
- costs
- latency
- errors
- tool calls

But keep domain/business events in the product event stream.

---

## 3. Product charter

Desenrollador is not a generic finance chatbot.

It has one job: help a low-income Brazilian user reduce the real cost of a debt and complete a real next action.

### Primary product promise

In one session, the user should be able to:
1. understand the debt they have now
2. compare staying vs switching vs renegotiating
3. see the monthly and total difference clearly
4. choose the best acceptable option
5. execute the next step immediately
6. receive a follow-up later if they abandon

### UX benchmarks to emulate

1. Serasa Limpa Nome
   - clear savings and discount framing
   - obvious payment CTA
   - confidence, simplicity, low cognitive load

2. Juros Baixos
   - side-by-side comparisons
   - honest total-cost framing
   - visible ranking logic

3. meutudo
   - conversational flow
   - short copy
   - terms translated into common language

### Language rules

All user-facing copy must be PT-BR, short, low-literacy friendly, and concrete.

Preferred copy examples:
- “Hoje você está pagando caro nessa dívida.”
- “Se continuar assim, sai mais caro no total.”
- “Se trocar por esta opção, sua parcela cai.”
- “No total, você economiza R$ X.”
- “Posso te mandar um texto pronto para falar com o banco no WhatsApp.”

Forbidden copy examples:
- “anatocismo”
- “sistema de amortização” in the UI copy
- “instrumento de liquidação”
- “volatilidade contratual”

If technical concepts are needed, translate them:
- amortização -> “quanto você abate da dívida”
- CET -> “custo total do crédito”
- juros compostos -> “juros sobre juros”

---

## 4. Non-negotiable engineering constraints

1. Store money in centavos as integers at rest.
2. Use `Decimal`, never binary floating point, for disclosed financial math.
3. Version formulas. Every visible result must carry `formula_version`.
4. Persist source snapshots for debt and offers.
5. Never let the LLM compute visible numbers freehand.
6. Distinguish `declared_cet` from any internal `computed_effective_cost`.
7. Every offer must have source, provenance, timestamp, and expiry.
8. Never show expired offers without refresh.
9. Treat Open Finance as a consented regulated rail, not a generic API.
10. Prefer formal partner integrations over scraping.
11. Keep controller/operator/LGPD boundaries explicit in data contracts.
12. Redact CPF, payment tokens, and credentials from logs.
13. Separate `raw_input` from `model_visible_summary`.
14. Keep product truth in a database/ledger, not in chat state.
15. Any external action must be auditable and replayable from receipts.

---

## 5. System architecture

```text
channels
  ├─ web app
  ├─ WhatsApp
  └─ optional voice/app
        │
        ▼
OpenClaw runtime harness
  ├─ conversation orchestrator
  ├─ tool router
  └─ guarded creditor/browser actions
        │
        ├───────────────► MUTX control plane
        │                 ├─ auth / agents / deployments / runs
        │                 ├─ monitoring / heartbeats / metrics
        │                 ├─ webhooks / ingest
        │                 └─ governance via Faramesh/FPL
        │
        ▼
Desenrollador backend services
  ├─ identity + consent service
  ├─ debt intake service
  ├─ price/CET engine
  ├─ offer aggregator
  ├─ recommendation engine
  ├─ execution service
  ├─ settlement/reconciliation service
  └─ follow-up scheduler
        │
        ▼
external systems
  ├─ Serasa partner rail
  ├─ Juros Baixos / lender marketplace rail
  ├─ Acordo Certo rail
  ├─ Open Finance / sponsor rail
  ├─ creditor/bank channels
  ├─ Pix PSP / boleto issuer
  └─ CRM / WhatsApp / push / analytics
```

### Hard separation rules

1. OpenClaw handles interaction and orchestration.
2. Deterministic services handle numbers and recommendations.
3. MUTX handles runtime operation, governance, and observability.
4. The warehouse handles analytics and attribution.
5. A settlement ledger handles money state.

---

## 6. Proposed greenfield repo layout

Assume a new product repo rooted at `desenrollador/`.

```text
desenrollador/
  apps/
    web/
    runtime/
    ops-console/
  services/
    identity-consent/
    debt-intake/
    price-engine/
    offer-aggregator/
    recommendation/
    execution/
    settlement/
    followup/
  packages/
    domain/
    copy-ptbr/
    analytics/
    policy/
    fixtures/
  docs/
    architecture/
    compliance/
    partners/
    runbooks/
    adr/
  infra/
    terraform/
    docker/
    railway/
    observability/
```

### Service language recommendation

Use Python for deterministic financial services where `Decimal` and explicit schema validation matter:
- `services/price-engine`
- `services/recommendation`
- `services/settlement`

Use TypeScript/Node for:
- `apps/web`
- `apps/runtime` OpenClaw bridge
- `services/followup` if it binds tightly to runtime/channel APIs

Use PostgreSQL for:
- debt snapshots
- offer snapshots
- recommendations
- receipts
- follow-up policies
- settlement ledger

Use Redis or a queue for:
- scheduling
- retries
- outbox delivery
- idempotent job handling

---

## 7. Core domain model

### 7.1 DebtSnapshot

```json
{
  "debt_snapshot_id": "uuid",
  "user_id": "uuid",
  "source_type": "manual|api|sftp|portal_import|open_finance",
  "captured_at": "2026-04-05T19:00:00Z",
  "debt_type": "credit_card|personal_loan|overdraft|utility|telco",
  "creditor_name": "string",
  "contract_id": "string|null",
  "currency": "BRL",
  "outstanding_principal_cents": 0,
  "outstanding_balance_cents": 0,
  "days_past_due": 0,
  "monthly_rate_bps": 0,
  "annual_rate_bps": 0,
  "declared_cet_bps": 0,
  "fees_cents": 0,
  "insurance_cents": 0,
  "installment_amount_cents": 0,
  "remaining_installments": 0,
  "amortization_system": "price|sac|unknown",
  "payment_methods_supported": ["pix", "boleto"],
  "restrictions": [],
  "consent_id": "uuid|null",
  "raw_reference": "opaque-string"
}
```

### 7.2 OfferSnapshot

```json
{
  "offer_snapshot_id": "uuid",
  "provider": "serasa|juros_baixos|acordo_certo|bank_direct|manual",
  "provider_product": "string",
  "source_type": "api|sftp|portal|manual|open_finance",
  "quoted_at": "2026-04-05T19:00:00Z",
  "expires_at": "2026-04-08T19:00:00Z",
  "currency": "BRL",
  "amount_to_settle_cents": 0,
  "term_months": 0,
  "installment_amount_cents": 0,
  "monthly_rate_bps": 0,
  "annual_rate_bps": 0,
  "declared_cet_bps": 0,
  "fees_cents": 0,
  "insurance_cents": 0,
  "iof_cents": 0,
  "eligibility_flags": [],
  "execution_mode": "deeplink|script|operator_handoff|pix|boleto",
  "deep_link": "https://...",
  "provenance_hash": "sha256:...",
  "raw_reference": "opaque-string"
}
```

### 7.3 SimulationRun

```json
{
  "simulation_run_id": "uuid",
  "user_id": "uuid",
  "debt_snapshot_id": "uuid",
  "offer_snapshot_ids": ["uuid"],
  "formula_version": "price-v1",
  "generated_at": "2026-04-05T19:00:00Z",
  "current_path_total_cents": 0,
  "recommended_path_total_cents": 0,
  "monthly_difference_cents": 0,
  "total_savings_cents": 0,
  "payoff_delta_months": 0,
  "receipt_hash": "sha256:..."
}
```

### 7.4 FollowUpPolicy

```json
{
  "follow_up_policy_id": "uuid",
  "user_id": "uuid",
  "simulation_run_id": "uuid",
  "scheduled_for": "2026-04-08T19:00:00Z",
  "channel": "whatsapp|push|sms|email",
  "status": "scheduled|sent|expired|suppressed|converted",
  "must_refresh_offers": true,
  "copy_template": "abandoned_simulation_72h_v1"
}
```

---

## 8. Deterministic finance engine rules

This is the trust core.

### 8.1 Price formula implementation

Implement Price amortization exactly and keep it versioned.

```python
from decimal import Decimal, ROUND_HALF_UP, getcontext

getcontext().prec = 28
CENT = Decimal('0.01')


def q2(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def price_payment(pv: Decimal, monthly_rate: Decimal, periods: int) -> Decimal:
    if periods <= 0:
        raise ValueError('periods must be positive')
    if monthly_rate == 0:
        return q2(pv / Decimal(periods))
    numerator = pv * monthly_rate
    denominator = Decimal('1') - (Decimal('1') + monthly_rate) ** Decimal(-periods)
    return q2(numerator / denominator)
```

### 8.2 Output requirements

For every simulation produce:
- installment schedule
- total paid
- total interest
- fees and insurance totals
- current debt path vs refinance path
- monthly difference
- total savings
- duration difference
- formula version
- receipt object with replayable inputs

### 8.3 Golden-test matrix

Mandatory tests:
- zero-interest case
- one-installment edge case
- high-rate case
- long-term case
- centavo rounding case
- fees-included case
- insurance-included case
- imported offer with declared CET
- imported offer missing CET but with other cost fields
- expired offer rejection case

---

## 9. Recommendation engine rules

Start deterministic, not ML-first.

### Objective order

1. minimize total cost
2. respect affordability threshold
3. respect eligibility constraints
4. prefer high execution certainty
5. prefer shorter payoff when total cost is similar
6. prefer direct executable paths over vague lead forms when economics are similar

### Recommendation output

Return:
- `recommended_offer_id`
- ranked options top 3
- reasons
- assumptions
- warnings
- affordability result
- expiry warnings

### Important rule

Do not rank solely by installment size. A lower monthly payment can still be the worse offer if total paid is much higher.

---

## 10. Integration policy by rail

### 10.1 Open Finance

Treat Open Finance as a dedicated consented rail.

Requirements:
- explicit consent artifact
- purpose binding
- scope tracking
- expiry tracking
- sponsor/participant operational path
- consent validity checks before portability flows

Do not model this as “we have bank data now.” Model it as:
1. consent requested
2. consent granted
3. data imported
4. consent still valid
5. portability request allowed or blocked

### 10.2 Serasa

Prefer formal partner rails first.

Build an adapter for:
- portal mode
- SFTP mode
- API mode

Do not make scraping the primary design if formal partner access exists.

### 10.3 Juros Baixos

Use as a comparison/offer marketplace rail where partnership exists.

Main purpose in v1:
- normalized refinance offers
- side-by-side comparison source
- lender/product ranking input

### 10.4 Acordo Certo

Treat as a negotiation rail with mock adapter first and real connector second.

Until private docs are in hand:
- keep the adapter interface stable
- mock payloads
- isolate provider-specific assumptions in fixtures

### 10.5 Pix and boleto

Execution service should support:
- payment artifact generation metadata
- payment artifact validation status
- expiry time
- settlement webhook correlation
- reconciliation to internal ledger

---

## 11. Governance policy starter pack

Create a policy pack specifically for Desenrollador.

Example stance:

```fpl
agent desenrollador {
  default deny

  budget session {
    max $0
    max_calls 200
    on_exceed deny
  }

  rules {
    permit debt/read_*
    permit offers/read_*
    permit simulation/compute
    permit recommendation/rank

    defer execution/create_payment when amount > 500
      notify: "finance"
      reason: "manual review for high-value payment artifact"

    defer negotiation/submit_live when creditor_risk = "high"
      notify: "ops"
      reason: "sensitive creditor negotiation lane"

    deny! shell/* reason: "no shell tools on consumer surfaces"
    deny! browser/raw reason: "no broad browser automation on public channels"
    deny! secrets/read_* reason: "raw secrets are never model-visible"
  }
}
```

---

## 12. Telemetry model

### 12.1 Product events

Emit these from product services:
- `debt.snapshot.created`
- `debt.snapshot.refreshed`
- `offer.snapshot.created`
- `offer.snapshot.expired`
- `simulation.completed`
- `simulation.rejected`
- `recommendation.presented`
- `recommendation.accepted`
- `execution.started`
- `negotiation.script.generated`
- `payment.instrument.issued`
- `payment.settled`
- `payment.failed`
- `followup.scheduled`
- `followup.delivered`
- `followup.converted`

### 12.2 MUTX runtime/control events

Let MUTX manage runtime/control event families such as:
- `agent.*`
- `deployment.*`
- `metrics.*`
- `health.check`

### 12.3 Warehouse metrics

Track at minimum:
- simulation latency p50/p95
- offer freshness rejection rate
- monthly savings distribution
- total savings distribution
- recommendation acceptance rate
- deep-link clickthrough rate
- negotiation-script export rate
- payment artifact issue rate
- first-installment-paid rate
- 72h follow-up delivery rate
- 72h follow-up conversion rate
- drop-off by conversation step
- runtime/tool failure rate

---

## 13. Execution order: what the build agent should do first

Do not wait for all real integrations. Build the vertical slice with mocks.

### Phase 0: Platform bootstrap

**Objective:** Create a repo that can host the full product shape without real partners yet.

**Files:**
- Create: `desenrollador/README.md`
- Create: `desenrollador/docs/architecture/overview.md`
- Create: `desenrollador/docs/adr/001-control-plane-boundary.md`
- Create: `desenrollador/.env.example`
- Create: `desenrollador/docker-compose.yml`
- Create: `desenrollador/infra/observability/README.md`

**Deliverables:**
- repo scaffold
- local Postgres/Redis
- service map
- environment variable contract
- ADR confirming MUTX vs product-service boundaries

### Phase 1: Deterministic comparison core

**Objective:** Ship the first trustworthy simulation path before any live partner integration.

**Files:**
- Create: `desenrollador/services/price-engine/app/main.py`
- Create: `desenrollador/services/price-engine/app/formulas/price.py`
- Create: `desenrollador/services/price-engine/app/schemas.py`
- Create: `desenrollador/services/price-engine/tests/test_price_formula.py`
- Create: `desenrollador/services/recommendation/app/main.py`
- Create: `desenrollador/services/recommendation/tests/test_ranking.py`
- Create: `desenrollador/packages/domain/simulation.py`

**Deliverables:**
- Price formula engine with golden tests
- deterministic comparison endpoint
- current-vs-refinance response contract
- receipt object generation

### Phase 2: User-facing comparison shell

**Objective:** Make the vertical slice usable by a real person.

**Files:**
- Create: `desenrollador/apps/web/app/page.tsx`
- Create: `desenrollador/apps/web/app/simular/page.tsx`
- Create: `desenrollador/apps/web/components/debt-intake-form.tsx`
- Create: `desenrollador/apps/web/components/comparison-card.tsx`
- Create: `desenrollador/apps/web/components/recommendation-card.tsx`
- Create: `desenrollador/packages/copy-ptbr/index.ts`

**Deliverables:**
- manual debt intake
- comparison card with current path vs better path
- visible monthly and total savings
- CTA for deep link or WhatsApp script export

### Phase 3: Runtime orchestration

**Objective:** Wire chat behavior to the deterministic core.

**Files:**
- Create: `desenrollador/apps/runtime/src/orchestrator.ts`
- Create: `desenrollador/apps/runtime/src/tools/computeSimulation.ts`
- Create: `desenrollador/apps/runtime/src/tools/rankOffers.ts`
- Create: `desenrollador/apps/runtime/src/tools/generateNegotiationScript.ts`
- Create: `desenrollador/apps/runtime/src/policies/desenrollador.fpl`
- Create: `desenrollador/apps/runtime/src/prompts/system-ptbr.md`

**Deliverables:**
- one-question-at-a-time conversation flow
- guarded tool contracts
- PT-BR system prompt aligned to product rules
- policy pack loaded before tool use

### Phase 4: Follow-up memory loop

**Objective:** Implement the differentiator.

**Files:**
- Create: `desenrollador/services/followup/app/main.py`
- Create: `desenrollador/services/followup/app/jobs/abandoned_simulation.py`
- Create: `desenrollador/services/followup/tests/test_followup_resimulation.py`
- Create: `desenrollador/packages/domain/followup.py`

**Deliverables:**
- schedule 72h follow-up after abandonment
- refresh-offer-before-speaking logic
- suppression and opt-out logic
- follow-up receipts and analytics events

### Phase 5: Partner adapter shell

**Objective:** Define stable interfaces before real credentials arrive.

**Files:**
- Create: `desenrollador/services/offer-aggregator/app/adapters/base.py`
- Create: `desenrollador/services/offer-aggregator/app/adapters/manual.py`
- Create: `desenrollador/services/offer-aggregator/app/adapters/serasa.py`
- Create: `desenrollador/services/offer-aggregator/app/adapters/juros_baixos.py`
- Create: `desenrollador/services/offer-aggregator/app/adapters/acordo_certo.py`
- Create: `desenrollador/services/offer-aggregator/tests/test_offer_normalization.py`
- Create: `desenrollador/packages/fixtures/provider_payloads/*.json`

**Deliverables:**
- normalized `OfferSnapshot` interface
- mock payload fixtures
- provider-specific translation layer
- expiry/provenance hashing logic

### Phase 6: Payments and reconciliation

**Objective:** Turn simulation into cash movement safely.

**Files:**
- Create: `desenrollador/services/execution/app/main.py`
- Create: `desenrollador/services/settlement/app/main.py`
- Create: `desenrollador/services/settlement/app/ledger.py`
- Create: `desenrollador/services/settlement/tests/test_reconciliation.py`
- Create: `desenrollador/docs/runbooks/payment-failure.md`

**Deliverables:**
- payment artifact metadata model
- reconciliation hooks
- settlement ledger
- failure/expiry/refund handling runbook

---

## 14. First sprint backlog

The first sprint is successful if it ships a trustworthy mock-powered vertical slice.

### Sprint 1 target

A user can manually input one debt, compare it against one mocked refinance offer, see monthly + total savings, export a WhatsApp negotiation script, and be scheduled for a follow-up after abandonment.

### Sprint 1 tasks

1. Create the repo scaffold and ADRs.
2. Implement `DebtSnapshot`, `OfferSnapshot`, `SimulationRun`, and `FollowUpPolicy` schemas.
3. Implement the Price formula service with golden tests.
4. Implement deterministic ranking logic with tests.
5. Build mocked provider adapter fixtures.
6. Build the basic web intake flow.
7. Build the comparison and recommendation UI.
8. Build the negotiation script generator.
9. Build the 72h follow-up scheduler.
10. Emit product events and wire runtime events to MUTX ingest/webhooks.
11. Add PT-BR copy review pass.
12. Add redaction/logging tests.

---

## 15. Questions for Diego’s team

These questions should be sent immediately. Do not block scaffolding on the answers.

### Product and commercial

1. What is the day-1 conversion target?
   - simulation completed
   - negotiation started
   - agreement closed
   - first installment paid
   - portability completed

2. Which debt types are in v1?
   - cartão rotativo
   - cheque especial
   - empréstimo pessoal
   - utilities
   - telco

3. Which partners are real versus benchmark-only right now?
4. Are they positioning this as a comparator, a renegotiation agent, a refinance/origination layer, or all three?
5. What is the priority persona?
   - negative-listed user
   - current-on-payments but trapped in bad terms
   - INSS/FGTS-heavy user
   - overdraft/revolving-card user

### Legal, regulatory, and compliance

1. Who is the LGPD controller and who is the operator in each flow?
2. Is there already a regulated Open Finance sponsor/participant path?
3. What approved consent text already exists?
4. What disclosures must be shown before recommendation, before negotiation, and before payment?
5. Which actions require human approval?
6. What audit trail format is required for simulations and actions?
7. How long may we retain:
   - CPF-linked identifiers
   - contract data
   - offer history
   - payment artifacts
   - follow-up history

### Runtime and channels

1. What are the primary channels for v1?
   - web
   - WhatsApp
   - app
   - voice

2. Who owns the WhatsApp BSP relationship?
3. Do they already have approved templates for outbound follow-up?
4. Is browser-assisted negotiation allowed, or must all execution be deep links/scripts only?
5. What SLO is required for simulation latency?
6. What concurrency/volume is expected per day?

### Integrations and external systems

1. Do they already have Serasa partner access? If yes, which mode?
   - API
   - SFTP
   - portal

2. Is there a technical contact and spec for Acordo Certo?
3. Is Juros Baixos white-label/API already commercially approved?
4. Which PSP handles Pix?
5. Who issues and reconciles boleto?
6. What is the CRM/source-of-truth for user lifecycle state?
7. What analytics warehouse is the destination?

### Security and infra

1. Which secrets manager/KMS is canonical?
2. What is the environment split?
   - local
   - staging
   - homolog
   - production

3. What sandbox credentials and fixtures are available?
4. Are there existing webhook receivers we must plug into?
5. Is there an enterprise SIEM or compliance archive we must export to?

---

## 16. Things we need to plug into their systems

### Identity and consent

We need:
- user identity rail
- CPF validation strategy
- OTP or equivalent verification method
- consent artifact storage
- consent revocation hooks
- user-to-contract linking scheme
- opt-in/opt-out state for follow-up messaging

### Financial data rails

We need:
- Open Finance sponsor/participant details if applicable
- scopes and consent expiry rules
- contract import fields
- periodic refresh cadence
- idempotency model for repeated imports

### Creditor and marketplace rails

We need:
- Serasa credentials/sandbox/process docs
- Juros Baixos docs/partnership status
- Acordo Certo private spec/contact
- lender/creditor master catalog
- product mapping tables
- deep-link patterns per creditor

### Payment rails

We need:
- Pix PSP credentials and webhook model
- boleto issuer details
- payment-status webhooks
- reconciliation data format
- refund/cancel/expire flows

### CRM and retention rails

We need:
- WhatsApp provider/BSP
- SMS or push provider if fallback is needed
- suppression list logic
- campaign attribution source
- follow-up policy approvals

### Analytics and observability rails

We need:
- warehouse destination
- product event schema approval
- dashboard/BI owner
- MUTX webhook subscriptions to create
- ingest authentication strategy
- alert routing

### Governance and secrets

We need:
- FPL policy ownership
- approval routing team
- credential broker backend choice
- receipt retention policy
- compliance export requirements

---

## 17. Definition of done for v1

v1 is done only when all of these are true:

1. A user can enter one debt manually and receive a deterministic comparison.
2. The UI clearly shows:
   - current path
   - alternative path
   - monthly impact
   - total impact
   - payoff duration impact
3. The assistant can explain the result in simple PT-BR.
4. The user can click a deep link or export a ready-to-send negotiation script.
5. Abandoned simulations trigger a 72h follow-up policy.
6. Expired offers are never shown without refresh.
7. All visible money outputs pass centavo-level golden tests.
8. Sensitive fields are redacted from logs and model-visible summaries.
9. Runtime health/metrics flow into MUTX.
10. Product events flow into the warehouse.
11. Governance policy blocks unsafe tools/actions on public channels.
12. Receipts exist for simulations and externally consequential actions.

---

## 18. Builder posture

The agent executing this plan should behave like this:

1. Build the deterministic financial core first.
2. Mock external rails before waiting on commercial timelines.
3. Treat MUTX as the shell around the product, not the product itself.
4. Never bury debt truth inside the prompt.
5. Never let copy get more technical than the people using it.
6. Prefer honest constraints over fake “AI magic.”
7. Ship a vertical slice that actually helps someone before expanding partner count.

This is the right first move: a trustworthy debt engine with a guarded agent shell around it, not a flashy chatbot that improvises finance.
