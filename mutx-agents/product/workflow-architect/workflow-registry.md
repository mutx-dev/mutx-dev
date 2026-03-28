# Workflow Registry

## Canonical deployment workflow

**Purpose:** make the operator path for deployment create/observe/modify/retire unambiguous across API, CLI, SDK, dashboard, and docs.

### Canonical lifecycle
- `create` -> `pending` -> `running` / `ready`
- `scale`, `restart`, `logs`, `metrics`, `events` during active operation
- `stopped`, `failed`, `killed` as terminal or recoverable states depending on action
- `rollback` and `delete` as recovery/retirement actions

### Contract rule
- `POST /v1/deployments` is the canonical create path.
- `POST /v1/agents/{agent_id}/deploy` stays compatibility-only and must be labeled that way in docs and helper surfaces.

### Current gap
- The repo has the endpoint family, but the state/action rules are not yet expressed in one place with enough operator clarity.

### Next artifacts
- deployment state/action matrix
- CLI help and SDK wording cleanup
- dashboard/operator docs cross-check
