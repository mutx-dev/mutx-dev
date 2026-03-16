# API Keys

API keys provide service-to-service authentication without user sessions.

## Endpoints

### List API Keys

Retrieve all API keys for the authenticated user.

```http
GET /api-keys
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "data": [
    {
      "id": "key_abc123",
      "name": "Production Service",
      "prefix": "mk_live_",
      "created_at": "2024-01-15T10:30:00Z",
      "last_used_at": "2024-01-20T15:45:00Z",
      "expires_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### Create API Key

Generate a new API key.

```http
POST /api-keys
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "CI/CD Pipeline",
  "expires_in_days": 90,
  "permissions": ["read:deployments", "write:deployments"]
}
```

**Response:**

```json
{
  "id": "key_xyz789",
  "name": "CI/CD Pipeline",
  "key": "mk_live_abc123def456...",  // Only shown once!
  "prefix": "mk_live_",
  "created_at": "2024-01-20T10:30:00Z",
  "expires_at": "2024-04-20T10:30:00Z"
}
```

> ⚠️ **Important:** The full key is only returned once at creation time. Store it securely!

---

### Get API Key Details

Retrieve details of a specific API key.

```http
GET /api-keys/{key_id}
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": "key_abc123",
  "name": "Production Service",
  "prefix": "mk_live_",
  "created_at": "2024-01-15T10:30:00Z",
  "last_used_at": "2024-01-20T15:45:00Z",
  "expires_at": "2025-01-15T10:30:00Z",
  "permissions": ["read:deployments", "write:deployments"]
}
```

---

### Rotate API Key

Rotate (regenerate) an existing API key.

```http
POST /api-keys/{key_id}/rotate
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": "key_abc123",
  "name": "Production Service",
  "key": "mk_live_newkey...",  // New key - shown once!
  "prefix": "mk_live_",
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2025-01-15T10:30:00Z"
}
```

---

### Delete API Key

Revoke an API key.

```http
DELETE /api-keys/{key_id}
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "API key deleted successfully"
}
```

## Using API Keys

Include the API key in requests:

```bash
curl -H "X-API-Key: mk_live_abc123def456" \
  https://api.mutx.dev/deployments
```

Or as a Bearer token:

```bash
curl -H "Authorization: Bearer mk_live_abc123def456" \
  https://api.mutx.dev/deployments
```

## Best Practices

1. **Never commit keys to version control**
2. **Use environment variables** for key storage
3. **Set expiration dates** - shorter is safer
4. **Rotate keys regularly**
5. **Use minimal permissions** - only grant what's needed
6. **Monitor usage** - check `last_used_at` regularly
