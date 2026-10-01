# Deployments

Deployments track the lifecycle of user-owned agent deployments.

The canonical create path is `POST /v1/deployments`.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /v1/deployments` | List deployments for the current user |
| `POST /v1/deployments` | Create a deployment for an owned agent |
| `GET /v1/deployments/{deployment_id}` | Fetch one deployment |
| `GET /v1/deployments/{deployment_id}/events` | Fetch paginated deployment events |
| `POST /v1/deployments/{deployment_id}/scale` | Update replica count |
| `POST /v1/deployments/{deployment_id}/restart` | Restart a running, ready, or failed deployment |
| `GET /v1/deployments/{deployment_id}/logs` | Fetch logs |
| `GET /v1/deployments/{deployment_id}/metrics` | Fetch metrics |
| `GET /v1/deployments/{deployment_id}/versions` | Fetch version history |
| `POST /v1/deployments/{deployment_id}/rollback` | Roll back to a prior version |
| `DELETE /v1/deployments/{deployment_id}` | Request deployment termination |

## Current Lifecycle Rules

- creation requires an owned `agent_id`
- reads accept `VIEWER` or `DEVELOPER`; lifecycle mutations require `DEVELOPER`
- scaling to zero requests a stop; scaling a stopped deployment above zero requests a start;
  positive scaling otherwise requires `running` or `ready`. Each request remains pending
  until current target-bound runtime evidence confirms it
- restart requests are accepted only for `running`, `ready`, or `failed` deployments
- delete does not hard-remove the record; it requests termination and remains pending until
  current runtime evidence confirms it
- while termination is pending, `allowed_actions`, `can_stop`, `can_restart`, and
  `can_terminate` report no accepted action; a stop request cannot cancel termination
- a per-deployment action that would request running is rejected while an Agent-wide stop fence
  is active; an explicit Agent-wide create/deploy request supersedes that fence
- `version` and `replicas` identify the selected configuration. They do not claim that an
  executor has applied it; `observed_state`, `observed_revision`, and `observed_at` carry current
  runtime evidence

## Create A Deployment

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/v1/deployments" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "replicas": 1
  }'
```

Example response:

```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "status": "pending",
  "version": "v1.0.0",
  "replicas": 1,
  "node_id": null,
  "started_at": null,
  "ended_at": null,
  "error_message": null,
  "desired_action": "create",
  "desired_state": "running",
  "observed_state": null,
  "target_revision": 1,
  "observed_revision": null,
  "observed_at": null,
  "events": [
    {
      "id": "uuid",
      "deployment_id": "uuid",
      "event_type": "create",
      "status": "pending",
      "node_id": null,
      "error_message": null,
      "created_at": "2026-03-22T12:00:00Z"
    }
  ],
  "allowed_actions": ["stop", "terminate"],
  "can_stop": true,
  "can_restart": false,
  "can_terminate": true
}
```

## Legacy Agent-Scoped Create

`POST /v1/agents/{agent_id}/deploy` is still mounted and returns a lightweight payload:

```json
{
  "deployment_id": "uuid",
  "status": "pending",
  "desired_action": "deploy",
  "desired_state": "running",
  "target_revision": 1
}
```

Use `POST /v1/deployments` for the canonical full deployment record.

## List And Inspect Deployments

```bash
curl "$BASE_URL/v1/deployments?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments?status=running&agent_id=YOUR_AGENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Event History

```bash
curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/events?limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/events?event_type=scale&status=running" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

The paginated response includes:

- `deployment_id`
- `deployment_status`
- `items`
- `total`
- `skip`
- `limit`
- optional echoed `event_type` and `status` filters

## Scale, Restart, And Kill

```bash
curl -X POST "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/scale" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"replicas":2}'

curl -X POST "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/restart" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X DELETE "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Logs And Metrics

```bash
curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/logs?limit=100&level=info" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/metrics?limit=100" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Deployment log and metric reads currently proxy through the deployment's agent record.

## Versions And Rollback

```bash
curl "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/versions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X POST "$BASE_URL/v1/deployments/YOUR_DEPLOYMENT_ID/rollback" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":1}'
```

Rollback selects the stored deployment snapshot, records a new pending intent and revision, and
preserves prior runtime evidence. Completion requires current target-bound runtime evidence.
