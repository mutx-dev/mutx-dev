# EVENT_MODEL

## Event families

### Academy events
- account.created
- lesson.started
- lesson.completed
- xp.awarded
- badge.unlocked
- track.progressed
- workspace.updated

### Progress events
- milestone.first_tutorial_started
- milestone.first_agent_run
- milestone.successful_deployment
- milestone.first_skill_added
- milestone.first_workflow_built
- milestone.first_monitoring_event_seen
- milestone.first_alert_configured
- milestone.first_approval_gate_enabled
- milestone.project_shared

### Autopilot events
- run.observed
- budget.updated
- alert.channel_changed
- alert.opened
- alert.resolved
- approval.gate_toggled
- approval.requested
- approval.approved
- approval.denied
- audit.exported

### Support and community events
- tutor.question_used
- support.office_hours_registered
- support.escalated
- community.project_shared

## Current storage model
- Source of truth for progress: browser-local state (`pico.progress.v1`)
- Auth sync lane: `app/api/pico/progress` proxying to `/v1/pico/progress`
- Live autopilot signals: existing MUTX runs, budgets, alerts, and Pico approval routes
- Approval queue: existing Pico approvals bridge, currently backed by the shared in-memory approvals service

## XP model
- account created: 25
- first tutorial started: 15
- lesson completion bonus: 10
- first agent run: 25
- successful deployment: 35
- first skill added: 35
- first workflow built: 40
- first monitoring event seen: 20
- first alert configured: 20
- first approval gate enabled: 25
- project shared: 30
- helpful community response: reserved for future community loops

Lesson XP is added on top of milestone XP.

## Unlock model
- Lessons unlock linearly in the shipped beta sequence.
- Levels advance when the previous level's lessons are completed.
- Tracks show progress based on completed lesson count.
- Plan features gate tutor usage, webhook alerts, retention, and approval capacity.

## Alert model
Open alerts today:
- Budget warning at 80% of monthly budget
- Budget cap crossed at 100% of monthly budget

Future alerts to add:
- Stale runtime / no activity
- Failure streak
- Missing approval response SLA

## Approval model
- One default risky-action queue exists in beta.
- Approval requests include action, reason, created time, status, and resolved time.
- Approve/deny actions append audit events.
- Hard external enforcement is not shipped yet; this is a control rehearsal layer until live connectors land.

## Deeper integration points still open
- richer runtime snapshot -> `/api/dashboard/runtime/providers/[provider]`
- deeper observability drill-down -> `/api/dashboard/observability`
- monitoring alert expansion -> `/api/dashboard/monitoring/alerts`
- usage-event enrichment -> `/api/dashboard/usage/events`
