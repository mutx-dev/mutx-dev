# Latest — Outside-In Intelligence

**Updated: 2026-04-01 08:20 Europe/Rome**
**Cycle: ~14 hours since last refresh (2026-03-31 18:20 Europe/Rome)**

## Lane utility verdict
- **Status:** STRONG
- **Recommendation:** KEEP

## What changed in signal truth

**New since 2026-03-31 18:20 cycle:**

1. **Crittora: NEW competitor — Agent Permission Protocol (APP) on OpenClaw.** Crittora announced Feb 24, 2026 a cryptographically enforced policy framework specifically for the OpenClaw runtime, positioning itself as making OpenClaw "enterprise-ready by eliminating ambient authority." They have: (a) a public protocol spec on GitHub (github.com/Crittora/agent-permission-protocol), (b) APP v2 with deterministic capability resolution and multi-agent delegation rules, (c) a specific OpenClaw integration, and (d) the same problem framing that MUTX is using (ambient authority = the core problem). **This is the most urgent new competitive finding — Crittora has a named protocol and a product, not just positioning.**

2. **Microsoft Agent 365 GA details: what remains unresolved.** GA May 1 at $15/user/month. Each AI agent gets a Microsoft Entra Agent ID. Open question Microsoft has not answered: how are fully autonomous agents that don't run "on behalf of a user" licensed and governed? This is a named, specific gap in Microsoft's own documentation. MUTX should have a product answer for it.

3. **"Shadow agent" problem: named and circulating.** @SchellingProto: agents operating across organizational boundaries need discovery + identity + permission auditing across principals who don't share an IT stack. This extends cross-plane governance from an internal enterprise concern to an inter-organizational problem.

4. **Payment network agent trust layers: separate parallel track.** IETF (agent trust scoring for payments), Mastercard (Verifiable Intent), Visa (Trusted Agent Protocol). These are building toward institutional agent trust infrastructure — different from OpenClaw runtime control but potentially intersecting.

5. **Multi-agent failure rate confirmed 41–86% in production.** 14 documented failure modes. Silent failures confirmed as a named category. 72% of enterprise failures from wrong pattern selection, broken data pipelines, vendor lock-in. ICLR 2026: 70% of agent communication redundant, single agents match swarms on most benchmarks.

**Core signal stack (sustained, confirmed, upgraded):**
- **Crittora APP: Execution-time authorization protocol on OpenClaw — NEW COMPETITOR (Feb 24, 2026)**
- **Saviynt: Identity control plane for AI agents, enterprise design partners — NEW INCUMBENT COMPETITOR**
- **Microsoft Agent 365: GA May 1, $15/$99 pricing — 30 DAYS AWAY**
- **Sycamore Labs: $65M seed, agent OS, tiered fleet trust controls**
- **Ambient authority: Crittora confirms + specifies the problem with a protocol**
- **APP (Agent Permission Protocol): scoped, time-bounded, cryptographically verifiable permissions**
- **91% of orgs lack AI identity visibility (Saviynt stat)**
- **Ghost failures, error compounding, silent failures — NAMED PAIN**
- **EU AI Act August 2 deadline**

## Exact evidence
- **Crittora / PRNewswire — Feb 24, 2026:** "Crittora makes OpenClaw enterprise-ready by eliminating ambient authority in autonomous agents." Cryptographically enforced policy framework for OpenClaw runtime. APP v2: deterministic capability resolution, policy-derived execution surfaces, explicit delegation rules for multi-agent workflows.
- **agentpermissionprotocol.com — accessed 2026-04-01:** "The Agent Permission Protocol (APP) requires explicit, cryptographically verifiable permission policies to gate agent execution at runtime." "Answers one question: Who authorized this action — and under what constraints — at the moment it executed?"
- **github.com/Crittora/agent-permission-protocol — accessed 2026-04-01:** Public specification for execution-time authority in agentic systems.
- **Rob Quickenden blog — March 2026:** "Agent 365 is the Entra ID management pane for AI agents." May 1 GA, $15/user/month. Each AI Agent gets Entra Agent ID. Open question: autonomous agents not running on behalf of a user remain unaddressed in licensing/governance.
- **@SchellingProto / X — March 30, 2026:** "The shadow agent problem is going to get worse fast. Once agents interact across organizational boundaries, you need discovery + identity + permission auditing across principals who don't share an IT stack."
- **@OriginDAO_ai / X — March 31, 2026:** "IETF drafted agent trust scoring for payments. Microsoft launched Zero Trust for AI. Mastercard announced Verifiable Intent. Visa shipped Trusted Agent Protocol. Everyone is building agent trust. Most of them require permission."
- **futureagi.substack.com — 2026:** "Multi-agent LLM systems fail 41 to 86% of the time in production. 14 root-cause failure modes."
- **dev.to / March 2026:** "Most AI agent demos work perfectly. Most AI agent deployments fail within a week."
- **medium.com / March 2026:** "The silent failure of AI agents represents a fundamental characteristic of non-deterministic software."
- **laderalabs.io — 2026:** "72% of agent architecture failures stem from three root causes: wrong pattern selection, broken data pipelines, and vendor lock-in."
- **swarmsignal.net — ICLR 2026:** "70% of agent communication is redundant. Single agents still match swarms on most benchmarks."

## What Fortune can do with this today
- **Immediate: Crittora competitive brief.** Crittora has APP (named protocol, GitHub spec, OpenClaw integration). MUTX vs. Crittora APP: what's the differentiation? Does MUTX implement APP? Complement it? Do more? This is the most urgent question — Crittora is already positioning as the execution-time authorization answer on the exact runtime MUTX uses.
- **Add Crittora to competitive tracking — P0.** They have a shipped product (not just press release), a public spec, and an OpenClaw integration. This is a materially different competitive situation than 48 hours ago.
- **Microsoft Agent 365 unsupervised agent gap — MUTX product positioning opportunity.** Microsoft has no answer for agents not running on behalf of a user. If MUTX has a governance model for fully autonomous agents, this is the week to name it specifically.
- **Ambient authority resolution needs a MUTX-specific mechanism statement.** Petrus described the problem. Crittora wrote a protocol spec. MUTX needs to say what it actually does — not just what it solves. "MUTX does X, not just Y."

## What should change in this lane next
- **MUTX vs. Crittora APP differentiation — P0 this week.** This is now the sharpest competitive question. Crittora has named the problem and specified the solution mechanism. MUTX needs to be equally concrete.
- **Sycamore Labs teardown.** $65M seed. "Tiered fleet trust controls." Primary startup competitor to Saviynt and Microsoft — hasn't been fully assessed yet.
- **Crittora OpenClaw integration: MUTX positioning question.** Crittora is "making OpenClaw enterprise-ready." MUTX runs on OpenClaw. Is MUTX complementary to Crittora (layer on top), competitive (alternative to APP), or neither? Fortune needs to decide.
- **Payment network agent trust protocols — quarterly monitor.** Visa, Mastercard, IETF are building separate trust infrastructure. Not a daily lane task — add to quarterly landscape review.
