# Approvals API

MUTX exposes one durable approval workflow through the canonical
`/v1/approvals` routes. The compatibility routes under
`/v1/security/approvals` read and mutate the same database records.

## Identity, entitlement, and assignment

- The authenticated user is the approval owner; callers cannot supply `owner_id`.
- Creating an approval is a paid owner capability and requires the route's
  developer/admin role.
- A request can be assigned with `reviewer_id`. Use
  `GET /v1/approvals/reviewers` from that entitled creator context to discover
  active eligible reviewers.
- Resolving an approval requires an authenticated developer/admin who is
  eligible for that record. An explicitly assigned developer can resolve even
  when their own subscription is free; the paid entitlement was checked when
  the owner created the request.
- Owners cannot resolve their own requests.

Every approval response includes `owner_id`, `reviewer_id`, and
`can_resolve`. `can_resolve` is computed for the authenticated caller from the
current status, assignment, ownership, and persisted roles. Clients must use it
to decide whether to render approval actions, but the server remains the final
authorization boundary.

## Canonical routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/v1/approvals` | Create a durable approval; accepts optional `reviewer_id` |
| `GET` | `/v1/approvals` | List approvals visible to the caller |
| `GET` | `/v1/approvals/reviewers` | List active users eligible for assignment |
| `GET` | `/v1/approvals/{request_id}` | Read one visible approval |
| `POST` | `/v1/approvals/{request_id}/approve` | Approve by request ID |
| `POST` | `/v1/approvals/{request_id}/reject` | Reject by request ID |
| `GET` | `/v1/approvals/{request_id}/events` | Read transactional lifecycle evidence |

## Legacy security compatibility

The legacy creation shape remains available at
`POST /v1/security/approvals/request`. It accepts the tool/action context and
optional `reviewer_id`, then creates a canonical durable approval.

The corresponding read and mutation routes use `request_id`:

- `GET /v1/security/approvals/{request_id}`
- `POST /v1/security/approvals/{request_id}/approve`
- `POST /v1/security/approvals/{request_id}/deny`

No approval secret or one-time bearer token is returned or accepted. The
ordinary authenticated principal plus persisted assignment/role checks govern
resolution.

## Deadlines, escalation, and audit

Requests expire after one hour by default. The migration derives deadlines for
existing rows from their original creation time. Creation accepts `timeout_seconds`
(60–86400) and optional `escalation_seconds` (default 900). An escalation deadline
at or beyond expiry is disabled. Once due, pending requests move from the assigned
reviewer to the administrator queue; owners still cannot approve their own requests.
Deadline transitions are persisted on reads, decisions, and execution attempts.
They require no scheduled GitHub workflow. Expired approvals cannot authorize work.

`GET /v1/approvals/{request_id}/events` returns creation, escalation, resolution,
expiry, and consumption evidence under the approval's existing visibility rules.
Each event commits in the same database transaction as the state change.

## Governed runtime approval enforcement

`POST /v1/policies/evaluate-and-request-approval` evaluates the caller's policies
and creates an action-bound canonical approval when needed. Plain `/evaluate`
remains side-effect-free. Policy context secrets are redacted before persistence.

Managed `ToolExecutionHandler.execute_tool` calls with a trusted `user_id` evaluate
that owner's durable policies before invoking the handler. A tenant `block` always
halts; tenant `require_approval` or runtime `DEFER` creates a canonical approval and
returns its ID without executing. Callers must pass the same owner, agent, run,
session, tool, and arguments plus `approval_id` to resume after reviewer approval.
Policy versions are re-evaluated, and approval consumption uses a conditional
UPDATE so only one worker can execute. Changed arguments, expired/rejected requests,
and reused approvals fail closed. Runtime receipts and audit events carry the
approval ID through authorization and execution.

Consumption provides **at-most-once authorization**, not guaranteed execution: if a
worker crashes or authorization-evidence persistence fails after claiming approval,
that approval stays consumed. An operator must investigate and explicitly request
a new action rather than retry a potentially executed side effect. Arbitrary handlers
are not serialized; the caller owns continuation storage. Ownerless `DEFER` calls
remain blocked with `resumable: false`.
