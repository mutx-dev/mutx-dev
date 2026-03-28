# MUTX Context Registry

## Core shared context
- `/Users/fortune/.openclaw/workspace/mutx-agents/_shared/MUTX-CONTEXT.md`
- `/Users/fortune/.openclaw/workspace/mutx-agents/_shared/GUARDRAILS.md`
- `/Users/fortune/.openclaw/workspace/mutx-agents/_shared/ROUNDTABLE-LOOP.md`
- `/Users/fortune/.openclaw/workspace/mutx-agents/reports/roundtable.md`

## Fresh shared briefs
- Outside-in signal -> `/Users/fortune/.openclaw/workspace/mutx-agents/gtm/outside-in-intelligence/reports/signal-brief.md`
- Control synthesis -> `/Users/fortune/.openclaw/workspace/mutx-agents/control/project-shepherd/reports/latest.md`
- Engineering/control truth -> `/Users/fortune/.openclaw/workspace/mutx-engineering-agents/mission-control-orchestrator/reports/latest.md`
- Daily executive brief -> `/Users/fortune/.openclaw/workspace/mutx-agents/reporting/report-distribution-agent/reports/daily-brief.md`

## Read discipline
- GTM lanes pull the signal brief first.
- Product and build lanes pull the roundtable first, then engineering truth only when implementation details matter.
- Control lanes pull the roundtable plus engineering truth when trust/runtime state matters.
- Reporting reads the roundtable, signal brief, and freshest lane reports.
- Write in your own lane files unless your mission explicitly owns a shared file.
