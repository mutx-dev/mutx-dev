# PRD_PICOMUTX

Version: v1
Status: active
Updated: 2026-04-11T07:59:00Z

## Product statement
PicoMUTX is the fastest way to go from zero to a production agent you trust.

It combines:
- guided learning
- real agent execution
- operational visibility
- control hooks
- support when users get stuck

## V1 promise
A user can:
1. sign in
2. start a learning path
3. complete lessons with persistent progress
4. earn XP and badges
5. deploy a first agent from inside the product
6. see runs, alerts, and budget state
7. use an approval gate surface
8. get grounded help when blocked

## Primary user
- technical founder
- indie hacker
- operator with some technical comfort
- dev who already tried to build an agent and got stuck at deployment or operations

## Positioning
Public: Build one useful agent. Run it. See what it did. Put guardrails around it.
Internal: Pico is the front door and training ground. MUTX is the deeper control plane.

## Narrow v1 scope
### Included
- academy dashboard
- level and lesson system
- progress, XP, badges, milestones
- tracks for first agent, deployed agent, useful workflow, controlled agent, production pattern
- grounded tutor/support page
- control page using real MUTX data
- plan flags with soft gating

### Excluded from v1
- fake community platform
- broad framework support
- heavy social features
- real billing charges
- enterprise/team claims without underlying implementation
- preview/demo routes masquerading as product

## Core modules
1. Academy Core
2. Gamification System
3. Project Tracks
4. Tutor / Q&A
5. Support Shell
6. Autopilot Dashboard
7. User Progress State
8. Admin / Content Ops (internal-light in v1)
9. Plan Gating
10. Documentation / Internal Ops

## Success criteria
- Pico is no longer just a landing page.
- A signed-in user can complete a first lesson and have it persist.
- A signed-in user can open a real control page that reads live data.
- The product copy is direct and honest.
- The lesson corpus matches the required 12 tutorials.

## Technical strategy
- Use app/pico/* for Pico product routes.
- Extend the canonical Pico files only; do not create parallel state, route, or tutor systems.
- Use existing /api/auth, /api/dashboard, and Pico progress routes where they tell the truth.
- Keep learner state on the existing UserSetting-backed Pico progress model; no new state schemas.
- Do not add new entry routes or change the tutor response shape.
- Keep content as structured data in repo, not hidden in CMS glue.

## Progression rule
- XP must come only from real outcomes: known lesson completion with explicit proof, first deployment, first run proof, and the first alert threshold.
- Badges, milestones, and tracks are unlock signals, not extra XP faucets.
- Repeat actions can leave receipts, but they do not mint more XP.
