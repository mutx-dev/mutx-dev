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

## Token Lifetimes

Access and refresh token lifetimes are server-configured in `src/api/auth/jwt.py` and settings.

Use the returned `expires_in` value instead of hardcoding assumptions in clients or docs.
