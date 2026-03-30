---
description: Compatibility page pointing to the canonical auth docs.
icon: lock
---

# Legacy Authentication Link

Use the canonical page in [`../../api/authentication.md`](../../api/authentication.md).

## Current Truth

- auth routes live under `/v1/auth/*`
- `register`, `login`, `refresh`, and `local-bootstrap` return token pairs
- token lifetimes are server-configured, so clients should trust `expires_in`

## Canonical Page

- [Authentication](../../api/authentication.md)
