# EVENT_MODEL

Canonical sources:
- `lib/pico/academy.ts`
- `components/pico/usePicoProgress.ts`
- `src/api/routes/pico.py`
- `src/api/services/pico_progress.py`

## Event families

### Academy and progress events
Canonical milestone event ids:
- `account_created`
- `first_tutorial_started`
- `first_tutorial_completed`
- `first_agent_run`
- `successful_deployment`
- `first_skill_added`
- `first_workflow_built`
- `first_monitoring_event_seen`
- `first_alert_configured`
- `first_approval_gate_enabled`
- `project_shared`
- `helpful_community_response`

Progress mutation surfaces:
- `lesson.started`
- `lesson.completed`
- `track.selected`
- `support.requested`
- `tutor.question_used`
- `project.shared`
- `autopilot.settings_updated`

Notes:
- `helpful_community_response` is defined in the XP table but is not actively emitted by the current UI.
- Lesson XP is owned per lesson in `lib/pico/academy.ts`; milestone XP is owned by `PICO_MILESTONE_XP` in the same file.

## Current persistence model
- Canonical persisted progress lives in backend user settings under key `pico.progress`.
- Canonical backend contract is `/v1/pico/progress` in `src/api/routes/pico.py`.
- Canonical backend normalization and merge logic lives in `src/api/services/pico_progress.py`.
- Browser local state key `pico.progress.v1` is a cache and offline fallback, not the source of truth.
- Next.js bridge route `app/api/pico/progress/route.ts` is a thin proxy to the backend contract.

## XP model
Milestone XP values from `lib/pico/academy.ts`:
- `account_created`: 20
- `first_tutorial_started`: 15
- `first_tutorial_completed`: 25
- `first_agent_run`: 40
- `successful_deployment`: 60
- `first_skill_added`: 50
- `first_workflow_built`: 70
- `first_monitoring_event_seen`: 45
- `first_alert_configured`: 45
- `first_approval_gate_enabled`: 60
- `project_shared`: 40
- `helpful_community_response`: 35

Lesson XP is additive and comes from each lesson definition in `PICO_LESSONS`.

## Unlock model
- Lessons unlock from the canonical lesson order and prerequisite graph in `lib/pico/academy.ts`.
- Tracks unlock from lesson completion and selected-track state.
- Derived progress, badges, next lesson, and unlocked tracks are computed by `derivePicoProgress()`.
- Plan gating is defined by `PICO_PLAN_MATRIX` in `lib/pico/academy.ts`.

## Autopilot events
Read surfaces used by Pico autopilot:
- runs from `/api/dashboard/runs`
- budgets from `/api/dashboard/budgets`
- alerts from `/api/dashboard/monitoring/alerts`
- approvals from `/api/pico/approvals`

Writable Pico autopilot events:
- `alert.threshold_configured`
- `alert.channel_changed`
- `budget.threshold_breached`
- `approval.gate_enabled`
- `approval.requested`
- `approval.approved`
- `approval.rejected`

## Alert model
Current alert settings stored in Pico progress:
- `costThresholdPercent`
- `alertChannel` (`in_app`, `email`, `webhook`)
- `lastThresholdBreachAt`

Current honest limitation:
- Alerts reuse existing MUTX signals and threshold tracking; they are not a fully separate alerting backend.

## Approval model
- Pico creates and resolves approvals through `app/api/pico/approvals/*`.
- Generic approval visibility is filtered to the active user by default.
- Approval ids are mirrored into Pico progress under `autopilot.approvalRequestIds`.
- Backing storage is still the shared in-memory approvals service, so approvals are visible and usable but not yet durable across restarts.

## Support and escalation events
- Tutor escalation points users to `/pico/support` when confidence is low or the topic is risky.
- Support requests increment Pico progress and route into the existing contact flow.
- Office-hours and showcase surfaces exist in the support lane, but deeper community automation is not yet a separate event backend.
