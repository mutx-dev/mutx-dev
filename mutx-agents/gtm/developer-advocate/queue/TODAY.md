# queue/TODAY.md — Developer Advocate
**Refreshed: 2026-04-01 10:00 Europe/Rome**
**Previous: 2026-03-31 10:00 Europe/Rome**

## Status: THIN — building interface-layer tutorial; walkthrough on hold

---

## Active blocker: `mutx assistant overview` → INTERNAL_ERROR

**Still unresolved.** No confirmation the bug was routed to engineering. Walkthrough remains blocked at step 3.

**Workaround available:** `mutx runtime inspect openclaw --output json` works. Dashboard routes are stable. Interface-layer tutorial does not require `mutx assistant overview`.

---

## Priority build: interface-layer failure tutorial

**Why now:** Crittora (P0 new competitor as of 2026-04-01) has APP — Agent Permission Protocol — cryptographically enforced authorization policies for OpenClaw. Crittora does NOT address interface-layer failures (malformed tool outputs, broken API contracts, state drift). This is the MUTX angle that remains uncontested.

**Signal anchors (confirmed today):**
- Multi-agent production failure rate: 41–86% (14 documented root-cause failure modes)
- Silent failures (no alerts) confirmed as named category
- 72% of enterprise agent failures: wrong pattern selection, broken data pipelines, vendor lock-in
- Crittora APP addresses ambient authority — not integration boundary failures

**Tutorial: "How MUTX catches interface layer failures before they become production incidents"**

- Core claim: "Not fix the AI — fix the integration." The dominant breakdown mode in multi-agent systems is not AI reasoning failure. It's broken API contracts, malformed tool outputs, and state drift at integration boundaries.
- What MUTX catches: malformed tool outputs, broken API contracts, state drift between handoffs
- How MUTX catches them: `mutx runtime inspect` (first-call diagnostic), `/dashboard/runs/{id}/traces` (post-hoc reconstruction), budget alerts (policy enforcement at integration boundary)
- CLI evidence: `mutx runtime inspect openclaw --output json` (works now)
- Dashboard evidence: `/dashboard/runs` + traces, `/dashboard/budgets` (documented stable)
- Competitive angle: AWS AgentCore shipped observability without budget enforcement. MUTX closes the enforcement gap.
- Crittora differentiation: APP specifies authorization policies. MUTX enforces them at runtime including interface-layer failures. Different problem layer.

**Deliverable:** Annotated tutorial with CLI snippets + dashboard annotations + positioning frame. Targets developers evaluating agent governance solutions.

**Deliverable status:** Ready to build. Does not require API fix or go/no-go.

---

## Walkthrough — on hold

**Bounded path (with API workaround if needed):**
`mutx setup` → `mutx assistant deploy "Personal Assistant"` → `mutx runtime inspect openclaw --output json` → `app.mutx.dev/dashboard/runs` → `app.mutx.dev/dashboard/budgets`

**Minimum proof pack:**
- [ ] Dashboard runs page screenshot (audit + event history) — needs logged-in session
- [ ] Dashboard budgets page screenshot — needs logged-in session
- [ ] `mutx runtime inspect openclaw --output json` snippet (works now)
- [ ] Deployment event-history payload (JSON from `/api/dashboard/runs`)
- [ ] 5-step annotated demo script

**Positioning anchor:** Lead with 85%→5% (Cisco/RSAC): "85% testing, 5% in production — and the bottleneck isn't AI capability, it's governance."

**Blocker:** `mutx assistant overview` INTERNAL_ERROR + no go/no-go from Fortune.

---

## Crittora — P0 competitive context for tutorial

**Crittora APP (Agent Permission Protocol):**
- Public spec on GitHub, APP v2 with deterministic capability resolution
- Explicitly targets OpenClaw, positions as "making OpenClaw enterprise-ready"
- MUTX runs on OpenClaw — relationship is competitive or complementary depending on implementation
- APP addresses: ambient authority, scoped/time-bounded authorization policies, cryptographic verification
- APP does NOT address: interface-layer failures, broken API contracts, state drift, silent failures without alerts

**Tutorial competitive angle:** MUTX enforces authorization at the integration boundary. Crittora APP specifies what the policy should be. MUTX catches when the policy is violated by a broken tool output or state drift. Different layers, both needed.

**Flag:** MUTX vs. Crittora APP differentiation brief is owned by outside-in-intelligence or product. Developer-advocate will build tutorial content against confirmed product truth — differentiation framing needs competitive authority first.

---

## Flag for other lanes

**social-media-strategist — still blocked on dashboard screenshots:**
`/dashboard/security`, `/dashboard/monitoring`, `/dashboard/budgets` screenshots unblock the proof stack. This lane cannot produce those screenshots — requires a logged-in session on app.mutx.dev.

---

## Next moves (priority order)

1. **Build interface-layer tutorial now** — no blockers, highest-signal developer content available
2. **Fortune: route `mutx assistant overview` bug to engineering** — one line closes the walkthrough blocker
3. **Fortune: go/no-go on walkthrough** — if approved, lane builds proof pack around working surfaces
4. **After Crittora competitive brief lands:** re-anchor tutorial on MUTX vs. APP differentiation
5. **Social-media-strategist unblock:** dashboard screenshots remain on them — needs logged-in session
