# API Keys

API keys allow you to authenticate with the mutx.dev API without using session cookies or manual JWT tokens. They are ideal for automation, CI/CD, and agent-to-agent communication.

## Key Types

1.  **User API Key**: A single, permanent key assigned to your user account upon registration.
2.  **Product API Keys**: Multiple, named keys you can create, rotate, and revoke with optional expiration dates.

## Authentication

To use an API key, include it in the `X-API-Key` header of your requests:

```bash
curl -H "X-API-Key: mutx_live_your_key_here" https://api.mutx.dev/v1/agents
```

## Lifecycle Management

### List Keys

Returns a list of all active API keys associated with your account.

- **Endpoint**: `GET /api-keys`
- **Auth**: JWT required

### Create Key

Generates a new API key. The plain-text key is **only shown once** in the response.

- **Endpoint**: `POST /api-keys`
- **Auth**: JWT required
- **Body**:
    ```json
    {
      "name": "Production Deployer",
      "expires_in_days": 30
    }
    ```

### Rotate Key

Revokes the specified key and generates a new one with the same name and expiration.

- **Endpoint**: `POST /api-keys/{key_id}/rotate`
- **Auth**: JWT required

### Revoke Key

Permanently deactivates and deletes the specified API key.

- **Endpoint**: `DELETE /api-keys/{key_id}`
- **Auth**: JWT required

## Security Best Practices

- **Never share your API keys.** Treat them as securely as your password.
- **Use named keys** to track usage (e.g., "GitHub Actions", "Staging Server").
- **Set expiration dates** for temporary integrations.
- **Rotate keys regularly** to minimize the impact of potential leaks.
- **Revoke keys immediately** if you suspect they have been compromised.
