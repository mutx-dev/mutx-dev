# Authentication

MUTX uses JWT-based user auth for interactive sessions.

Successful `register`, `login`, `local-bootstrap`, and `refresh` calls all return a token pair.

## Endpoints

| Route | Purpose |
| --- | --- |
| `POST /v1/auth/register` | Create a user and return access + refresh tokens |
| `POST /v1/auth/login` | Exchange email and password for a token pair |
| `POST /v1/auth/local-bootstrap` | Localhost-only bootstrap for non-production local setups |
| `POST /v1/auth/refresh` | Exchange a refresh token for a fresh token pair |
| `POST /v1/auth/logout` | Revoke the provided refresh token family or all user refresh sessions |
| `GET /v1/auth/me` | Return the authenticated user profile |
| `POST /v1/auth/forgot-password` | Start password reset flow |
| `POST /v1/auth/reset-password` | Complete password reset and revoke prior refresh sessions |
| `POST /v1/auth/verify-email` | Mark an email as verified |
| `POST /v1/auth/resend-verification` | Re-send verification email |
| `GET /v1/auth/oauth/{provider}/authorize` | Build an OAuth authorization URL for a social provider |
| `POST /v1/auth/oauth/{provider}/exchange` | Exchange an OAuth authorization code for a MUTX token pair |
| `GET /v1/auth/sso/{provider}` | Initiate SSO by redirecting to the provider's authorization endpoint |
| `GET /v1/auth/sso/{provider}/callback` | Handle SSO callback and issue a MUTX access token |

## Password Policy

`register` and `reset-password` enforce the current password validator in `src/api/auth/password.py`:

- at least 8 characters
- at least one uppercase letter
- at least one lowercase letter
- at least one number
- at least one special character

## Register

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@example.com",
    "name": "Operator",
    "password": "StrongPass1!"
  }'
```

Example response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

## Login

```bash
curl -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@example.com",
    "password": "StrongPass1!"
  }'
```

`login` returns the same token payload shape as `register`.

## Local Bootstrap

`POST /v1/auth/local-bootstrap` exists for localhost operator setup.

It is rejected in production and rejected for non-loopback callers.

```bash
curl -X POST "$BASE_URL/v1/auth/local-bootstrap" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Operator"}'
```

## Refresh

```bash
curl -X POST "$BASE_URL/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

The response is another access + refresh token pair. The refresh token family is rotated.

## Logout

`logout` supports two patterns:

- send `Authorization: Bearer <access_token>` to revoke all refresh sessions for the current user
- send a `refresh_token` body to revoke that refresh token family directly

```bash
curl -X POST "$BASE_URL/v1/auth/logout" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Example response:

```json
{
  "message": "Successfully logged out"
}
```

## Current User

```bash
curl "$BASE_URL/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Example response:

```json
{
  "id": "uuid",
  "email": "operator@example.com",
  "name": "Operator",
  "plan": "free",
  "created_at": "2026-03-22T12:00:00Z",
  "is_active": true,
  "is_email_verified": false
}
```

## Password Reset And Email Verification

All four endpoints use small request bodies and message responses:

- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/verify-email`
- `POST /v1/auth/resend-verification`

Examples:

```bash
curl -X POST "$BASE_URL/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@example.com"}'

curl -X POST "$BASE_URL/v1/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"RESET_TOKEN","new_password":"NewStrongPass1!"}'
```

`forgot-password` and some verification flows intentionally return generic success messages to reduce account enumeration.

## OAuth Social Login

MUTX supports social login via external OAuth providers (e.g. GitHub, Google).

### Authorize

```bash
curl "$BASE_URL/v1/auth/oauth/github/authorize?redirect_uri=https://localhost:3000/api/auth/oauth/github/callback&state=RANDOM_STATE"
```

Returns an `authorization_url` to redirect the user to:

```json
{
  "authorization_url": "https://github.com/login/oauth/authorize?..."
}
```

### Exchange

```bash
curl -X POST "$BASE_URL/v1/auth/oauth/github/exchange" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "OAUTH_CODE",
    "redirect_uri": "https://localhost:3000/api/auth/oauth/github/callback"
  }'
