# MUTX landing page redesign recommendation

Scope: redesign everything below the existing top hero. Keep the hero animation and overall visual quality, but replace the current below-the-fold narrative with a concrete, non-expert-friendly story built around demos, examples, product proof, and honest product framing.

## Core diagnosis

The current page below the hero feels abstract because it leads with internal language and vibes instead of buyer understanding:

- it says "control plane", "specialist fleet", and "operator surface" before it proves why that matters
- it introduces fictional-sounding agent roles instead of recognizable use cases
- it uses attitude copy like "looks expensive because it should" and "serious stack for serious agents" instead of evidence
- it spends too much space on taxonomy and not enough on product behavior
- the stats are not meaningful proof for a non-expert visitor
- it makes the product feel more conceptual than usable

The replacement should answer, in order:

1. What is this, in plain English?
2. What problem does it solve in the real world?
3. What does the product actually look like?
4. How would my team use it?
5. Why should I trust it?
6. What can I try right now?

## Recommended information architecture below the hero

### 1. Section: "See what MUTX actually does"
Purpose:
Turn curiosity from the hero into instant comprehension with a concrete product demo.

What to show:
- Large embedded `/public/demo.gif`
- Short annotation rail beside or below the GIF with 3 callouts pinned to visible moments in the interface:
  - Deploy an agent
  - Watch every run and tool call
  - Step in when a risky action needs approval

Recommended copy style:
- plain-English
- outcome-first
- no infrastructure jargon in the headline

Headline:
"Run AI agents with a dashboard your team can actually trust"

Body copy:
"MUTX gives you one place to deploy an agent, monitor what it does, and put guardrails around risky actions. Instead of hoping a prompt behaves, you get a visible operating layer around the agent."

Microcopy bullets:
- See runs, traces, budgets, and alerts in one place
- Approve, block, or review actions before they become incidents
- Use the Mac app, browser dashboard, CLI, or API depending on how your team works

Why this section should come first:
Visitors need immediate proof that this is a product with a UI and a workflow, not just an architecture thesis.

Assets:
- primary: `/public/demo.gif`
- optional supporting still: `/public/landing/webp/docs-surface.webp`

### 2. Section: "How MUTX works"
Purpose:
Explain the product in a dead-simple 3-step flow that non-experts can remember.

Layout:
Three horizontal steps with short looping videos.

Step 1:
Title: "Deploy the agent"
Video: `/public/marketing/carousel/pathway.mp4` or `/public/marketing/carousel/ecosystem.mp4`
Copy:
"Connect your model, tools, and runtime in one setup flow instead of stitching together separate dashboards and scripts."

Step 2:
Title: "Set guardrails"
Video: `/public/marketing/carousel/governance.mp4`
Copy:
"Define what the agent can do automatically, what should be blocked, and what should wait for human approval."

Step 3:
Title: "Review every run"
Video: `/public/marketing/carousel/runtime.mp4`
Copy:
"Track prompts, tool calls, outputs, costs, and exceptions so your team can debug behavior after the fact."

Recommended supporting line under the 3 steps:
"If your agent touches real systems, these three jobs matter more than the prompt."

Copy style notes:
- each step should sound like a product action, not a platform pillar
- avoid nouns like "governance layer" without a verb attached

### 3. Section: "Three real teams that would use this"
Purpose:
Replace the abstract specialist-agent gallery with recognizable business scenarios.

Layout:
3 scenario cards with short case-study framing. Each card has: problem, what MUTX does, what the team gets.

Card A: Customer support automation
Headline:
"A support bot that can answer fast without going off-script"
Problem:
"Your team wants AI to resolve tickets, but not issue credits, expose customer data, or improvise policy."
What MUTX does:
- route the bot through approval rules for refunds or sensitive actions
- log each run and tool call
- keep deployment and runtime history visible
Result:
"Support teams move faster without giving the bot unlimited authority."
Suggested media:
- `/public/marketing/briefs/receipts-not-rhetoric.webp`
- or `/public/marketing/carousel/governance.mp4`

