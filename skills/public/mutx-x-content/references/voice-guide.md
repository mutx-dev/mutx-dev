# MUTX X Voice Guide

## The Problem

Posts are too dev-coded. The audience for "agent infra" and "runtime control planes" includes buyers, operators, and technical decision-makers — not just engineers who ship.

## Voice Rules

### Do use
- Operational outcomes: "reduced MTTR", "incident surface area", "governance without overhead"
- Business frames: "enterprise deployment", "production-grade", "team-wide visibility"
- Procurement language: "compliance-ready", "audit trail", "policy enforcement"
- Controlled confidence: "designed for teams that run AI in production"
- Outcome-first: what the operator *gains* or *prevents*, not just what the system *does*

### Never use
- "real install", "actual bootstrap", "not just vibes" — dev-coded and undersell
- Technical framer than the audience needs
- Casual/informal syntax in place of precise language
- "too many agent products" — too negative/frustrated
- Generic "control plane" without explaining what it controls and for whom

## Enterprise Repositioning Examples

Instead of this:
> "too many agent products can generate output and still can't explain how to operate, inspect, or recover the system"

Say this:
> "AI agents in production create a new class of operational risk: decisions made without visibility, accountability, or a clear path to intervene. MUTX closes that gap."

Instead of this:
> "self-healing scripts look boring until something breaks at 3am"

Say this:
> "Production AI requires operational contracts that survive incidents. MUTX's self-healing layer means your team wakes up to context, not chaos."

Instead of this:
> "ownership checks on agent endpoints"

Say this:
> "Role-based enforcement across your agent fleet: who can deploy, who can intervene, who gets the audit log."

## Target Buyer Language by Topic

| Topic | Buyer language |
|---|---|
| Agent deployment | "production-grade agent orchestration" |
| Visibility | "full operational audit trail across every agent action" |
| Failures | "incident reconstruction and human override" |
| Governance | "policy enforcement and compliance-ready logging" |
| Team adoption | "your whole engineering org can operate AI without becoming AI experts" |
| Security | "agent boundaries without blocking velocity" |

## Formatting Rules
- Lead with what the operator gains or prevents
- One specific claim > three vague ones
- No hedging ("very", "quite", "basically")
- No developer framing ("CLI", "infra", "demo path") in the post itself — move it to replies or comments
- Posts should read like a product announcement a CTO or VP Eng would endorse, not a developer tool a hacker would bookmark

## What Works

- **Agreement + extension** as reply frame: validate the original point, then add the missing production layer
- "X vs Y" contrast format: creates memorable distinctions operators encounter regularly
- "They're the product" as closer: frames ops work as core product, not polish
- "The difference between X and Y" construction: strong for setup/quality positioning
- "Not flashy. Not novel. Just the difference between X and Y." construction: compact and credible

## What Fails

- Generic "control plane" framing without specifying what it controls and for whom
- Duplicate themes across posts in short succession
- Quote-RTs to low-follower accounts (wastes reach)
- Dev-coded phrasing that signals "builder tool" rather than "enterprise platform"
