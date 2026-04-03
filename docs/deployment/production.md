---
description: Complete production deployment guide for MUTX.
icon: factory
---

# Production Deployment Guide

This guide covers deploying MUTX to production with security, reliability, and scalability in mind.

## Overview

The production stack consists of:

| Component | Purpose | Default Port |
|-----------|---------|--------------|
| **PostgreSQL** | Primary database | 5432 |
| **Redis** | Caching & session store | 6379 |
| **API** | FastAPI backend | 8000 |
| **Frontend** | Next.js web app | 3000 |
| **Nginx** | Reverse proxy & SSL termination | 80/443 |

---

## Prerequisites

### System Requirements

* **CPU**: 2+ cores (4 recommended)
* **RAM**: 4GB minimum, 8GB recommended
* **Disk**: 20GB+ for database and logs
* **OS**: Ubuntu 22.04 LTS or similar Linux distribution
* **Docker**: 24.0+ with docker-compose plugin
* **Domain**: Registered domain with DNS access

### Required Accounts & Keys

* [ ] PostgreSQL database (managed service or self-hosted)
* [ ] Redis instance (managed service or self-hosted)
* [ ] Resend account for transactional email
* [ ] SSL certificate (Let's Encrypt or purchased)
* [ ] Domain pointed to your server IP

---

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file:

```bash
# Database
POSTGRES_USER=mutx
POSTGRES_PASSWORD=<secure-random-password>
POSTGRES_DB=mutx
DATABASE_URL=postgresql://mutx:<password>@<host>:5432/mutx
DATABASE_SSL_MODE=require

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=<minimum-32-character-secret>

# Email (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxx

# URLs (replace with your production domain)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Security Checklist

- [ ] Use strong, randomly generated passwords (16+ characters)
- [ ] JWT_SECRET is unique and not shared with other deployments
- [ ] DATABASE_SSL_MODE is set to "require"
- [ ] CORS_ORIGINS explicitly lists only your production domains
- [ ] No debug or development settings enabled

---

## Deployment Methods

### Option 1: Docker Compose (Recommended for Single Server)

```bash
# Clone and navigate to project
git clone https://github.com/your-org/mutx.git
cd mutx

# Create environment file
cp .env.production.example .env.production
# Edit .env.production with your values

# Start production stack
docker compose -f infrastructure/docker/docker-compose.production.yml up -d

# Verify services
docker compose -f infrastructure/docker/docker-compose.production.yml ps
```

### Option 2: DigitalOcean with Terraform

See [DigitalOcean Deployment](digitalocean.md) for full instructions.

### Option 3: Managed Platform (Railway)

See [Railway Deployment](railway.md) for full instructions.

---

## SSL/TLS Configuration

### Using Let's Encrypt (Automatic)

For Docker deployments, use the nginx-ssl setup:

```bash
# Create SSL directory
mkdir -p infrastructure/docker/ssl

# Using Certbot
certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infrastructure/docker/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infrastructure/docker/ssl/key.pem

# Update nginx.conf to enable SSL (uncomment the SSL server block)
# Then restart nginx
docker compose -f infrastructure/docker/docker-compose.production.yml restart nginx
```

### Manual SSL Configuration

Update `nginx.conf` with your certificate paths:

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

---

## Health Checks & Monitoring

### API Health Endpoints

MUTX provides two health check endpoints:

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/health` | Liveness probe | Kubernetes liveness, restart detection |
| `/ready` | Readiness probe | Kubernetes readiness, traffic routing |

```bash
# Check liveness
curl https://api.yourdomain.com/health

# Check readiness
curl https://api.yourdomain.com/ready

# Expected response: {"status":"ok"}
```

### Prometheus Metrics

The API exposes Prometheus metrics at `/metrics`. Configure your Prometheus to scrape:

```yaml
scrape_configs:
  - job_name: 'mutx-api'
    static_configs:
      - targets: ['api:8000']
```

### Monitoring Stack

Deploy the monitoring stack:

```bash
cd infrastructure
cp .env.monitoring.example .env.monitoring
# Edit .env.monitoring with strong passwords

make monitor-up
```

Access Grafana at `http://localhost:3001` (default credentials: admin/admin).

---

## Database Setup

### Initial Migration

On first deployment, run database migrations:

```bash
# Run migrations via API container
docker compose -f infrastructure/docker/docker-compose.production.yml exec api python -m alembic upgrade head
```

### Backup Configuration

Set up automated backups for PostgreSQL:

```bash
# Add to crontab
0 2 * * * pg_dump -h postgres -U mutx -Fc mutx > /backups/mutx_$(date +\%Y\%m\%d).pgdump
```

For managed databases (DigitalOcean, AWS RDS), enable automated backups in the console.

---

## Security Hardening

### Network Isolation

The production compose file uses a dedicated bridge network. For additional isolation:

```yaml
networks:
  mutx-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Firewall Configuration

If self-hosting, configure UFW:

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Fail2ban (Optional)

Install fail2ban to protect against brute force:

```bash
apt install fail2ban
```

---

## Scaling Considerations

### Vertical Scaling

Adjust resource limits in `docker-compose.production.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G    # Increase for higher load
      cpus: '2.0'
```

### Horizontal Scaling

For horizontal scaling, consider:

1. **Load Balancer**: Add HAProxy or Nginx upstream
2. **Database**: Use managed PostgreSQL (DigitalOcean, AWS RDS)
3. **Redis**: Use managed Redis (Redis Cloud, DigitalOcean)
4. **Session Storage**: Configure Redis for session persistence

### Performance Tuning

For high-traffic deployments:

```bash
# Redis optimization
redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru

# PostgreSQL tuning (postgresql.conf)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check nginx logs: `docker logs mutx-nginx-prod` |
| Database connection failure | Verify DATABASE_URL and SSL settings |
| JWT errors | Ensure JWT_SECRET matches across restarts |
| CORS errors | Verify CORS_ORIGINS includes your domain |

### Logs

```bash
# All services
docker compose -f infrastructure/docker/docker-compose.production.yml logs

# Specific service
docker compose -f infrastructure/docker/docker-compose.production.yml logs -f api
```

### Restart Procedure

```bash
# Full restart
docker compose -f infrastructure/docker/docker-compose.production.yml restart

# Or rebuild and restart
docker compose -f infrastructure/docker/docker-compose.production.yml up -d --build
```

---

## Maintenance

### Regular Tasks

- [ ] Monitor disk space (database logs can grow)
- [ ] Review application logs weekly
- [ ] Update images monthly (`docker compose pull`)
- [ ] Test backups quarterly

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f infrastructure/docker/docker-compose.production.yml up -d --build
```

---

## Related Documentation

* [Infrastructure Guide](https://github.com/mutx-dev/mutx-dev/blob/main/infrastructure.md)
* [Security Architecture](../architecture/security.md)
* [Docker Guide](docker.md)
* [DigitalOcean Deployment](digitalocean.md)
* [Railway Deployment](railway.md)
