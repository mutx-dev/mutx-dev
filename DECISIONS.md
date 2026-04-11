# DECISIONS

## 2026-04-10T23:27:50Z - Scope cut: build the narrow honest loop first
Status: accepted

Context
The repo already contains many operator surfaces, but Pico itself stops at a landing page.

Decision
Ship a narrow Pico loop first: auth, academy, progress, grounded support, and control page.

Why
That is the shortest route from vision to usable software.

## 2026-04-10T23:27:50Z - Reuse UserSetting for Pico state
Status: accepted

Context
There is no academy schema, but user-scoped JSON state already exists for onboarding/runtime.

Decision
Persist Pico learner state in UserSetting records instead of adding new tables or migrations.

Why
It ships faster, reuses proven patterns, and avoids schema churn for a v1 product that still needs shape validation.

## 2026-04-10T23:27:50Z - Do not build on preview shells
Status: accepted

Context
/control and several dashboard routes are demo or integration-pending surfaces.

Decision
Pico only relies on routes and APIs that are already real or were made real in this cycle.

Why
Shipping fiction is how products rot before launch.

## 2026-04-10T23:27:50Z - Tutor v1 must be grounded before it is clever
Status: accepted

Context
The repo has no trustworthy tutor API today.

Decision
Start with a grounded lesson-aware support layer and only add model-backed reasoning when the retrieval and safety path are real.

Why
Exact steps beat fake intelligence.

## 2026-04-11T00:55:00Z - Match the academy corpus to the requested level and track structure
Status: accepted

Context
An initial frontend draft shipped a curriculum shape that did not match the required Levels 0-6 and Tracks A-E.

Decision
Rewrite the lesson corpus so the product uses the exact required 12 tutorials, 7 levels, and 5 tracks.

Why
If the core academy shape drifts now, every later system will calcify around the wrong structure.

## 2026-04-11T00:47:28Z - Canonical Pico reconciliation
Status: accepted

Context
Pico had started accumulating parallel academy/progression/service files with overlapping responsibility.

Decision
Collapse the lesson/progression model into lib/pico/academy.ts, move tutor matching into lib/pico/tutor.ts, and rename backend persistence to src/api/services/pico_progress.py. Delete the replaced shadow files.

Why
One Pico truth is cheaper to maintain, harder to misread, and much less likely to drift into contradictory product behavior.

## 2026-04-11 02:51:05Z
Decision: Pico changes must extend the canonical system only.
Why:
- No new state schemas.
- No new API routes unless extending the existing Pico routes.
- No new entry routes.
- Tutor response shape stays frozen; behavior can improve without breaking the envelope.
- Extend, never fork.
