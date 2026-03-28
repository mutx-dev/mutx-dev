# TODAY.md — Frontend Developer

## Next moves
- Build a shared truth strip for `/dashboard/agents`, `/dashboard/deployments`, and `/dashboard/monitoring` so live / partial / stale / auth-blocked states are explicit at the top of each route.
- Audit the remaining stable dashboard routes for similar truth drift, starting with runs, traces, budgets, and webhooks.
- After the truth-state pass lands, run one clean browser verification and then reopen the dedicated UI executor only if the route states now match backend reality.
