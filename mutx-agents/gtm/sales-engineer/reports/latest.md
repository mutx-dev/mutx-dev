# Sales Engineer Brief

## Lane utility verdict
Status: STRONG
Recommendation: KEEP

## What changed in truth
- The buyer-facing story is now tighter around the actual surface split: `app.mutx.dev/dashboard` is the supported operator shell, while `app.mutx.dev/control` stays preview.
- Governance is being framed correctly as CLI-first proof, not as a finished dashboard approval UX.
- The SDK caveat is now explicit: `MutxAsyncClient` is deprecated and limited, and `MutxClient` is the production recommendation.
- No new product capability landed in this pass; the useful change was truth alignment and sharper proof packaging.

## Exact evidence
- Read `BOOTSTRAP.md`, `reports/roundtable.md`, and `gtm/outside-in-intelligence/reports/signal-brief.md` before drafting.
- Checked `docs/surfaces.md:18-19, 76-97, 121-145` for the supported vs preview split and governance maturity.
- Checked `docs/overview.md:46-58, 80-90` for the canonical dashboard / control-demo distinction.
- Checked `docs/governance.md:7-11, 17-42, 163-179` for Faramesh runtime behavior and Prometheus metrics.
- Checked `docs/project-status.md:12-19, 53-57` for current capability gaps and SDK truth.
- Checked `sdk/README.md:21-28` for the `MutxAsyncClient` deprecation language.
- Changed `sales-brief.md:16-101` to harden the proof matrix, governance boundary, and demo spine.
- Changed `queue/TODAY.md:3-6` to make the next moves specific to supported dashboard, preview control, governance proof, and SDK truth.
- Commands used for fresh truth pass: `rg -n "#117|#114|#39|MutxAsyncClient|dashboard|governance|runtime inspect openclaw|app.mutx.dev/dashboard|preview" ...` and `nl -ba ... | sed -n ...`.

## If idle or blocked, why exactly
- Not blocked.
- The real constraint is not capability discovery; it is keeping the buyer story ahead of the remaining UI/runtime parity gaps so we do not over-promise dashboard or governance coverage.

## What Fortune can do with this today
- Use the revised brief in a buyer call or POC prep and state the truth boundary up front: supported `/dashboard`, preview `/control/*`, and CLI-first governance proof.

## What should change in this lane next
- Turn this proof matrix into a 1-page talk track with exact commands, screenshots, and fallback branches so the next demo is repeatable under pressure.