```

Returns the same token payload shape as `register` (`access_token`, `refresh_token`, `token_type`, `expires_in`).

If the OAuth user does not yet exist in MUTX, it is created automatically.

## SSO Provider Login

SSO login supports Okta, Auth0, Keycloak, and Google.

### Initiate SSO

```bash
curl "$BASE_URL/v1/auth/sso/okta"
```

Returns a `302` redirect to the provider's authorization URL.

### SSO Callback

The provider redirects back to `GET /v1/auth/sso/{provider}/callback?code=...&state=...`.

On success, the callback returns a MUTX access token:

```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

## OIDC Token Validation

MUTX v1.4.0 adds OpenID Connect (OIDC) token validation for SSO integrations. When configured, bearer tokens issued by an external OIDC provider (Okta, Auth0, Keycloak, Google) are validated and mapped to the internal `SSOTokenUser` model.

### Configuration

Set the following environment variables to enable OIDC validation:

| Variable | Description | Example |
| --- | --- | --- |
| `OIDC_ISSUER` | Token issuer URL (your IdP domain) | `https://your-org.okta.com` |
| `OIDC_CLIENT_ID` | Expected `aud` claim for your MUTX client | `0oa1abc2def3ghi4jkl5` |
| `OIDC_JWKS_URI` | JWKS endpoint for public key retrieval | `https://your-org.okta.com/oauth2/v1/keys` |

These map to the provider configuration resolved in `src/api/services/auth.py`. Each supported provider has a well-known OIDC config and JWKS URL template built in:

```python
PROVIDER_OIDC_CONFIG = {
    SSOProvider.OKTA:      "{domain}/.well-known/openid-configuration",
    SSOProvider.AUTH0:     "{domain}/.well-known/openid-configuration",
    SSOProvider.KEYCLOAK:  "{domain}/realms/{realm}/.well-known/openid-configuration",
    SSOProvider.GOOGLE:    "https://accounts.google.com/.well-known/openid-configuration",
}
```

### Validation Flow

1. **JWKS fetch** -- The server fetches the provider's JWKS from the configured URI and caches matching public keys.
2. **Signature check** -- The token's RS256/ES256 signature is verified against the matching JWKS key (by `kid`).
3. **Claims validation** -- The `iss` (issuer) and `exp` (expiry) claims are validated. If `OIDC_CLIENT_ID` is set, the `aud` (audience) claim is also checked.
4. **Fallback** -- If the token cannot be verified as a JWT (opaque access tokens), the server falls back to the provider's `/userinfo` endpoint.

### OIDC-to-SSOTokenUser Mapping

After verification, the OIDC token claims are mapped to an `SSOTokenUser` instance:

| OIDC Claim | SSOTokenUser Field | Notes |
| --- | --- | --- |
| `sub` | `id` | Unique subject identifier |
| `email` | `email` | Falls back to `preferred_username` |
| `roles` / `groups` | `roles` | Extracted from multiple claim locations (see below) |
| - | `is_active` | Always `True` for valid tokens |
| - | `is_email_verified` | Always `True` for valid OIDC tokens |

Role extraction checks multiple claim locations in order:

- `roles`
- `groups`
- `custom:roles`
- `realm_access.roles` (Keycloak)
- `resource_access.roles` (Keycloak)

See `src/api/services/auth.py` (`_extract_roles_from_payload`) and `src/api/dependencies.py` (`SSOTokenUser`) for the full implementation.

## Token Lifetimes

Access and refresh token lifetimes are server-configured in `src/api/auth/jwt.py` and settings.

Use the returned `expires_in` value instead of hardcoding assumptions in clients or docs.
