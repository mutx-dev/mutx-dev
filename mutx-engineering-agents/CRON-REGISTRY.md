# Engineering Fleet Cron Registry

## mission-control-orchestrator
- schedule: `5,25,45 * * * *`
- goal: Plan, dispatch, and reconcile the engineering fleet with branch/PR/review discipline.
- sessionTarget: `session:eng-mission-control-orchestrator`

## qa-reliability-engineer
- schedule: `12 */2 * * *`
- goal: Keep CI, targeted tests, PR gates, and shipping confidence honest.
- sessionTarget: `session:eng-qa-reliability-engineer`

## cli-sdk-contract-keeper
- schedule: `18 */2 * * *`
- goal: Keep API, CLI, and SDK behavior aligned and truthful.
- sessionTarget: `session:eng-cli-sdk-contract-keeper`

## control-plane-steward
- schedule: `24 */2 * * *`
- goal: Own core backend routes, services, and models without route drift.
- sessionTarget: `session:eng-control-plane-steward`

## operator-surface-builder
- schedule: `30 */2 * * *`
- goal: Keep operator-facing UI coherent, accurate, and aligned with backend truth.
- sessionTarget: `session:eng-operator-surface-builder`

## auth-identity-guardian
- schedule: `36 */4 * * *`
- goal: Protect auth, identity boundaries, and ownership semantics.
- sessionTarget: `session:eng-auth-identity-guardian`

## observability-sre
- schedule: `42 */2 * * *`
- goal: Keep metrics, readiness, logs, and monitoring claims trustworthy.
- sessionTarget: `session:eng-observability-sre`

## infra-delivery-operator
- schedule: `48 */4 * * *`
- goal: Own infrastructure, delivery, scripts, and deploy hygiene.
- sessionTarget: `session:eng-infra-delivery-operator`

## runtime-protocol-engineer
- schedule: `54 */2 * * *`
- goal: Keep agent runtime protocol behavior aligned between backend and SDK.
- sessionTarget: `session:eng-runtime-protocol-engineer`

## docs-drift-curator
- schedule: `0 */4 * * *`
- goal: Keep docs, examples, and contributor guidance honest with the codebase.
- sessionTarget: `session:eng-docs-drift-curator`
