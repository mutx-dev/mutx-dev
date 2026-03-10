# Railway Deployment

Deploy to Railway for managed hosting.

## Railway Setup

### 1. Install Railway CLI

```bash
# macOS
brew install railway

# Or using npm
npm install -g @railway/cli

# Login
railway login

# Verify
railway whoami
```

### 2. Initialize Project

```bash
# Create new project
railway init

# Or link existing
railway link
```

### 3. Add Database

```bash
# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis
```

## Environment Variables

### Required Variables

Set these in Railway dashboard (Settings → Variables):

```bash
# Database (auto-populated by Railway)
DATABASE_URL=postgresql://...  # Auto-configured

# Only set this if your Railway PostgreSQL endpoint rejects SSL upgrade attempts
# DATABASE_SSL_MODE=disable

# JWT
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# Optional startup behavior
DATABASE_REQUIRED_ON_STARTUP=false

# Site URLs
NEXT_PUBLIC_SITE_URL=https://your-app.railway.app
NEXT_PUBLIC_API_URL=https://your-app.railway.app

# Email (optional)
RESEND_API_KEY=re_your_resend_api_key
```

### Railway JSON Config

The API service uses a Dockerfile-based deployment and a liveness health check:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.backend"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 60
  }
}
```

`/health` is a liveness endpoint and returns `200` even while the app is still retrying database startup. Use `/ready` to confirm the database is connected before sending traffic that depends on PostgreSQL.

## Database Setup

### 1. Create Database

In Railway dashboard:
1. Go to your project
2. Click "New" → "Database" → "PostgreSQL"
3. Note the connection string

### 2. Initialize the Schema

```bash
# The API currently bootstraps its tables on startup.
# You can still run ad hoc database commands with Railway CLI if needed.
```

### 3. Seed Data (Optional)

```bash
railway run python -m src.api.seed
```

## Deploy

### 1. Deploy to Railway

```bash
# Deploy
railway up

# Or with environment
railway up --production
```

### 2. View Deployment

```bash
# Open in browser
railway open

# View logs
railway logs

# Follow logs
railway logs -f
```

### 3. Verify Deployment

```bash
# Get deployment URL
railway url

# Test health endpoint
curl https://your-app.railway.app/health
```

## Custom Domain

### 1. Add Domain

In Railway dashboard:
1. Go to project → Settings → Domains
2. Add custom domain (e.g., mutx.dev)
3. Note the CNAME record

### 2. Configure DNS

Add CNAME record:

```
Type: CNAME
Name: mutx.dev
Value: your-app.railway.app
```

### 3. SSL

Railway automatically provisions Let's Encrypt SSL.

## Multiple Services

For a more complete setup, create multiple Railway services:

### Service 1: Frontend (Next.js)

```json
{
  "name": "frontend",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 2,
    "startCommand": "npm run start"
  }
}
```

### Service 2: API (FastAPI)

Create `api/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `railway.json` for API:

```json
{
  "name": "api",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "api/Dockerfile"
  },
  "deploy": {
    "numReplicas": 2,
    "startCommand": "uvicorn src.api.main:app --host 0.0.0.0 --port 8000"
  }
}
```

## Troubleshooting

### Build Failed

```bash
# Check build logs
railway logs --type build
```

### Service Not Starting

```bash
# Check runtime logs
railway logs --type runtime

# Common issues:
# - Missing environment variables
# - Port not exposed
# - Build command incorrect
```

### Database Connection

```bash
# Verify DATABASE_URL
railway variables | grep DATABASE

# Optional: disable SSL if the proxy rejects SSL upgrades
railway variables set DATABASE_SSL_MODE=disable
```

### Custom Domain Not Working

```bash
# Verify DNS propagation
dig yourdomain.com

# Check Railway domain status
railway domain list
```

## Maintenance

### Update Deployment

```bash
# Deploy new version
git push railway main

# Or trigger manually
railway up
```

### Rollback

In Railway dashboard:
1. Go to Deployments
2. Find previous deployment
3. Click "Redeploy"

### Scale

In Railway dashboard:
- Go to Settings → Scaling
- Adjust replicas (max 20 on Pro plan)

## Quick Reference

```bash
# Login
railway login

# Initialize
railway init

# Deploy
railway up

# View logs
railway logs

# Add service
railway add postgresql

# Variables
railway variables

# Custom domain
railway domain add yourdomain.com
```
