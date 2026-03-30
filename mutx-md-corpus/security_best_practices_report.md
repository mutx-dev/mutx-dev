# Security And Code Audit Report

## Executive Summary

I found 5 high-confidence issues worth immediate attention:

1. Any authenticated user can register credential backends and retrieve secret values from the global credential broker.
2. Any authenticated user can start, stop, and restart supervised processes using attacker-controlled commands and environment variables.
3. Webhook URLs are only scheme-validated before server-side delivery, creating an SSRF primitive.
4. Terraform defaults expose SSH to the public internet unless `admin_cidr` is explicitly overridden.
5. The `/v1/monitoring/health` route is broken because it imports a non-existent `start_time` symbol.

I also verified a few non-findings:

- `.env` is present locally but is not tracked in git.
- `npm audit --omit=dev` reported no production Node advisories.
- A full Python advisory scan could not complete because `requirements.txt` currently has resolver conflicts for `pip-audit`.

## Critical

### SEC-001: Global credential broker is exposed to any authenticated user

- Severity: Critical
- Location:
  - `src/api/routes/governance_credentials.py:67-168`
  - `src/api/services/credential_broker.py:618-717`
- Evidence:
  - All credential broker routes use `Depends(get_current_user)` and do not perform any admin, tenant, or internal-user check.
  - `register_credential_backend()` accepts arbitrary backend config and persists it globally.
  - `get_credential()` returns `credential.value` directly in the API response.
  - `CredentialBroker` stores shared backend configuration in `~/.mutx/credential_broker/backends.json`.
- Impact:
  - Any authenticated account can register or replace shared secret-manager backends, enumerate backend health, and retrieve arbitrary secret values by path.
  - In a multi-user deployment this is a direct privilege-boundary failure and can become cross-tenant secret disclosure.
- Fix:
  - Restrict these routes to trusted operators only.
  - Scope backends per tenant or per operator instead of a global singleton.
  - Do not return raw secret values from general-purpose user APIs.
  - Store backend configuration in an encrypted server-side secret store, not a shared plaintext JSON file.
- Mitigation:
  - If these endpoints must remain for internal operators, place them behind a separate internal-only surface and audit-log every access.
- False positive notes:
  - I found no role check in the route layer or user model for these endpoints. If authorization exists elsewhere, it is not visible in this repo.

### SEC-002: Authenticated users can spawn arbitrary supervised processes

- Severity: Critical
- Location:
  - `src/api/routes/governance_supervision.py:51-104`
  - `src/api/services/faramesh_supervisor.py:123-139`
- Evidence:
  - `start_supervised_agent()` accepts `command`, `env`, and `faramesh_policy` from any authenticated user.
  - `FarameshSupervisor.start_agent()` builds `supervised_command` from the supplied values and executes it with `subprocess.Popen(...)`.
- Impact:
  - Any authenticated user can cause the API host to start arbitrary supervised commands with attacker-controlled environment variables.
  - This is effectively server-side code execution and full host-level control of the supervision plane.
- Fix:
  - Make these endpoints admin-only or internal-only.
  - Bind actions to owned agent records rather than raw `agent_id` strings.
  - Replace arbitrary commands with an allowlisted launcher model.
  - Strictly validate or strip user-provided environment variables.
- Mitigation:
  - If this must remain callable, move it behind a separate operator service reachable only from a private network.
- False positive notes:
  - This finding depends only on the visible route and `subprocess.Popen` call; no additional assumptions are required.

## High

### SEC-003: Webhook delivery permits SSRF to arbitrary destinations

- Severity: High
- Location:
  - `src/api/routes/webhooks.py:96-121`
  - `src/api/routes/webhooks.py:150-176`
  - `src/api/routes/webhooks.py:196-215`
  - `src/api/services/webhook_service.py:54-85`
- Evidence:
  - Webhook creation and update only verify that the URL starts with `http://` or `https://`.
  - `test_webhook()` immediately delivers to the stored URL.
  - `deliver_webhook()` posts server-side to `webhook.url` with no DNS/IP allowlist or private-address rejection.
- Impact:
  - Any authenticated user can coerce the backend into sending requests to internal services, metadata endpoints, or other non-public destinations.
  - The explicit test route makes this easy to exercise on demand; background event delivery amplifies it.
- Fix:
  - Resolve and reject private, loopback, link-local, multicast, and RFC1918 destinations after DNS resolution.
  - Reject internal hostnames and raw IP literals unless explicitly allowlisted.
  - Consider a webhook ownership challenge or outbound proxy allowlist.
- Mitigation:
  - Egress filtering at the network layer reduces blast radius, but the application should still validate destinations.
- False positive notes:
  - If all outbound traffic is already forced through a strict egress firewall, impact is reduced, but that protection is not visible here.

### INFRA-001: Terraform defaults open SSH to the world

- Severity: High
- Location:
  - `infrastructure/terraform/variables.tf:96-100`
  - `infrastructure/terraform/modules/droplet/main.tf:142-149`
- Evidence:
  - `admin_cidr` defaults to `0.0.0.0/0`.
  - The DigitalOcean firewall opens port `22` to `var.admin_cidr`.
- Impact:
  - A default or forgotten override leaves SSH exposed to the public internet on newly provisioned droplets.
  - This materially increases brute-force and credential attack surface in production.
- Fix:
  - Remove the permissive default.
  - Require an explicit administrative CIDR or fail closed.
  - Prefer VPN or bastion-only SSH access.
- Mitigation:
  - The docs already warn against `0.0.0.0/0`; the code should enforce that warning instead of relying on operator discipline.
- False positive notes:
  - This is a default-risk finding. If every real environment overrides `admin_cidr`, exposure may not exist today.

## Medium

### CODE-001: `/v1/monitoring/health` imports a symbol that does not exist

- Severity: Medium
- Location:
  - `src/api/routes/monitoring.py:66-80`
  - `src/api/main.py:291-324`
- Evidence:
  - `get_health()` does `from src.api.main import start_time`.
  - `src/api.main` does not define a module-level `start_time`; startup time is stored on `app.state.start_time`.
  - I reproduced this with:
    - `python3 - <<'PY' ... from src.api.main import start_time ... PY`
    - Result: `ImportError cannot import name 'start_time' from 'src.api.main'`
- Impact:
  - The route should 500 at runtime, breaking monitoring consumers of `/v1/monitoring/health`.
  - This also creates conflicting health behavior because the root `/health` route is implemented differently and does work from app state.
- Fix:
  - Read `request.app.state.start_time` in this route, matching the root health implementation.
  - Add a direct route test for `/v1/monitoring/health`.
- Mitigation:
  - Prefer the root `/health` route until this is fixed.
- False positive notes:
  - This is a direct code-path error and does not depend on deployment assumptions.

## Verification Notes

### Dependency checks

- `npm audit --omit=dev --json`
  - Result: no production Node advisories.
- `npm audit --json`
  - Result: one high-severity advisory in the dev dependency tree (`picomatch` via Jest/tooling).
- `uvx --from pip-audit pip-audit -r requirements.txt`
  - Result: scan could not complete because the current Python requirement set has dependency resolution conflicts.

### Repo hygiene checks

- `git ls-files .env .env.example .env.production.example .env.monitoring.example .env.otel.example`
  - Result: only example env files are tracked; `.env` is not tracked.

## Recommended Order Of Fixes

1. Lock down `governance_credentials` immediately.
2. Remove arbitrary command execution from `governance_supervision` or restrict it to trusted operators only.
3. Add webhook destination validation and SSRF protections.
4. Change Terraform SSH defaults to fail closed.
5. Fix `/v1/monitoring/health` and add regression coverage.
