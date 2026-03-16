# Authentication

MUTX supports JWT-based authentication for user sessions.

## Endpoints

### Register

Create a new user account.

```http
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "email_verified": false
}
```

---

### Login

Authenticate and receive access tokens.

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### Refresh Token

Refresh an expired access token.

```http
POST /auth/refresh
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### Logout

Invalidate the current session.

```http
POST /auth/logout
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Successfully logged out"
}
```

---

### Get Current User

Retrieve the authenticated user's profile.

```http
GET /auth/me
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "email_verified": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Verify Email

Confirm user's email address.

```http
POST /auth/verify-email
```

**Request Body:**

```json
{
  "token": "verification_token_from_email"
}
```

---

### Resend Verification Email

Resend the email verification link.

```http
POST /auth/resend-verification
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

---

### Forgot Password

Request a password reset email.

```http
POST /auth/forgot-password
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

---

### Reset Password

Reset password using the reset token.

```http
POST /auth/reset-password
```

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "new_password": "newsecurepassword123"
}
```

## Using Tokens

Include the access token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  https://api.mutx.dev/agents
```

Tokens expire after 1 hour (3600 seconds). Use the refresh token to obtain new access tokens.
