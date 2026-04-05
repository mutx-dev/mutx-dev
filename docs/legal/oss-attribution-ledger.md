---
description: Ledger and process for direct open-source feature ports into MUTX.
---

# OSS Attribution Ledger

This ledger exists for direct reuse from external projects. The goal is to keep provenance obvious when code, schemas, prompts, docs, or UI flows are ported or materially adapted into MUTX.

Use this ledger for direct reuse from:

- Mission Control (`MIT`)
- LACP (`MIT`)
- Guild AI (`Apache-2.0`)

Do not use this ledger for loose inspiration. If MUTX only borrows an idea, product direction, or naming pattern, document that elsewhere instead of calling it a port.

## Required Process

When a direct port lands:

1. Add or update the relevant project entry in `CREDITS.md`.
2. Append a row here with the upstream project, license, upstream repo/ref, MUTX files, and a short summary of what was reused.
3. Keep the upstream copyright and license notice intact anywhere the upstream license requires it.
4. For Apache-2.0 sources, carry forward any upstream `NOTICE` material when the upstream project provides it.
5. Prefer one PR to carry both the code change and the attribution update so provenance does not drift.

## Ledger

| Ledger ID | Date | Upstream | License | Upstream ref | MUTX scope | Reuse mode | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mc-2026-04-04-01` | 2026-04-04 | Mission Control | MIT | `builderz-labs/mission-control` family; repo evidence in `UI-PORT-PLAN.md` and commit `972ab49b0af83d15042b2301679246103cbdbab6` | `components/dashboard/DashboardOverviewPageClient.tsx`, `components/dashboard/livePrimitives.tsx` | Adapted dashboard orchestration patterns | Existing repo history already records direct Mission Control reuse; this ledger entry makes that provenance durable in the legal docs. |
| `lacp-pending` | 2026-04-04 | LACP | MIT | Record the exact upstream repo URL and commit/tag when the first direct port lands | None recorded yet | No direct reuse recorded yet | Keep LACP on this ledger so any future direct feature port ships with provenance on day one. |
| `guild-ai-pending` | 2026-04-04 | Guild AI | Apache-2.0 | Record the exact upstream repo URL and commit/tag when the first direct port lands | None recorded yet | No direct reuse recorded yet | If Guild AI code or docs are ported later, also capture any required Apache-2.0 `NOTICE` material here and in the distribution path. |
