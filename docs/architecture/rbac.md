# RBAC

> Role-Based Access Control in MUTX.

## Overview

MUTX uses RBAC to control access to resources based on user roles.

## Roles

| Role | Description |
|------|-------------|
| `owner` | Full access to all resources |
| `admin` | Manage agents, users, and settings |
| `member` | Create and manage own agents |
| `viewer` | Read-only access |

## Implementation

Roles are enforced at the API layer via FastAPI dependencies.