Card B: Internal ops / DevOps assistant
Headline:
"An infrastructure agent that helps on-call without becoming a second outage"
Problem:
"You want AI to investigate incidents, summarize failures, and suggest fixes, but not run destructive commands blindly."
What MUTX does:
- put high-risk actions behind approval
- preserve trace and run evidence for every action
- show alerts, budgets, and runtime state in one operator view
Result:
"The team gets faster diagnosis with human control at the edge."
Suggested media:
- `/public/marketing/briefs/deployable-systems.webp`
- or `/public/marketing/carousel/runtime.mp4`

Card C: Internal product or workflow agents
Headline:
"A team assistant that can connect to tools without turning into a black box"
Problem:
"You want an AI worker connected to internal tools, but finance and engineering still need visibility into what it accessed and why."
What MUTX does:
- separate credentials and policies from prompts
- make runs reviewable
- track cost and usage over time
Result:
"Teams can ship automation without losing auditability."
Suggested media:
- `/public/marketing/carousel/cost-awareness.mp4`
- or `/public/marketing/briefs/open-control-layer.webp`

Why this replaces the current agent section:
The current named specialist roster reads like fiction. Real buyers understand jobs-to-be-done, not "Incident Response Commander" as a marketing object.

### 4. Section: "Inside the product"
Purpose:
Give product proof through a demo carousel tied to real capabilities.

Layout:
Tabbed or carousel section with short title, one-sentence explanation, and media.

Tab 1: Runtime view
Media: `/public/marketing/carousel/runtime.mp4`
Copy:
"Watch live runs, inspect steps, and understand what happened without reconstructing the session from logs."

Tab 2: Governance and approvals
Media: `/public/marketing/carousel/governance.mp4`
Copy:
"Block dangerous actions, defer sensitive ones for human approval, and keep a record of the decision."

Tab 3: Managed layers
Media: `/public/marketing/carousel/managed-layers.mp4`
Copy:
"Keep policies, credentials, runtime wiring, and release state outside the prompt so the system stays maintainable."

Tab 4: Cost awareness
Media: `/public/marketing/carousel/cost-awareness.mp4`
Copy:
"Track spend and usage before your successful demo turns into an expensive workflow."

Tab 5: Ecosystem and integrations
Media: `/public/marketing/carousel/ecosystem.mp4`
Copy:
"Use MUTX across browser, desktop, CLI, and API surfaces instead of forcing every team into one interface."

This section should explicitly label what viewers are seeing:
- "Dashboard"
- "Policy and approval flow"
- "Cost tracking"
- "Desktop and developer surfaces"

That keeps the section educational, not ornamental.

### 5. Section: "Before MUTX / After MUTX"
Purpose:
Make the value proposition immediately legible with contrast.

Layout:
Two-column comparison with 4 rows.

Before MUTX:
- Agent logic mixed with secrets and policy
- Limited visibility into why something happened
- High-risk actions rely on prompt wording
- Cost and runtime drift discovered late

After MUTX:
- Policies and credentials managed outside prompts
- Runs and tool calls are visible and reviewable
- Sensitive actions can be blocked or approved
- Usage, budgets, and runtime health are visible in one place

Recommended headline:
"What changes when you stop treating agents like chatbots"

Body copy:
"Most teams can prototype an agent. The hard part is operating one once it touches customers, internal tools, money, or production systems. MUTX is the layer that makes that operation visible and controllable."

Suggested still:
- `/public/landing/webp/wiring-bay.webp` or `/public/landing/webp/running-agent.webp`

### 6. Section: "Choose your path"
Purpose:
Segment developers from enterprise buyers without splitting the narrative too early.

Layout:
Two large cards with motion media.

Card 1: For developers
Media: `/public/marketing/cards/developer.mp4`
Headline:
"Start locally, inspect everything, then ship"
Bullets:
- CLI and API for technical teams
- Mac app and browser dashboard for visual workflows
- quickstart path for proving the setup fast
CTA:
"Read the docs"
Secondary CTA:
"View GitHub"

