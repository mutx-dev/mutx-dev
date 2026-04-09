# Kubernetes Deployment Guide for MUTX

This guide covers deploying MUTX to Kubernetes using Helm charts or raw YAML manifests.

## Prerequisites

- Helm 3.x installed ([Install Guide](https://helm.sh/docs/intro/install/))
- Kubernetes 1.24+ cluster
- kubectl configured to access your Kubernetes cluster
- Docker image `mutx/mutx` pushed to your registry (or use the default)

## Helm Chart

The canonical Helm chart lives at `infrastructure/helm/mutx/`. See the [Helm chart README](../../infrastructure/helm/mutx/README.md) for the full configuration reference.

## Helm Deployment

### Staging Environment

```bash
# Install or upgrade the staging release
make helm-install-staging

# Or using helm directly
helm upgrade --install mutx-staging infrastructure/helm/mutx \
  -f infrastructure/helm/mutx/values.staging.yaml \
  --namespace staging --create-namespace
```

### Production Environment

```bash
# Install or upgrade the production release
make helm-install-prod

# Or using helm directly
helm upgrade --install mutx-prod infrastructure/helm/mutx \
  -f infrastructure/helm/mutx/values.prod.yaml \
  --namespace production --create-namespace
```

## Raw YAML Deployment

For environments without Helm, apply the raw YAML manifests:

```bash
# Apply all Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Or individually
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/service.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml
kubectl apply -f infrastructure/kubernetes/hpa.yaml
```

## Configuration

### Environment Variables

Configure environment variables via the `env` dict in values.yaml:

```yaml
env:
  DATABASE_URL: "postgresql://user:***@postgres:5432/mutx"
  REDIS_URL: "redis://redis:6379/0"
  JWT_SECRET: "<your-jwt-secret>"
  LOG_LEVEL: "INFO"
```

### RBAC Setup

MUTX v1.4.0 enforces role-based access control (RBAC) with four roles: `ADMIN`, `AUDIT_ADMIN`, `DEVELOPER`, and `VIEWER`. Roles are sourced from OIDC token claims.

To enable RBAC via OIDC, set the following environment variables in your Helm values:

```yaml
# values.yaml or -f override
env:
  OIDC_ISSUER: "https://your-idp.example.com"
  OIDC_CLIENT_ID: "mutx-production"
  OIDC_JWKS_URI: "https://your-idp.example.com/.well-known/jwks.json"
```

Configure your IdP (Okta, Auth0, Keycloak, or Google) to include role claims in the tokens. MUTX extracts roles from `roles`, `groups`, `custom:roles`, `realm_access.roles`, or `resource_access.roles` claims.

See [Security Architecture](../architecture/security.md#rbac-enforcement) for the full role reference.

### OIDC Configuration

Set OIDC environment variables to validate tokens from your SSO provider:

```yaml
env:
  OIDC_ISSUER: "https://your-org.okta.com"
  OIDC_CLIENT_ID: "0oa1abc2def3ghi4jkl5"
  OIDC_JWKS_URI: "https://your-org.okta.com/oauth2/v1/keys"
```

Supported providers:

| Provider | `OIDC_ISSUER` Example | `OIDC_JWKS_URI` Pattern |
| --- | --- | --- |
| Okta | `https://org.okta.com` | `{issuer}/oauth2/v1/keys` |
| Auth0 | `https://org.us.auth0.com` | `{issuer}/.well-known/jwks.json` |
| Keycloak | `https://kc.example.com/realms/myrealm` | `{issuer}/protocol/openid-connect/certs` |
| Google | `https://accounts.google.com` | `https://www.googleapis.com/oauth2/v3/certs` |

See [Authentication](../api/authentication.md#oidc-token-validation) for the validation flow.

### Ingress Configuration

Enable ingress in values.yaml:

```yaml
ingress:
  enabled: true
  className: nginx
  host: mutx.example.com
  tls:
    enabled: true
    secretName: mutx-tls
```

Ensure your ingress controller is installed and the TLS secret exists.

### Autoscaling

The Horizontal Pod Autoscaler (HPA) is disabled by default. Enable it:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 75
```

## Resource Defaults

| Environment | CPU Request | Memory Request | CPU Limit | Memory Limit | Replicas |
|------------|-------------|----------------|-----------|--------------|----------|
| Default    | 100m        | 256Mi          | 1000m     | 1Gi          | 2        |
| Staging    | 50m         | 128Mi          | 500m      | 512Mi        | 2        |
| Production | 500m        | 1Gi            | 2000m     | 2Gi          | 3        |

## Verify Deployment

```bash
# Check pod status
kubectl get pods -n staging  # or production

# View logs
kubectl logs -n staging -l app.kubernetes.io/name=mutx

# Run test connection job
kubectl apply -f infrastructure/helm/mutx/templates/tests/test-connection.yaml
```

## Helm Lint

Validate the Helm chart:

```bash
make helm-lint

# Or directly
helm lint infrastructure/helm/mutx/
```
