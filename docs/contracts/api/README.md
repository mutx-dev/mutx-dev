---
description: Reference index for routes, auth, resources, and webhook flows.
icon: code
---

# API

Use this section for route-level reference and integration details.

<table data-view="cards"><thead><tr><th>Title</th><th data-card-target data-type="content-ref">Target</th></tr></thead><tbody><tr><td>Start with the route map</td><td><a href="index.md">index.md</a></td></tr><tr><td>Auth and tokens</td><td><a href="authentication.md">authentication.md</a></td></tr><tr><td>Agents and lifecycle</td><td><a href="agents.md">agents.md</a></td></tr><tr><td>Deployments and events</td><td><a href="deployments.md">deployments.md</a></td></tr><tr><td>Keys, hooks, and ingestion</td><td><a href="api-keys.md">api-keys.md</a></td></tr><tr><td>Contract guardrails</td><td><a href="../">..</a></td></tr></tbody></table>

### By resource

* [API Overview](index.md)
* [Authentication API](authentication.md)
* [API Keys](api-keys.md)
* [Agents API](agents.md)
* [Deployments API](deployments.md)
* [Webhooks and Ingestion API](webhooks.md)
* [Leads API](leads.md)

{% hint style="info" %}
The live FastAPI app does not use a global `/v1` prefix.
{% endhint %}

## CORS and Security

The API implements CORS and security headers for production use.

### Allowed Origins

The following origins are allowed to make cross-origin requests:

- `http://localhost:3000` - Local development
- `http://app.localhost:3000` - Local app development  
- `https://mutx.dev` - Production marketing site
- `https://app.mutx.dev` - Production app

To configure additional origins, set the `CORS_ORIGINS` environment variable as a comma-separated list (or a JSON array).

### Security Headers

The API automatically adds the following security headers to all responses:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains` - HSTS
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer policy
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - Disable unused features

### CSRF Protection

For state-changing operations (POST, PUT, PATCH, DELETE), the API validates that the request origin is in the allowed origins list. Requests with disallowed origins will receive a 403 Forbidden response.
