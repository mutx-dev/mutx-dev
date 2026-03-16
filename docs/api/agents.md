# Agents

Agents are autonomous entities that can perform tasks, report metrics, and receive commands.

## Endpoints

### Register Agent

Register a new agent with the platform.

```http
POST /agents/register
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "agent_type": "operator",
  "name": "data-processor-01",
  "metadata": {
    "region": "us-east-1",
    "version": "1.2.0"
  }
}
```

**Response:**

```json
{
  "agent_id": "agnt_abc123",
  "agent_type": "operator",
  "name": "data-processor-01",
  "status": "registered",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### List Agents

Retrieve all registered agents.

```http
GET /agents
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (registered, online, offline, error) |
| `agent_type` | string | Filter by agent type |
| `limit` | int | Maximum results (default: 50) |
| `offset` | int | Pagination offset |

**Response:**

```json
{
  "data": [
    {
      "agent_id": "agnt_abc123",
      "agent_type": "operator",
      "name": "data-processor-01",
      "status": "online",
      "last_heartbeat": "2024-01-20T15:45:00Z"
    }
  ],
  "total": 42
}
```

---

### Get Agent Details

Retrieve detailed information about an agent.

```http
GET /agents/{agent_id}
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "agent_id": "agnt_abc123",
  "agent_type": "operator",
  "name": "data-processor-01",
  "status": "online",
  "metadata": {
    "region": "us-east-1",
    "version": "1.2.0"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "last_heartbeat": "2024-01-20T15:45:00Z"
}
```

---

### Get Agent Status

Get current operational status of an agent.

```http
GET /agents/{agent_id}/status
```

**Response:**

```json
{
  "agent_id": "agnt_abc123",
  "status": "online",
  "state": "idle",
  "current_task": null,
  "uptime_seconds": 3600
}
```

---

### Update Agent Status

Update agent status from the agent itself.

```http
POST /agents/heartbeat
```

**Request Body:**

```json
{
  "agent_id": "agnt_abc123",
  "status": "online",
  "state": "processing",
  "current_task": "task_xyz789",
  "metrics": {
    "cpu_percent": 45.2,
    "memory_percent": 62.1
  }
}
```

---

### Deploy Agent

Trigger deployment for an agent.

```http
POST /agents/{agent_id}/deploy
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "version": "1.3.0",
  "config": {
    "replicas": 2,
    "environment": {
      "LOG_LEVEL": "debug"
    }
  }
}
```

**Response:**

```json
{
  "deployment_id": "dply_abc123",
  "agent_id": "agnt_abc123",
  "version": "1.3.0",
  "status": "deploying"
}
```

---

### Stop Agent

Stop a running agent.

```http
POST /agents/{agent_id}/stop
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Agent stopped successfully"
}
```

---

### Get Agent Logs

Retrieve logs for an agent.

```http
GET /agents/{agent_id}/logs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `level` | string | Filter by log level (debug, info, warn, error) |
| `since` | string | ISO timestamp - only logs after this time |
| `limit` | int | Maximum number of log entries |

**Response:**

```json
{
  "logs": [
    {
      "timestamp": "2024-01-20T15:45:00Z",
      "level": "info",
      "message": "Agent started successfully"
    }
  ]
}
```

---

### Get Agent Metrics

Retrieve metrics for an agent.

```http
GET /agents/{agent_id}/metrics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `metric_type` | string | Type of metric (cpu, memory, network, custom) |
| `since` | string | ISO timestamp |
| `until` | string | ISO timestamp |
| `interval` | string | Aggregation interval (1m, 5m, 1h, 1d) |

**Response:**

```json
{
  "agent_id": "agnt_abc123",
  "metrics": [
    {
      "timestamp": "2024-01-20T15:00:00Z",
      "cpu_percent": 45.2,
      "memory_percent": 62.1,
      "requests_total": 1234
    }
  ]
}
```

---

### Send Agent Command

Send a command to an agent.

```http
POST /agents/commands
```

**Request Body:**

```json
{
  "agent_id": "agnt_abc123",
  "command": "execute_task",
  "payload": {
    "task_id": "task_xyz789",
    "priority": "high"
  }
}
```

**Response:**

```json
{
  "command_id": "cmd_abc123",
  "status": "acknowledged"
}
```

---

### Acknowledge Command

Acknowledge receipt of a command.

```http
POST /agents/commands/acknowledge
```

**Request Body:**

```json
{
  "command_id": "cmd_abc123",
  "status": "accepted"
}
```

---

### Get Agent Commands

List pending commands for an agent.

```http
GET /agents/commands
```

**Response:**

```json
{
  "commands": [
    {
      "command_id": "cmd_abc123",
      "command": "execute_task",
      "payload": {...},
      "created_at": "2024-01-20T15:45:00Z"
    }
  ]
}
```
