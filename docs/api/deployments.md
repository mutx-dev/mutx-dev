# Deployments API

**Source:** `src/api/routes/deployments.py`  
**Spec:** [`openapi.json`](./openapi.json) (regenerated from live routes on 2026-03-31)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/deployments` | List deployments |
| `POST` | `/v1/deployments` | Create deployment |
| `GET` | `/v1/deployments/{deployment_id}` | Get deployment |
| `DELETE` | `/v1/deployments/{deployment_id}` | Kill deployment |
| `GET` | `/v1/deployments/{deployment_id}/events` | Get deployment events |
| `POST` | `/v1/deployments/{deployment_id}/scale` | Scale deployment |
| `POST` | `/v1/deployments/{deployment_id}/restart` | Restart deployment |
| `GET` | `/v1/deployments/{deployment_id}/logs` | Get deployment logs |
| `GET` | `/v1/deployments/{deployment_id}/metrics` | Get deployment metrics |
| **`GET`** | **`/v1/deployments/{deployment_id}/versions`** | **Get version history** |
| **`POST`** | **`/v1/deployments/{deployment_id}/rollback`** | **Rollback to a version** |

---

## `GET /v1/deployments/{deployment_id}/versions`

Get the version history for a deployment. Returns all recorded snapshots ordered newest-first.

**Path parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deployment_id` | UUID | Yes | Target deployment |

**Response `200`**

```json
{
  "deployment_id": "uuid",
  "items": [
    {
      "id": "uuid",
      "deployment_id": "uuid",
      "version": 3,
      "config_snapshot": "{...}",
      "status": "current | superseded",
      "created_at": "2026-03-31T..."
    }
  ],
  "total": 3
}
```

`config_snapshot` is a JSON string with the deployment config at that version.

---

## `POST /v1/deployments/{deployment_id}/rollback`

Rollback a deployment to a specific version. Only deployments with status `running`, `ready`, `stopped`, or `failed` can be rolled back.

**Path parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deployment_id` | UUID | Yes | Target deployment |

**Request body**

```json
{
  "version": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | Yes | Version number to rollback to |

**Response `200`** — Returns the updated `DeploymentResponse`.

**Error `400`** — Cannot rollback deployment with current status.  
**Error `404`** — Version not found for this deployment.

---

## CLI and SDK parity note

`versions` and `rollback` are implemented in the API (`src/api/routes/deployments.py`) but **not yet in**:

- `cli/services/deployments.py`
- `sdk/mutx/deployments.py`

These endpoints will appear in CLI/SDK once the contract owner adds them. Docs will track automatically via `openapi.json`.

---

## Source of truth

When in doubt: `src/api/routes/deployments.py` → `docs/api/openapi.json` → this file.
