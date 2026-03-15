# MUTX Production Monitoring

This document describes the monitoring infrastructure, endpoints, and procedures for MUTX.

## Overview

MUTX uses Prometheus for metrics collection and Grafana for visualization. Alerting is handled by Prometheus alerts and Alertmanager.

## Monitoring Stack

| Component | Purpose | Port |
|-----------|---------|------|
| Prometheus | Metrics collection & alerting | 9090 |
| Alertmanager | Alert routing & notification | 9093 |
| Grafana | Dashboards & visualization | 3001 |
| Node Exporter | System metrics | 9100 |
| PostgreSQL Exporter | Database metrics | 9187 |
| Redis Exporter | Cache metrics | 9121 |

## Service Endpoints

### Health Check Endpoints

| Endpoint | Description | Auth |
|---------|-------------|------|
| `GET /health` | Basic health status | None |
| `GET /ready` | Readiness probe (includes DB) | None |
| `GET /metrics` | Prometheus metrics | None |

### Base URL

The monitoring stack is available at:

- **Prometheus**: http://localhost:9090 (development)
- **Grafana**: http://localhost:3001 (development)
- **Alertmanager**: http://localhost:9093 (development)

For production, replace `localhost` with your server's hostname or IP.

## Prometheus Metrics

### Available Metrics

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests by method, path, status
- `http_request_duration_seconds` - Request latency histogram

#### Agent Metrics
- `mutx_agents_total` - Total number of agents
- `mutx_agents_active` - Number of active agents
- `mutx_agent_tasks_total` - Agent tasks processed by status
- `mutx_agent_task_duration_seconds` - Task duration histogram

#### Deployment Metrics
- `mutx_deployments_total` - Total deployments
- `mutx_deployments_running` - Running deployments
- `mutx_deployments_by_status` - Deployments by status

#### Queue Metrics
- `mutx_queue_size` - Current queue size

### Query Examples

```promql
# API request rate
rate(http_requests_total[5m])

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Active agents
mutx_agents_active

# Failed tasks rate
rate(mutx_agent_tasks_total{status="failed"}[5m])
```

## Alert Rules

### Critical Alerts

| Alert | Expression | Description |
|-------|------------|-------------|
| MutxApiDown | `up{job="mutx-api"} == 0` for 2m | API is down |
| HostDiskAlmostFull | Disk available < 15% for 15m | Disk space critical |

### Warning Alerts

| Alert | Expression | Description |
|-------|------------|-------------|
| HighApiP95Latency | p95 latency > 1s for 10m | High latency |
| RedisExporterDown | Redis exporter down for 5m | Redis monitoring unavailable |
| PostgresExporterDown | Postgres exporter down for 5m | DB monitoring unavailable |
| NodeExporterDown | Node exporter down for 5m | System monitoring unavailable |
| HostHighMemoryUsage | Memory usage > 90% for 10m | High memory pressure |

### Custom Alerts

Add new alerts to `infrastructure/monitoring/prometheus/alerts.yml`:

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is above 10% for 5 minutes"
```

## Grafana Dashboards

Access dashboards at: http://localhost:3001/dashboards

### Available Dashboards

1. **MUTX API Overview** - Main API metrics
2. **Agent Performance** - Agent task metrics
3. **Deployment Status** - Deployment tracking
4. **System Overview** - Node, Redis, PostgreSQL

### Default Credentials

- Username: `admin`
- Password: Set via `GRAFANA_ADMIN_PASSWORD` environment variable

## Alert Notifications

Alertmanager is configured to send notifications. Update `infrastructure/monitoring/prometheus/alertmanager.yml` to configure notification receivers:

```yaml
route:
  group_by: ['alertname']
  receiver: 'email'

receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@mutx.dev'
        send_resolved: true
```

## Application Health Checks

### /health Endpoint

Returns overall health status:

```json
{
  "status": "healthy",
  "timestamp": "2026-03-15T12:00:00Z",
  "database": "ready",
  "error": null
}
```

### /ready Endpoint

Returns readiness including database connectivity:

```json
{
  "status": "ready",
  "timestamp": "2026-03-15T12:00:00Z",
  "database": "ready",
  "error": null
}
```

Returns 503 if not ready.

## Production Deployment

### Starting Monitoring Stack

```bash
# Using Docker Compose
cd infrastructure/docker
docker-compose -f docker-compose.monitoring.yml up -d

# Or use the Makefile
make up-monitoring
```

### Verify Services

```bash
# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Alertmanager  
curl http://localhost:9093/-/healthy

# Check exporters
curl http://localhost:9100/metrics | head
curl http://localhost:9187/metrics | head
curl http://localhost:9121/metrics | head
```

## Troubleshooting

### Prometheus not scraping targets

1. Check target status: http://localhost:9090/targets
2. Verify network connectivity
3. Check exporter logs: `docker logs mutx-prometheus`

### Alerts not firing

1. Check alert rules: http://localhost:9090/rules
2. Verify Alertmanager connectivity: http://localhost:9090/status
3. Check alert notifications in Alertmanager UI

### High latency on queries

- Reduce scrape interval if needed
- Check retention settings
- Review query performance in Prometheus UI

## Integration with External Monitoring

### Adding New Exporters

1. Add exporter service to `docker-compose.monitoring.yml`
2. Add scrape config to `prometheus.yml`
3. Restart Prometheus: `docker restart mutx-prometheus`

### Custom Metrics

Add custom metrics in your code:

```python
from src.api.metrics import http_requests_total, http_request_duration_seconds

# Track a request
http_requests_total.labels(method="GET", path="/api/agents", status=200).inc()

# Track duration
http_request_duration_seconds.labels(method="GET", path="/api/agents").observe(0.125)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMETHEUS_PORT` | Prometheus port | 9090 |
| `ALERTMANAGER_PORT` | Alertmanager port | 9093 |
| `GRAFANA_PORT` | Grafana port | 3001 |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | (required) |
| `NODE_EXPORTER_PORT` | Node exporter port | 9100 |
| `POSTGRES_EXPORTER_PORT` | Postgres exporter port | 9187 |
| `REDIS_EXPORTER_PORT` | Redis exporter port | 9121 |
| `REDIS_PASSWORD` | Redis password | (required) |
| `POSTGRES_PASSWORD` | Postgres password | (required) |

## Related Files

- `infrastructure/docker/docker-compose.monitoring.yml` - Monitoring stack
- `infrastructure/monitoring/prometheus/prometheus.yml` - Prometheus config
- `infrastructure/monitoring/prometheus/alerts.yml` - Alert rules
- `infrastructure/monitoring/prometheus/alertmanager.yml` - Alert routing
- `src/api/metrics.py` - Application metrics
