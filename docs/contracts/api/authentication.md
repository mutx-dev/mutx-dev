---
description: Register, log in, refresh tokens, inspect identity, and log out.
icon: lock
---

# Authentication API

The auth flow is the most complete part of the current API surface.

## Endpoints

| Route                 | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `POST /v1/auth/register` | Create a user and return tokens                                   |
| `POST /v1/auth/login`    | Exchange email and password for tokens                            |
| `POST /v1/auth/refresh`  | Exchange a refresh token for a new access token and refresh token |
| `POST /v1/auth/logout`   | Return a success message                                          |
| `GET /v1/auth/me`        | Return the current user profile                                   |

## Password Rules

`POST /v1/auth/register` currently requires passwords that contain:

* at least 8 characters
* one uppercase letter
* one lowercase letter
* one number
* one special character

## Token Lifetimes

From `src/api/auth/jwt.py` and `src/api/config.py`:

* access token: 30 minutes
* refresh token: 7 days

## Register

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "name": "You",
    "password": "StrongPass1!"
  }'
```

Example response:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

## Login

```bash
curl -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "StrongPass1!"
  }'
```

## Refresh

```bash
curl -X POST "$BASE_URL/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
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
  "email": "you@example.com",
  "name": "You",
  "plan": "free",
  "api_key": "...",
  "created_at": "2026-03-08T10:00:00Z",
  "is_active": true
}
```

## Logout

```bash
curl -X POST "$BASE_URL/v1/auth/logout" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Current implementation note: `logout` returns a success message but does not revoke tokens server-side.

## Common Status Codes

| Status | Meaning                                                |
| ------ | ------------------------------------------------------ |
| `201`  | Registration succeeded                                 |
| `200`  | Login, refresh, logout, or profile lookup succeeded    |
| `400`  | Email already registered or password failed validation |
| `401`  | Invalid credentials or invalid refresh token           |
| `403`  | Account is deactivated                                 |
| `422`  | Request validation failed                              |
