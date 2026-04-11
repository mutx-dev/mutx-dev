# DECISIONS

## 2026-04-11 - Create mandatory Pico operating docs immediately
Status: accepted

Context
The product work had already started in code, but the required operating docs did not exist in the repo. That is how product reality drifts into folklore.

Decision
Create `PRODUCT_STATE.md`, `EXECUTION_PLAN.md`, `PRD_PICOMUTX.md`, `CONTENT_MAP.md`, `EVENT_MODEL.md`, and `SHIP_CHECKLIST.md` immediately from source truth.

Why
The user explicitly required these files. More importantly, the repo already had enough Pico surface area that continuing without state docs would increase confusion fast.

Consequence
Future Pico work should update these docs in the same cycle as product changes.

## 2026-04-11 - Prioritize approval gate bootstrap over more academy polish
Status: accepted

Context
Pico already has a real academy shell, lesson corpus, progress model, tutor, support shell, and honest autopilot read surfaces. The main truth gap is that approval-gate setup is described in the academy but not yet wired end-to-end in the product.

Decision
Make approval gate bootstrap the next implementation slice.

Why
It closes the biggest trust gap while reusing already-existing approval API routes and progress state.

Consequence
Community polish, billing polish, and extra academy chrome stay deprioritized until the control loop is real.

## 2026-04-11 - Keep Pico narrow and execution-first
Status: accepted

Context
The codebase already trends toward a useful narrow loop: onboarding, lessons, tutor, support, and autopilot.

Decision
Do not widen Pico into a generic AI academy or community product.

Why
The differentiator is not breadth. It is getting one agent working and governed without fake abstractions.

Consequence
Every new Pico feature should answer one question: does this get the user to a trusted production agent faster?

## 2026-04-11 - Candidate deletion: `lib/pico/autopilot.ts`
Status: proposed

Context
Live autopilot helper logic appears to live in `components/pico/picoAutopilot.ts`, while `lib/pico/autopilot.ts` looks like duplicate shadow truth.

Decision
Delete `lib/pico/autopilot.ts` if import search confirms it is unused after the next slice lands.

Why
Duplicate helper layers are drift magnets.

Consequence
If deleted, tests and imports must point only at the real helper surface.

## 2026-04-11 - Collapse Pico vocabulary onto one obvious set of words
Status: accepted

Context
The active Pico UI was carrying duplicate or fuzzy concepts: `lane`, `track`, `workspace`, `support lane`, and numbered nav labels.

Decision
Use one obvious vocabulary across the product:
- `track`
- `Start`
- `Lessons`
- `Tutor`
- `Autopilot`
- `Human help`

Why
Obvious products reuse the same words until they stick. Powerful-sounding synonym soup just makes the product feel vague.

Consequence
If a future Pico change introduces a new noun for an existing concept, treat that as a bug.

## 2026-04-11 - Collapse support overlap into tutor plus human help
Status: accepted

Context
The support surface had become a junk drawer: escalation, office hours, release notes, showcase patterns, and support framing all lived together.

Decision
Keep two help concepts only:
- Tutor for grounded in-product guidance
- Human help for escalation when the product path is not enough

Why
Fewer help modes means faster user decisions and less fake complexity.

Consequence
Release notes, showcase cards, and extra support sub-modes should stay off the primary support surface unless they directly help unblock the user.
