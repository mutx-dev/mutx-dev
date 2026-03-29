# TODAY.md — Frontend Developer

## Next moves
- Build a shared truth strip for `/dashboard/agents`, `/dashboard/deployments`, and `/dashboard/monitoring` so live / partial / stale / auth-blocked states are explicit before the main cards or tables render.
- Replace the generic `Live API` promise in those route headers with the actual truth state once the strip exists.
- After the truth-state pass lands, audit the next stable dashboard routes for the same drift, starting with runs, traces, budgets, and webhooks.
- Run one clean browser verification after the strip lands, and only reopen the dedicated UI executor if the route state now matches backend reality.