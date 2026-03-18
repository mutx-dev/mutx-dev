# MUTX Management Skill

Manage a running MUTX instance programmatically.

## API Endpoints

All endpoints require authentication via `x-api-key` header or session cookie.

### Health Check

    curl -H "x-api-key: $API_KEY" http://localhost:3000/api/status?action=health

Possible statuses: healthy, degraded, unhealthy

### System Overview

    curl -H "x-api-key: $API_KEY" http://localhost:3000/api/status?action=overview

### Diagnostics (Admin Only)

    curl -H "x-api-key: $API_KEY" http://localhost:3000/api/diagnostics

### Check for Updates

    curl -H "x-api-key: $API_KEY" http://localhost:3000/api/releases/check

### Trigger Update

    curl -X POST -H "x-api-key: $API_KEY" http://localhost:3000/api/releases/update

### Database Backup

    curl -X POST -H "x-api-key: $API_KEY" http://localhost:3000/api/backup

### Agent Management

    # List agents
    curl -H "x-api-key: $API_KEY" http://localhost:3000/api/agents

    # Register an agent
    curl -X POST -H "x-api-key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"name": "my-agent", "type": "openclaw"}' \
      http://localhost:3000/api/agents

## Common Workflows

### Automated Health Monitoring

    STATUS=$(curl -sf -H "x-api-key: $API_KEY" http://localhost:3000/api/status?action=health | jq -r '.status')
    if [ "$STATUS" != "healthy" ]; then
      echo "ALERT: MUTX is $STATUS"
    fi

### Pre-Upgrade Checklist

1. Check for updates: GET /api/releases/check
2. Create backup: POST /api/backup
3. Run diagnostics: GET /api/diagnostics
4. Apply update: POST /api/releases/update
5. Verify health: GET /api/status?action=health
