# OIDC Token Validation

> OpenID Connect token validation in MUTX.

## Configuration

Set via environment variables:

- `OIDC_ISSUER`
- `OIDC_CLIENT_ID`
- `OIDC_JWKS_URI`

## Supported Providers

- Okta
- Auth0
- Azure AD
- Keycloak

## Implementation

JWKS fetcher with TTL cache, JWT signature validation, iss/aud/exp claim checks.
