# UI Brief — Dashboard Truth Strip

## Problem
Several supported dashboard routes still imply “Live API” at the header level even when the page is falling back to empty states, synthesized health, or partial data.

## Proposed move
Add a shared route-level truth strip to:
- `/dashboard/agents`
- `/dashboard/deployments`
- `/dashboard/monitoring`

The strip should say whether the page is:
- live
- partial
- stale
- auth-blocked

## Why this is the next move
This is the fastest way to make the operator surface honest without expanding shell chrome or inventing backend capability.

## Acceptance
- The operator can tell at a glance whether each page is reading real data or fallback state.
- No route suggests a healthy live state when it is actually partial or degraded.
- The implementation is shared, not one-off copy.
