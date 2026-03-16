# API Overview

The MUTX API provides a RESTful interface for managing agents, deployments, webhooks, and other platform resources.

## Base URL

```
https://api.mutx.dev
```

## Authentication

All API requests require authentication via:
- **Bearer tokens** (JWT) for user authentication
- **API keys** for service-to-service communication

See [authentication.md](./authentication.md) and [api-keys.md](./api-keys.md) for details.

## Request Format

All request bodies should be JSON:

```bash
curl -X POST https://api.mutx.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'
```

## Response Format

All responses follow this structure:

```json
{
  "data": { ... },
  "message": "Success"
}
```

Error responses:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

## Rate Limiting

API requests are rate-limited. See response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## API Sections

| Section | Description |
|---------|-------------|
| [Authentication](./authentication.md) | Login, register, password management |
| [API Keys](./api-keys.md) | Service authentication tokens |
| [Agents](./agents.md) | Agent registration, commands, metrics |
| [Deployments](./deployments.md) | Deployment management and scaling |
| [Webhooks](./webhooks.md) | Webhook configuration and delivery |
| [Leads](./leads.md) | Lead management |

## OpenAPI Schema

For detailed endpoint specifications, see the [OpenAPI JSON](./openapi.json) file.

## SDK

Official SDKs are available for:
- Python: `pip install mutx-sdk`
- JavaScript/TypeScript: `npm install @mutx/sdk`

See [SDK documentation](../../sdk.md).
