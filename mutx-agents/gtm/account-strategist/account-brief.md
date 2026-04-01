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
- **What they already believe:** agents need secure defaults, policy controls, scoped credentials, and network boundaries; generic observability is table stakes; the 85%→5% pilot-to-production gap is about governance readiness.
- **What they are still missing:** tool whitelist ≠ authorization; "can call this API" ≠ "is this action safe given prior path?"; sandbox is not the security boundary; **ambient authority: agents inherit permissions from context, not explicit grant** — "who authorized this specific action in this specific context?" has no verifiable runtime answer in most deployments; execution-time authorization (scoped permissions at call time, not creation time) is the missing mechanism; memory ownership ("who owns the mind?") is the unasked governance prerequisite; per-agent trust scoring and risk-proportional controls are the mechanism, not just binary allow/deny.
- **What MUTX proves:** MUTX answers "who authorized this at runtime?" — verifiable, execution-time authorization scoped to context, not inherited from context grants. Three Forrester standards gaps: instrumentation completeness, portable agent identity, and cross-plane governance schemas. MUTX closes the ambient authority gap that observability-only tools, IAM vendors, and model-centric platforms all leave open.

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
3. Expand from a single workflow proof into fleet-level governance, traces, and auditability — including multi-agent escalation paths and state conflict arbitration.
4. Only widen once the account agrees the control-plane framing matches the real operating problem.

## Expansion logic
Once the first workflow is credible, the next expansion is:
- broader policy coverage with execution-path evaluation
- more runtime surfaces
- approval visibility and intent-scope enforcement
- audit and trace retention
- support for additional teams with the same governance posture

## Account-level triggers
- **Cisco/RSAC 2026 (March 30, 2026):** 85% of enterprises are testing AI agent pilots. Only 5% have moved to production. The bottleneck is governance and security readiness, not AI capability or enthusiasm. Primary research citation for enterprise conversations.
- **Gartner (March 29, 2026):** 50% of AI agent deployments will fail due to insufficient governance platforms; $58B enterprise software shakeup by 2027. Buyers will come in with this framing already loaded.
- **GitHub Actions / Agentic Workflows:** strongest platform signal for bundled secure defaults + observability expectations.
- **Sycamore Labs $65M seed (March 2026):** Coatue + Lightspeed, Sri Viswanath (former Atlassian CTO), angels including Bob McGrew (ex-OpenAI chief scientist) and Lip-Bu Tan (Intel CEO). Product: "agent operating system" with discovery, deployment, observability, and tiered trust controls for fleets. Validates category is real; platform competitor. **Fortune needs to determine whether MUTX competes for the same buyers or occupies a different layer.**
- **Microsoft Agent 365 + Copilot Studio (March 2026):** Two-pronged enterprise governance attack. Copilot Studio = governed foundation for building agents. Agent 365 = operational control plane for production observation, restriction, and investigation. The default enterprise answer coming. MUTX must answer "what Agent 365 doesn't cover."
- **EU AI Act August 2, 2026:** Hard deadline for high-risk obligations. Fines up to €15M or 3% of global annual turnover. Any enterprise with EU exposure that hasn't addressed agent governance by Q2 2026 is on a named procurement countdown.
- **AWS AgentCore: observability without budget enforcement (March 2026):** "You can watch your agent overspend in real time. You just can't stop it." The control plane that only watches is insufficient. MUTX's "control plane decides" is the answer.
- **200,000 AI agent instances exposed with plaintext memory (March 30, 2026):** "Who owns the mind?" is the unasked governance prerequisite. Memory ownership will become a buyer question.
- **OpenClaw plugin approval hooks (March 28, 2026):** most concrete product proof that approval-gate direction is shipping.
- **Multi-agent state conflict (March 30, 2026):** "One agent is a workflow. Five agents are an organization." State conflicts and escalation paths between agents have no standard answer yet.

## Competitor register
- **Microsoft Agent 365 + Copilot Studio — GA MAY 1. 30 DAYS.** $15/$99 pricing. Enterprise buyers in Microsoft shops will be pitched this as the native agent governance answer starting May 1. MUTX has a 30-day window to establish differentiation before Microsoft becomes the default. **What does Agent 365 not cover? That is the only conversation that matters after May 1.**
- **Sycamore Labs:** $65M seed, Coatue + Lightspeed, Sri Viswanath (former Atlassian CTO). Product: "agent operating system" with tiered fleet trust controls. Platform competitor. **Question: does MUTX sit above Sycamore's runtime, or do they fight for the same budget?**
- **Saviynt (NEW — March 2026):** Established IAM/identity governance vendor. "Industry's First Identity Control Plane for AI Agents." Named design partners: The Auto Club, Hertz, UKG. Stat: 91% of organizations lack visibility into AI identities. Every Saviynt account is an existing relationship being extended into agent governance — this is an incumbent upsell play, not a startup bet. MUTX angle: Saviynt covers IAM identity; MUTX covers agent authorization at execution time. They are adjacent, not identical. **Assess whether MUTX competes on IAM identity or owns the execution-time authorization layer independently.**
- **IntentBound (intentbound.com):** Patent GB2603013.0, NIST/NCCoE filings, sub-5ms validation. "The Authorization Layer for High-Stakes AI." Monitor: any buyer mentioning "intent-bounded" or "IBA" signals IntentBound is in their evaluation.
- **AWS AgentCore:** Observability without budget enforcement. Ships the monitoring half; enforcement is missing. MUTX angle: "AWS shows you the overspend. MUTX stops it."

## What to say in outreach / briefings
- "85% of enterprises are testing AI agent pilots. Only 5% are in production. The bottleneck isn't AI capability — it's governance." (Cisco/RSAC 2026)
- "The bottleneck isn't capability — it's control." (Gartner framing)
- Ambient authority: "Agents inherit permissions from context, not explicit grant. Until 'who authorized this specific action?' has a verifiable runtime answer, the authority envelope collapses under load." — MUTX answers this at execution time.
- "91% of organizations lack visibility into what their AI agents are doing." (Saviynt, March 2026)
- Runtime path evaluation: "is this action safe given prior path?" not just "can this tool be called?"
- "Governance without ownership is just a different landlord." (Memory ownership)
- "Review tells you what's wrong. Governance tells you what to do about it." (Risk-proportional rules)
- Sandbox is not the security boundary; the access model is.
- Operator proof over promise; auditability over dashboard polish.
