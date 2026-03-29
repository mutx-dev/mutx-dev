# Account Brief — GitHub Actions / Agentic Workflows

## Account choice
- **Target account:** GitHub Actions / Agentic Workflows
- **Why this account:** the market signal now has two layers confirming the same gap: GitHub's own governed-execution language (secure defaults, policy controls, scoped credentials, network boundaries, constrained outputs) and Gartner's enterprise-scale validation that governance failure is the #1 deployment risk causing a $58B enterprise software shakeup by 2027.

## Working thesis
Governance failure is the #1 deployment risk. The bottleneck is control, not capability. MUTX is the control plane that makes agentic execution safe, auditable, and bounded by policy — not through model quality, but through runtime path evaluation, approval hooks, and observable, enforceable boundaries.

## Stakeholder map
- **Champion:** platform or workflow lead responsible for GitHub Actions or agentic workflow safety; feels the gap between "agents can run" and "agents can run safely."
- **Operator user:** CI/workflow engineer or platform operator who owns runners, logs, approvals, and boundary enforcement; needs runtime evidence of policy state.
- **Buyer:** engineering/platform leadership responsible for secure defaults, governance posture, and rollout confidence; Gartner framing is already loaded here.

## Whitespace map
- **What they already believe:** agents need secure defaults, policy controls, scoped credentials, and network boundaries; generic observability is table stakes.
- **What they are still missing:** tool whitelist ≠ authorization; "can call this API" ≠ "is this action safe given prior path?"; sandbox is not the security boundary; runtime path evaluation with session context and cumulative intent is the missing enforcement model.
- **What MUTX proves:** policy-based enforcement with execution-path evaluation, approval hooks, and audit trails that make accountability enforceable and observable — not a dashboard promise, but a CLI-governance proof.

## MUTX wedge
MUTX helps teams **deploy, operate, observe, and govern agentic workflows like production infrastructure**. The wedge is not observability — it is control-plane maturity: lifecycle control, runtime path enforcement, governance decisions, and honest supported-vs-preview boundaries.

## Proof boundary
- supported `/dashboard` operator lane
- real CLI governance path (`mutx governance status`, `decisions`, `pending`, `metrics`)
- runtime inspection and truthfulness around supported vs preview surfaces
- do not claim dashboard-first governance or full approval UX

## Design-partner path
1. Start with one governed workflow or runner boundary problem.
2. Show MUTX as the layer that gives policy, approvals, and runtime visibility without lying about UI gaps.
3. Expand from a single workflow proof into fleet-level governance, traces, and auditability.
4. Only widen once the account agrees the control-plane framing matches the real operating problem.

## Expansion logic
Once the first workflow is credible, the next expansion is:
- broader policy coverage with execution-path evaluation
- more runtime surfaces
- approval visibility and intent-scope enforcement
- audit and trace retention
- support for additional teams with the same governance posture

## Account-level triggers
- **Gartner (March 29, 2026):** 50% of AI agent deployments will fail due to insufficient governance platforms; $58B enterprise software shakeup by 2027. Buyers will come in with this framing already loaded.
- **GitHub Actions / Agentic Workflows:** strongest platform signal for bundled secure defaults + observability expectations.
- **OpenClaw plugin approval hooks (March 28, 2026):** most concrete product proof that approval-gate direction is shipping.

## What to say in outreach / briefings
- "The bottleneck isn't capability — it's control." (Gartner framing)
- Runtime path evaluation: "is this action safe given prior path?" not just "can this tool be called?"
- Sandbox is not the security boundary; the access model is.
- Operator proof over promise; auditability over dashboard polish.
