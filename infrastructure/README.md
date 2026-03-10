# MUTX Infrastructure

Production-readiness baseline for Terraform, Ansible, Docker Compose, and monitoring.

## Layout

- `terraform/` – DigitalOcean VPC + droplet + firewall provisioning
- `ansible/` – host hardening and container deployment playbooks
- `monitoring/` – Prometheus + Grafana config

## Terraform (DigitalOcean)

```bash
cd infrastructure
make tf-fmt
make tf-validate
make ansible-inventory

# Staging
make tf-plan-staging

# Production
make tf-plan-production

# Apply from terraform/ after reviewing plan
cd terraform
terraform apply -var-file=environments/production/terraform.tfvars
```

### Notes

- Backend is environment-scoped via `terraform/environments/<env>/backend.hcl`.
- Keep `admin_cidr` scoped to VPN/home-office CIDR. Avoid `0.0.0.0/0` in production.
- Customer IDs must be unique.
- Customer VPC CIDRs are validated at plan time.

## Ansible Provisioning

```bash
cd infrastructure/ansible
ansible-playbook -i inventory.ini playbooks/provision.yml
ansible-playbook -i inventory.ini playbooks/deploy-agent.yml
```

Install Ansible collections and lint before applying:

```bash
cd infrastructure
make ansible-deps
make ansible-lint
```

Required environment variables before running playbooks:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `AGENT_API_KEY`
- `AGENT_SECRET_KEY`
- `ADMIN_CIDR` (recommended, defaults to `0.0.0.0/0`)
- `PRIVATE_CIDR` (optional, defaults to `10.0.0.0/8`)
- `TAILSCALE_AUTH_KEY` (optional)

## Monitoring Stack

```bash
cp .env.monitoring.example .env.monitoring
# set strong credentials/passwords
./start-monitoring.sh
```

The monitoring compose file binds UI and exporter ports to localhost by default.
Prometheus now loads alerting rules from `infrastructure/monitoring/prometheus/alerts.yml` and scrapes the API via `host.docker.internal:8000` (works for local Docker Desktop + Linux host-gateway mapping).

## CI Drift Detection

A scheduled GitHub Actions workflow now checks Terraform drift daily for both `staging` and `production` using `terraform plan -detailed-exitcode`:

- Workflow: `.github/workflows/infrastructure-drift.yml`
- Trigger: daily cron + manual dispatch
- Behavior: uploads plan artifacts and fails when drift is detected

Required GitHub secrets:

- `DO_TOKEN`
- `TF_STATE_ACCESS_KEY_ID`
- `TF_STATE_SECRET_ACCESS_KEY`

## Extra Validation Targets

From `infrastructure/`:

```bash
# Drift-style exit codes (0=no changes, 2=changes)
make tf-plan-staging-detailed
make tf-plan-production-detailed

# Validate Prometheus config + alert rules
make monitor-validate
```

## Next Hardening Items

- Replace static inventory usage with Terraform-generated inventory by default in Ansible playbook wrappers.
- Wire alert delivery (Alertmanager/notification channel) for critical rules.
- Add automated backup/restore verification for PostgreSQL and Redis volumes.
