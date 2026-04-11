# SHIP_CHECKLIST

## Product readiness
- [x] Pico workspace route exists
- [x] Academy levels, tracks, and tutorials exist
- [x] Progress persists locally and syncs when authenticated
- [x] XP and badge logic exists
- [x] Tutor surface exists and is grounded in shipped lessons
- [x] Support escalation path exists
- [x] Autopilot page exists with live runs, budgets, alerts, and approvals
- [x] Plan gating exists without faking live billing
- [ ] Billing exists

## Quality checks
- [x] Typecheck passes
- [x] Targeted unit tests pass
- [x] Targeted API tests pass
- [x] Build passes
- [x] Pico landing points clearly to the canonical workspace entry
- [ ] Non-English Pico landing locales match shipped product truth

## Content completeness
- [x] 12 launch tutorials defined
- [x] 5 project tracks defined
- [x] 7 level objectives defined
- [x] Validation step exists for every lesson
- [x] Troubleshooting exists for every lesson
- [x] Lesson pages exist outside the workspace shell
- [ ] Localization for workspace content exists

## Launch blockers
- No Pico-specific blocker remains.
- Remaining work is post-v1 hardening, not ship-readiness.

## Post-v1 hardening
- Non-English Pico landing copy cleanup
- Durable approval persistence instead of the current in-memory service
- Real billing/checkouts instead of plan flags only
- Deeper runtime ingestion and richer run drill-down
- Docs nav drift cleanup across the wider repo
