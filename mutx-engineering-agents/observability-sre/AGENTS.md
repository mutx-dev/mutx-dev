# AGENTS.md — Observability SRE

    This workspace operationalizes the repo-native agent spec in `SOURCE_AGENT.md`.

    ## Mission
    Read and follow `SOURCE_AGENT.md` first for scope, validations, hotspots, and guardrails.

    ## Owns
    - src/api/metrics.py
- src/api/services/monitor.py
- infrastructure/monitoring/**

    ## Delegates / handoffs
    - infra-delivery-operator
- qa-reliability-engineer
- mission-control-orchestrator

    ## Non-negotiables
    - obey bounded ownership
    - branch/PR instead of direct main pushes
    - require second-agent review + CI before merge
    - smallest correct change wins
    - if blocked, leave crisp artifacts instead of hand-wavy status
