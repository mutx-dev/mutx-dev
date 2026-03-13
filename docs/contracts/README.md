---
description: Contract guardrails for coding against the live MUTX API.
icon: scale-balanced
---

# API Source of Truth

This document serves as the high-level contract reference for all API interactions. Coding agents MUST consult this document and `docs/api/openapi.json` before writing any code that consumes or provides API endpoints.

## 1. Waitlist API (`/api/newsletter`)

Used by the landing page for capturing early access intent.

* **Endpoint**: `POST /api/newsletter`
*   **Request Body**:

    ```json
    {
      "email": "string (email)",
      "source": "string (optional)"
    }
    ```
* **Constraint**: Field `email` is MANDATORY and must pass regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
* **Response**: `200 OK` on success, `400` on validation error, `500` on server error.
* **Side Effects**: Inserts into `waitlist` Postgres table, triggers Resend email (template `waitlist`).

## 2. Agent Management (`/agents`)

* **Endpoints**:
  * `POST /agents`: Create new agent. Requires `name`, `description`, and `config` (as a JSON string). Ownership comes from the authenticated user.
  * `GET /agents`: List agents for current user.
  * `GET /agents/{agent_id}`: Detail view.
* **Critical Caveat**: The `config` field MUST be passed as a serialized **JSON string**, not a raw JSON object. Agents: do not attempt to send a raw object; stringify it first.

## 3. Deployment Lifecycle (`/deployments`)

* **Endpoints**:
  * `GET /deployments`: List status.
  * `POST /deployments/{deployment_id}/scale`: Adjust replica count.
* **State Machine**:
  * Valid Statuses: `creating` | `running` | `stopped` | `failed`.
  * Deployment Actions: Always require `deployment_id`.

## 4. Operational Principles

* **Route Truth**: The FastAPI app in `src/api/` is the absolute source of truth.
* **No Prefix**: Routes do NOT use `/v1`.
* **Type Safety**: Always generate TypeScript types from `docs/api/openapi.json` using `openapi-typescript` instead of writing custom interface files.
