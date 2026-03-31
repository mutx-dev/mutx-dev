# Webhook Governance

## Overview
This document outlines the operational policies for webhook delivery, retry handling, circuit breaker behavior, and escalation paths for MUTX webhooks.

## Retry Policies

### Default Retry Configuration
| Attempt | Delay | Total Elapsed |
|---------|-------|---------------|
| 1       | 1s    | 1s            |
| 2       | 5s    | 6s            |
| 3       | 30s   | 36s           |
| 4       | 2min  | 2m36s         |
| 5       | 10min | 12m36s        |

### Retry Conditions
- **Retried**: HTTP 5xx, network timeouts, connection refused
- **NOT Retried**: HTTP 4xx (except 429), invalid payload, authentication failures

### Jitter
All retry delays include ±25% jitter to prevent thundering herd.

## Circuit Breaker Defaults

| Parameter | Value |
|-----------|-------|
| Failure threshold | 5 consecutive failures |
| Recovery timeout | 60 seconds |
| Half-open max requests | 3 |
| Force open | Manual intervention only |

### Monitoring
Circuit state is exposed via `/metrics` as `webhook_circuit_state{service="...",state="open|closed|half-open"}`.

## Timeout Configuration

| Context | Timeout |
|---------|---------|
| HTTP request overall | 30s |
| Connection timeout | 5s |
| Read timeout | 25s |
| First byte timeout | 10s |

## Delivery SLAs

| Priority | Max Delivery Time | Retry Budget | SLA Breach If |
|----------|-------------------|--------------|---------------|
| Critical | 30s | 5 attempts | >30s end-to-end |
| High | 5min | 3 attempts | >5min end-to-end |
| Normal | 1hr | 2 attempts | >1hr end-to-end |
| Low | 24hr | 1 attempt | >24hr end-to-end |

### Success Criteria
- HTTP 2xx response within timeout
- Response body validated if signature verification enabled

## Escalation Paths

### Tier 1: Automated Recovery (0-5 min)
1. Circuit breaker opens → webhook queued for retry
2. Retry exhaustion → event marked `delivery_failed`
3. Alert fires to on-call Slack: `#alerts-webhooks`

### Tier 2: On-Call Intervention (5-15 min)
1. On-call reviews dashboard: `grafana/d/webhook-health`
2. Checks for systematic issues (service down, config drift)
3. If misconfigured: rollback via `make deploy-rollback`
4. If infrastructure: escalate to infra team

### Tier 3: Engineering Escalation (15+ min)
1. Page engineering lead via PagerDuty
2. Incident channel: `#incidents-webhook-YYYY-MM-DD`
3. Post-mortem required within 48hrs for Priority-Critical breaches

### Contact Hierarchy
- On-call: PagerDuty → `#alerts-webhooks`
- Engineering Lead: Escalation via PagerDuty
- CTO: Priority-Critical only

## Signature Verification

All outbound webhooks are signed with HMAC-SHA256. Receivers MUST verify signature before processing.

Header: `X-MUTX-Signature: sha256=<hex_digest>`

## Idempotency

Webhooks include `X-MUTX-Delivery-ID` header. Receivers should use this for deduplication. MUTX retains delivery logs for 30 days.
