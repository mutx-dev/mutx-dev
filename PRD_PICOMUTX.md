# PRD_PICOMUTX

## Product statement
PicoMUTX is the fastest path from zero to a production agent you trust.

It is not a blog.
It is not a fake academy.
It is not a dashboard pretending to have data.

It is one tight loop:
learn -> build -> operate -> control -> ship

## v1 scope
The first honest version of PicoMUTX ships these modules:
1. Academy core
2. Gamification system
3. Project tracks
4. Grounded tutor
5. Lightweight support shell
6. Manual-first autopilot dashboard
7. Persistent user progress
8. Internal content ops docs
9. Plan gating stubs
10. Internal ship docs and decision log

## Primary user
- Technical founder
- Indie hacker
- Operator with some technical comfort
- Developer who already tried to build an agent and learned the hard way that demos are cheap

## Problem
Most agent products stop at “you built something.”
The failure starts right after that:
- no reliable deployment
- no runtime visibility
- no cost control
- no approval path for risky actions
- no support when the first real run breaks

## Promise
Build one useful agent.
Run it.
See what it did.
Control risky behavior.
Stop babysitting blindly.

## Product shape
### Academy
Seven levels:
- Level 0 Setup
- Level 1 Deployment
- Level 2 Capability
- Level 3 Automation
- Level 4 Production
- Level 5 Control
- Level 6 Systems

Each level includes:
- clear objective
- prerequisites
- project outcome
- completion state
- XP reward
- badge
- recommended next step

### Project tracks
- Track A First Agent
- Track B Deployed Agent
- Track C Useful Workflow
- Track D Controlled Agent
- Track E Production Pattern

### Initial tutorial set
1. Install Hermes locally
2. Run your first agent
3. Deploy Hermes on a VPS
4. Keep your agent alive between sessions
5. Connect a messaging or interface layer
6. Add your first skill or tool
7. Create a scheduled workflow
8. See your agent activity
9. Set a cost threshold
10. Add an approval gate
11. Build a lead-response agent
12. Build a document-processing agent

Each lesson must end in a real artifact.

## Gamification
Shipped in v1:
- XP
- badges
- level progression
- track completion
- milestone events
- visible progress

## Tutor
v1 tutor requirements:
- grounded in the lesson corpus
- exact next-step answers over generic advice
- recommends specific lessons
- escalates billing/legal/security/destructive topics to a human
- never invents unsupported capabilities

## Support shell
Minimum viable support infrastructure:
- tutor lane
- human escalation lane
- office hours registration
- project share action
- release-note view for what the beta really ships

## Autopilot beta
v1 autopilot is manual-first by design.
That means:
- users log real runs manually while live connectors are not wired yet
- cost usage is tracked from those run entries
- alerts trigger when thresholds are crossed
- approval queue is real and exportable
- audit trail is append-only within the workspace state

Shipped surfaces:
- recent activity timeline
- monthly usage vs budget
- email/webhook alert toggles
- default risky-action approval gate
- pending approvals list
- export audit JSON

Not yet shipped:
- automatic runtime ingestion
- cross-device sync
- external alert delivery execution
- live agent pause/deny enforcement outside the workspace

## Plan model
Billing is not wired yet. Internal flags are.

Free:
- academy access
- limited tutor usage
- read-only autopilot exposure

Starter:
- 1 monitored agent
- email alerts
- 7-day retention
- 1 approval gate

Pro:
- 5 monitored agents
- email + webhook alerts
- 30-day retention
- 5 approval gates

## Technical strategy
- Keep Pico isolated under `app/pico/*`
- Reuse existing MUTX stack only where it is real, not where it is theater
- Use browser persistence first to avoid auth friction blocking v1
- Use existing dashboard/backend routes later for sync once the Pico surface is stable
- Treat current backend approvals/policies as untrusted until rebuilt or unified

## Definition of done for this beta slice
A user can:
1. Enter the Pico workspace
2. Define a workspace and agent profile
3. Start and complete lessons with persistent progress
4. Earn XP and badges
5. Ask the tutor for grounded help
6. Log real runs manually
7. See activity, usage, alerts, and approvals
8. Export the audit trail
9. Escalate to a human when the issue is risky
10. Understand what is beta and what is not
