---
description: Provenance ledger and process for direct open-source adaptations in MUTX.
---

# OSS attribution ledger

This ledger records direct or material reuse of external code, schemas,
documentation, prompts, or UI structures. Loose inspiration belongs in design
documentation instead. Immutable links, audited upstream versions, license
facts, and machine-validated local paths are maintained in
[`oss-attribution-evidence.json`](https://raw.githubusercontent.com/mutx-dev/mutx-dev/main/docs/legal/oss-attribution-evidence.json).

## Required process

When a direct adaptation lands:

1. Update the project in `CREDITS.md`.
2. Add or update its evidence object in
   `docs/legal/oss-attribution-evidence.json` with immutable source and license
   URLs, an exact upstream ref, and every affected local path.
3. Append a row here with the evidence ID and the local port commit.
4. Preserve all copyright and license notices required by the upstream license.
5. For Apache-2.0 sources, retain the Apache-2.0 text and any upstream `NOTICE`
   material in the distribution. Record explicitly when the audited ref has no
   `NOTICE` file.
6. For MPL-2.0 sources, retain the MPL-2.0 text and satisfy file-level source and
   modification-notice obligations for any Covered Software that is distributed.
7. Keep provenance and code in the same pull request whenever possible.

## Recorded adaptations

| Ledger ID | Date | Evidence ID | Upstream provenance | MUTX scope | Reuse mode | Local port commit |
| --- | --- | --- | --- | --- | --- | --- |
| `agent-run-2026-03-25-01` | 2026-03-25 | `agent-run` | Schema family under [`builderz-labs/agent-run@9c7c3fa`](https://github.com/builderz-labs/agent-run/tree/9c7c3fa68413de878fae2d605c90fb334a0201f6/schemas) | `src/api/models/observability.py`, `src/api/models/observability_models.py`, `src/api/routes/observability.py`, `sdk/mutx/observability.py` | Material schema and vocabulary adaptation | `67d0904972d5a3ddcb27844b5b85b2dc4b37d6f2` |
| `mc-2026-04-04-01` | 2026-04-04 | `mission-control` | [`briefing-bar-widget.tsx`](https://github.com/builderz-labs/mission-control/blob/eb7c35e950b83f73d6fd61e89f7d4b377db2ad50/src/components/dashboard/widgets/briefing-bar-widget.tsx) and [`widget-primitives.tsx`](https://github.com/builderz-labs/mission-control/blob/eb7c35e950b83f73d6fd61e89f7d4b377db2ad50/src/components/dashboard/widget-primitives.tsx) at `eb7c35e950b83f73d6fd61e89f7d4b377db2ad50` | `components/dashboard/DashboardOverviewPageClient.tsx`, `components/dashboard/livePrimitives.tsx` | Adapted briefing-bar and signal-display structure | `972ab49b0af83d15042b2301679246103cbdbab6` |
| `predict-rlm-2026-04-13-01` | 2026-04-13 | `predict-rlm` | `Trampoline-AI/predict-rlm@5c7387afa1980b62b21a34ad0261256a95d8caa1` | Document engine, job, route, worker, CLI, dashboard, and operator-documentation paths listed in the evidence file | Adapted workflow contracts and example families with MUTX-specific lifecycle and observability | `7cde8ce0890cbb07c36d93c941e487986e56ea38` |

## Candidates and unresolved identities

| Evidence ID | State | Rule |
| --- | --- | --- |
| `guild-ai` | Apache-2.0 candidate; no direct reuse recorded | A future port must pin an exact source ref, retain the Apache-2.0 text, and carry forward any `NOTICE` material present at that ref. |
| `lacp` | Project identity and license unresolved; no direct reuse recorded | Do not port or make a license claim until the canonical owner, repository URL, exact ref, and license are established. |

An empty candidate row is not evidence of reuse. It is a guardrail that prevents
an unattributed port from landing later.
