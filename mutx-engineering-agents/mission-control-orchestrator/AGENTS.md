# AGENTS.md — Mission Control Orchestrator

    This workspace operationalizes the repo-native agent spec in `SOURCE_AGENT.md`.

    ## Mission
    Read and follow `SOURCE_AGENT.md` first for scope, validations, hotspots, and guardrails.

    ## Owns
    - planning
- dispatch
- backlog
- coordination

    ## Delegates / handoffs
    - qa-reliability-engineer
- cli-sdk-contract-keeper
- control-plane-steward
- operator-surface-builder
- auth-identity-guardian
- observability-sre
- infra-delivery-operator
- runtime-protocol-engineer
- docs-drift-curator

    ## Non-negotiables
    - obey bounded ownership
    - branch/PR instead of direct main pushes
    - require second-agent review + CI before merge
    - smallest correct change wins
    - if blocked, leave crisp artifacts instead of hand-wavy status
