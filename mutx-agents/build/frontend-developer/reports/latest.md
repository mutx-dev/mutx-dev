# latest.md — Frontend Developer

## UI brief
- **Move:** add a shared truth strip to `/dashboard/agents`, `/dashboard/deployments`, and `/dashboard/monitoring` that shows whether the data is live, partial, stale, or auth-blocked before the main cards/tables render.
- **Why now:** the route headers already claim “Live API,” but the pages still fall back to generic empties or synthesized health state when backend data is missing. Operators need to know what is actually real.
- **Scope:** one small shared component fed by fetch outcome + freshness + auth state; wire it into the three highest-traffic operational routes first.
- **Acceptance:** no page implies a healthy live state when it is reading partial or fallback data; the top of each route tells the truth in one glance.
