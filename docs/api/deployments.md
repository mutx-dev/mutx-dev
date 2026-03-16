# Deployments

Deployments manage the lifecycle of agent services in production.

## Endpoints

### List Deployments

Retrieve all deployments.

```http
GET /deployments
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, running, stopped, failed) |
| `agent_id` | string | Filter by agent |
| `limit` | int | Maximum results |
| `offset` | int | Pagination offset |

**Response:**

```json
{
  "data": [
    {
      "deployment_id": "dply_abc123",
      "agent_id": "agnt_abc123",
      "agent_name": "data-processor-01",
      "version": "1.2.0",
      "status": "running",
      "replicas": 2,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15
}
```

---

### Create Deployment

Create a new deployment.

```http
POST /deployments
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "agent_id": "agnt_abc123",
  "version": "1.3.0",
  "config": {
    "replicas": 3,
    "environment": {
      "LOG_LEVEL": "info",
      "DATABASE_URL": "postgresql://..."
    },
    "resources": {
      "cpu": "500m",
      "memory": "512Mi"
    }
  }
}
```

**Response:**

```json
{
  "deployment_id": "dply_xyz789",
  "agent_id": "agnt_abc123",
  "version": "1.3.0",
  "status": "pending",
  "replicas": 3,
  "created_at": "2024-01-20T10:30:00Z"
}
```

---

### Get Deployment Details

Retrieve detailed information about a deployment.

```http
GET /deployments/{deployment_id}
```

**Response:**

```json
{
  "deployment_id": "dply_abc123",
  "agent_id": "agnt_abc123",
  "agent_name": "data-processor-01",
  "version": "1.3.0",
  "status": "running",
  "replicas": 2,
  "config": {
    "environment": {...},
    "resources": {...}
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

### Restart Deployment

Restart a running deployment.

```http
POST /deployments/{deployment_id}/restart
```

**Response:**

```json
{
  "deployment_id": "dply_abc123",
  "status": "restarting",
  "message": "Deployment restart initiated"
}
```

---

### Scale Deployment

Scale deployment replicas up or down.

```http
POST /deployments/{deployment_id}/scale
```

**Request Body:**

```json
{
  "replicas": 5
}
```

**Response:**

```json
{
  "deployment_id": "dply_abc123",
  "replicas": 5,
  "previous_replicas": 2,
  "status": "scaling"
}
```

---

### Get Deployment Logs

Retrieve logs for a deployment.

```http
GET /deployments/{deployment_id}/logs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | string | Container name (main, sidecar) |
| `since` | string | ISO timestamp |
| `limit` | int | Maximum log lines |
| `follow` | bool | Stream logs (Server-Sent Events) |

**Response:**

```json
{
  "logs": [
    {
      "timestamp": "2024-01-20T15:45:00Z",
      "container": "main",
      "message": "Application started",
      "level": "info"
    }
  ]
}
```

---

### Get Deployment Events

Retrieve lifecycle events for a deployment.

```http
GET /deployments/{deployment_id}/events
```

**Response:**

```json
{
  "events": [
    {
      "event_id": "evt_abc123",
      "type": "scaling",
      "message": "Scaled to 5 replicas",
      "timestamp": "2024-01-20T15:45:00Z",
      "metadata": {
        "previous_replicas": 2,
        "new_replicas": 5
      }
    }
  ]
}
```

---

### Get Deployment Metrics

Retrieve metrics for a deployment.

```http
GET /deployments/{deployment_id}/metrics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `metric_type` | string | Type (cpu, memory, requests, custom) |
| `since` | string | Start timestamp |
| `until` | string | End timestamp |
| `interval` | string | Aggregation (1m, 5m, 1h, 1d) |

**Response:**

```json
{
  "deployment_id": "dply_abc123",
  "metrics": [
    {
      "timestamp": "2024-01-20T15:00:00Z",
      "cpu_percent": 45.2,
      "memory_percent": 62.1,
      "requests_per_second": 125.5,
      "error_rate": 0.01
    }
  ]
}
```

## Deployment States

| State | Description |
|-------|-------------|
| `pending` | Deployment created, starting |
| `running` | Successfully deployed and serving |
| `stopped` | Deployment stopped |
| `failed` | Deployment failed |
| `restarting` | Restart in progress |
| `scaling` | Scaling in progress |

## Webhooks for Deployments

Configure webhooks to receive deployment notifications. See [webhooks.md](./webhooks.md).
