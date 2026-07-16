# OIDC Token Validation

> OpenID Connect token validation in MUTX.

## Configuration

Set all three values together via environment variables:

- `OIDC_ISSUER`
- `OIDC_CLIENT_ID`
- `OIDC_JWKS_URI`

## Supported Providers

- Okta
- Auth0
- Azure AD
- Keycloak

## Implementation

`src/api/auth/oidc.py` provides the per-URI TTL cache, JWT signature
validation, and `iss`/`aud`/`exp` claim checks. Route auth and RBAC dependencies
are exposed through `src/api/auth/dependencies.py`.
