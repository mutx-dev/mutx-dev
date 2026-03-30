# MUTX Operations Guide

## Docker Compose Setup

### Canonical Compose File

The canonical Docker Compose file lives at:
```
infrastructure/docker/docker-compose.yml
```

(It moved from the repo root — bootstrap scripts may still reference the old path. See `references/development.md` for the workaround.)

### Start the Stack

```bash
# Full local dev stack (recommended)
make dev

# Docker containers only (no hot-reload)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# With explicit env file
docker compose -f infrastructure/docker/docker-compose.yml --env-file infrastructure/docker/.env up -d
```

### Stop the Stack

```bash
docker compose -f infrastructure/docker/docker-compose.yml down

# Wipe data volumes (full reset)
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

### Check Status

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

---

## Environment Variables

### Core Required Variables

```bash
# Database
DATABASE_URL=postgresql://mutx:mutx@localhost:5432/mutx

# Auth
JWT_SECRET=<your-secret-key>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Control Plane
CONTROL_PLANE_URL=http://localhost:8000
CONTROL_PLANE_API_KEY=<optional-api-key>

# Runtime (for agent execution)
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>

# OpenClaw (for OpenClaw agent integration)
OPENCLAW_GATEWAY_URL=<openclaw-gateway-url>
OPENCLAW_GATEWAY_TOKEN=<openclaw-gateway-token>

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### How to Set

Create `infrastructure/docker/.env` (gitignored):

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env
# Edit .env with your values
```

Or export in your shell:

```bash
export DATABASE_URL=postgresql://mutx:mutx@localhost:5432/mutx
export JWT_SECRET=your-super-secret-key
# ... then run docker compose
```

---

## Monitoring a Running Deployment

### Health Checks

```bash
# Control plane health
curl http://localhost:8000/v1/monitoring/health

# Active alerts
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/v1/monitoring/alerts

# Docker container status
docker compose -f infrastructure/docker/docker-compose.yml ps
```

### Dashboard Monitoring

Open `http://localhost:3000/dashboard/monitoring` for the operator monitoring panel.

### Key Monitoring Endpoints

| Endpoint | What It Shows |
|----------|--------------|
| `GET /v1/monitoring/health` | Control plane uptime and health |
| `GET /v1/monitoring/alerts` | Active alerts (unresolved) |
| `GET /v1/events` | Event stream |
| `GET /v1/deployments/{id}/logs` | Per-deployment logs |
| `GET /v1/deployments/{id}/metrics` | Per-deployment metrics |
| `GET /v1/runs/{id}/traces` | Per-run trace data |

### Runtime Self-Healing

Monitoring → alert → self-healer wiring is still being completed. See `#39` (wire monitoring and self-healing into runtime). Currently:
- Alerts are recorded and queryable
- Alert count queries are SQL-safe (fixed in `src/api/routes/monitoring.py`)
- Runtime auto-restart hooks are scaffolded but not yet production-wired

---

## Common Operational Procedures

### Fresh Local Start

```bash
# 1. Stop everything and wipe volumes
docker compose -f infrastructure/docker/docker-compose.yml down -v

# 2. Start fresh
make dev

# 3. Seed test data
make test-auth
make seed

# 4. Verify
curl http://localhost:8000/v1/monitoring/health
```

### Restart the Backend Only

```bash
# Find the container
docker compose -f infrastructure/docker/docker-compose.yml ps api

# Restart in place (keeps DB data)
docker compose -f infrastructure/docker/docker-compose.yml restart api

# Or drop into a shell inside the container
docker compose -f infrastructure/docker/docker-compose.yml exec api /bin/bash
```

### Restart the Frontend Only

```bash
docker compose -f infrastructure/docker/docker-compose.yml restart frontend
```

###查看 Logs

```bash
# All services
docker compose -f infrastructure/docker/docker-compose.yml logs -f

# Specific service
docker compose -f infrastructure/docker/docker-compose.yml logs -f api
docker compose -f infrastructure/docker/docker-compose.yml logs -f frontend
docker compose -f infrastructure/docker/docker-compose.yml logs -f db
```

### Database Backup

```bash
# Dump the local DB
docker compose -f infrastructure/docker/docker-compose.yml exec db \
  pg_dump -U mutx mutx > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker compose -f infrastructure/docker/docker-compose.yml exec -T db \
  psql -U mutx mutx < backup_20260318_120000.sql
```

### Inspect the Running API

```bash
# Swagger docs
open http://localhost:8000/docs

# ReDoc
open http://localhost:8000/redoc

# Raw OpenAPI JSON
curl http://localhost:8000/openapi.json
```

---

## Deployment Targets

### Local Docker (recommended for dev)

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### Railway (one-click deploy)

```bash
# Backend
railway deploy --file railway-backend.json

# Frontend
railway deploy --file railway-frontend.json
```

Railway config files are at the repo root: `railway.json`, `railway-backend.json`, `railway-frontend.json`.

### Terraform (cloud VPS)

```bash
cd infrastructure/terraform/
terraform init
terraform plan
terraform apply
```

Terraform configs live in `infrastructure/terraform/` (in progress).

### Kubernetes (Helm)

```bash
cd infrastructure/helm/
helm install mutx ./mutx-chart
```

Helm charts are in `infrastructure/helm/` (in progress).

---

## Production Checklist

Before going to production:

- [ ] Set a strong `JWT_SECRET`
- [ ] Configure `DATABASE_URL` to a managed PostgreSQL (or keep Docker volume for single-node)
- [ ] Set real `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`
- [ ] Configure `OPENCLAW_GATEWAY_URL` if using OpenClaw agent integration
- [ ] Enable TLS (nginx config at `nginx.conf`)
- [ ] Set `CONTROL_PLANE_URL` to your public domain
- [ ] Review rate limits and add API key quotas via `GET /v1/budgets`
- [ ] Set up webhook receivers at `GET /v1/webhooks`
- [ ] Verify `make test` passes
- [ ] Run `npm run build` on the frontend

---

## Troubleshooting

### `make dev` fails immediately

- Docker not running: `docker info` → if error, start Docker.app
- Port 5432 or 8000 or 3000 already in use: `lsof -i :8000` → kill the process

### Frontend shows `[object Object]` on agent/deployment data

- Usually a 401 Unauthorized — the API is not receiving a valid JWT
- Check that `NEXT_PUBLIC_API_URL` points to the correct backend URL
- Get a fresh token: `make test-auth`

### Backend executor times out repeatedly

- Use absolute workspace paths in prompts
- Keep per-run scope small and bounded
- See `references/development.md` → backend executor timeout notes

### DB migrations failing

```bash
cd ~/MUTX
alembic upgrade head
```