Card 2: For enterprise teams
Media: `/public/marketing/cards/enterprise.mp4`
Headline:
"Give teams an agent operating layer with real controls"
Bullets:
- approval-based actions for risky workflows
- cost visibility and runtime review
- honest separation between supported and preview surfaces
CTA:
"Talk to us"
Secondary CTA:
"See release posture"

This section should not use generic personas like "builders" and "leaders". It should tie each lane to an actual starting motion.

### 7. Section: "What ships today"
Purpose:
Build trust by being explicit about supported surfaces instead of pretending everything is equally mature.

Layout:
Simple supported/preview matrix.

Recommended rows:
- Marketing site — supported
- Release summary — supported
- Mac desktop download — supported
- Docs — supported
- Browser dashboard for stable routes — supported
- Control demo — preview
- Some governance workflows — CLI-first / preview UI

Recommended headline:
"Honest product status"

Body copy:
"MUTX is strongest when it is explicit about what is production-ready today and what is still moving. That honesty is part of the product."

Source basis from repo:
- `docs/surfaces.md`
- `docs/app-dashboard.md`

Why this matters:
For this audience, candor converts better than inflated certainty.

### 8. Section: final CTA
Purpose:
Close with a clear next action matched to the strongest current entry point.

Recommended structure:
- keep `/public/demo.gif` or a smaller product preview on one side
- clear CTA stack on the other

Headline:
"Try the product, not just the pitch"

Body copy:
"Start with the signed Mac app if you want the fastest product tour. Use docs and GitHub if you want to evaluate the stack in depth."

Primary CTA:
"Download for Mac"

Secondary CTAs:
- "Read docs"
- "View GitHub"
- "See releases"

## Recommended copy principles for the entire below-the-fold page

### Use this tone
- concrete
- plainspoken
- product-led
- slightly technical, but understandable to an ops leader or PM
- confident without posturing

### Avoid this tone
- cinematic macho phrasing
- manifesto language
- insider shorthand without explanation
- fake-hardcore lines meant to sound expensive or elite
- unexplained architecture nouns

### Preferred sentence pattern
Use:
- problem → action → result
- example → feature → business value

Example:
"If an agent can issue refunds or touch production systems, teams need approval rules and a record of every action. MUTX gives them both."

Not:
"A governed runtime surface for specialist operator workflows."

## What to cut from the current page

Cut entirely:
- the agent marquee
- the "specialist fleet" framing
- the featured fictional agent panel
- the current stat pills (`8`, `1`, `0`)
- "serious stack for serious agents"
- "looks expensive because it should"
- the current abstract feature-card language

Rewrite heavily if retained in any form:
- "control plane" copy should appear only after a concrete explanation
- "governance" should usually be explained as approvals, guardrails, and policy rules
- "runtime surface" should usually be explained as seeing runs, tool calls, costs, and failures

## Suggested page order summary

1. Hero stays as-is
2. See what MUTX actually does
3. How MUTX works in 3 steps
4. Three real teams that would use this
5. Inside the product carousel
6. Before MUTX / After MUTX comparison
7. Choose your path: developers vs enterprise
8. Honest product status
9. Final CTA

## Why this structure should convert better

- it explains the product before naming the architecture category
- it swaps abstract identity language for recognizable use cases
- it uses existing media assets as proof, not decoration
- it gives enterprise buyers trust signals without sounding corporate
- it preserves technical credibility while making the product legible to non-experts
- it ends with honest next steps based on what exists today

## Implementation note

If this recommendation is turned into code, the existing below-hero sections in `components/site/marketing/MarketingHomePage.tsx` should be replaced rather than lightly edited. The current structure is built around abstract content objects in `lib/marketingContent.ts`; the new version should instead be modeled around:

- demos
- use-case cards
- proof/comparison rows
- supported-vs-preview trust section
- segmented CTA cards

That content model will make future homepage edits much easier and much less likely to drift back into vague marketing language.
