# PRODUCT_STATE

## Current truth
- Timestamp: 2026-04-11T02:01:00Z
- Product: PicoMUTX
- Mission: get a user from zero to one production agent they trust.
- Current emphasis: activation first, trust second, breadth last.

## What exists
- Public Pico landing at `app/pico/page.tsx`.
- Start flow at `app/pico/onboarding/page.tsx`.
- Academy flow at `app/pico/academy/*` backed by `lib/pico/academy.ts`.
- Tutor at `app/pico/tutor/page.tsx` backed by `lib/pico/tutor.ts`.
- Human help at `app/pico/support/page.tsx`.
- Autopilot at `app/pico/autopilot/page.tsx` backed by real MUTX signals.
- Progress persistence through:
  - `components/pico/usePicoProgress.ts`
  - `app/api/pico/progress/route.ts`
  - `src/api/routes/pico.py`
  - `src/api/services/pico_progress.py`

## What changed in the latest cycle
- Activation flow now pushes one obvious path: install Hermes -> run first prompt -> keep proof.
- Support complexity was cut down to one concept: tutor for grounded help, human help for messy cases.
- Terminology is tighter:
  - `track` is the concept
  - `lane` is gone from the active Pico UI
  - `Start building` replaces `Open workspace` on the landing CTA
- Navigation is simpler:
  - Start
  - Lessons
  - Tutor
  - Autopilot
  - Human help

## What was removed or merged
- Removed numbered nav theater from the main Pico shell.
- Removed release notes and showcase-pattern clutter from the support surface.
- Removed office-hours branching as a separate visible support concept.
- Removed the extra tutor docs/help card because it duplicated lesson links and escalation links.
- Merged support language around one term: `Human help`.

## What is now clearer
- Start = where to begin
- Lessons = what to do next
- Tutor = get unstuck inside the product path
- Human help = escalate when the product path is not enough
- Autopilot = inspect runs, alerts, costs, and approvals

## What is still messy
- The broader `/dashboard/*` surfaces are still not trustworthy enough to serve as Pico's main drill-down destinations.
- Some dirty tree changes still exist outside this simplification slice:
  - `components/pico/PicoShell.tsx`
  - `components/pico/PicoSupportPageClient.tsx`
  - `components/pico/PicoTutorPageClient.tsx`
- The product is simpler now, but the remaining rule is strict: if a concept cannot justify its own surface, it should become copy, not UI.

## Ship-now assessment
- Honest status: Pico now feels more obvious than powerful.
- Biggest improvement: fewer nouns, fewer branches, fewer fake choices.
- Remaining risk: the repo still contains non-Pico surface drift that can make the whole system feel broader and messier than the actual Pico product.

## Ship next
1. Browser-smoke the simplified tutor and human-help flows.
2. Keep deleting duplicate concepts as they appear.
3. Do not add another product noun unless the current five surfaces cannot carry the job.

## Cycle log
### 2026-04-11T04:00:00Z START
- Audited canonical Pico UI for duplicate concepts, overlapping support features, unnecessary chrome, and confusing terminology.
- Picked the simplification targets with the highest clarity gain: nav, start CTA, track terminology, tutor/support overlap, and support-page clutter.

### 2026-04-11T04:01:00Z END
- Simplified Pico language and surface structure without reducing core capability.
- Validated with `npm run typecheck`, `npm test -- tests/unit/picoAcademy.test.ts tests/unit/picoTutor.test.ts`, and `npm run build`.
- Next move: keep pruning concepts until the UI reads like a product, not a platform brochure.
