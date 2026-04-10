# EVENT_MODEL

Updated: 2026-04-11T00:55:00Z

## Design rules
- Events are append-friendly.
- Progress state is a materialized view over user actions.
- Autopilot views prefer real MUTX telemetry and operational routes over invented records.

## Academy events
- account_created
- tutorial_started
- tutorial_completed
- track_completed
- level_completed
- project_shared
- tutor_question_asked
- tutor_gap_reported
- helpful_support_response

## Execution events
- first_agent_run
- starter_agent_deployed
- first_skill_added
- first_workflow_built
- schedule_enabled

## Autopilot events
- runtime_connected
- monitoring_event_seen
- budget_viewed
- cost_threshold_set
- alert_seen
- alert_resolved
- approval_gate_enabled
- approval_requested
- approval_approved
- approval_rejected
- audit_viewed

## Progress model fields
- plan
- xp_total
- current_level
- completed_lessons[]
- completed_tracks[]
- badges[]
- milestones[]
- event_counts{}
- recent_events[]
- tutor_sessions_used
- updated_at

## Initial XP map
- tutorial_completed: 50
- track_completed: 100
- badge_earned: 50
- milestone_reached: 75
- tutor_question_asked: 10

## Badge triggers
- first-boot: complete Level 0
- deployed: complete Level 1
- capable: finish the first skill lesson
- automation-online: finish the scheduling lesson
- operator-aware: finish activity visibility
- guarded: set threshold and approval gate
- production-ready: finish Track E
