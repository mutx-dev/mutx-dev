# Kubernetes Deployment Guide for MUTX

This guide covers deploying MUTX to Kubernetes using Helm charts or raw YAML manifests.

## Prerequisites

- Helm 3.x installed ([Install Guide](https://helm.sh/docs/intro/install/))
- kubectl configured to access your Kubernetes cluster
- Docker image `mutx/mutx` pushed to your registry (or use the default)

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
  DATABASE_URL: "postgresql://user:pass@postgres:5432/mutx"
  REDIS_URL: "redis://redis:6379/0"
  LOG_LEVEL: "INFO"
```

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
