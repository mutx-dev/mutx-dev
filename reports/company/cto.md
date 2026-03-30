# CTO — 2026-03-19 10:37 Europe/Rome

Recommendation: **promote `#117` above `#39` in the active backlog and make `deployment contract parity` the next canonical backend lane.**

Why this is a material update from 09:52:
- Since the last CTO note, the frontend convergence work kept landing on `main`:
  - `739760e1` collapsed the last `Swarm` alias into `Deployments`
  - `b0795c02` collapsed more stale `/app/*` routes into canonical `/dashboard/*`
- That means the product architecture is now more settled than it was an hour ago:
  - one canonical operator surface: `/dashboard`
  - one canonical resource framing: `Deployments`, not borrowed aliases
  - fewer duplicate route trees left to argue about

That changes the dependency order.

The highest-leverage technical move is no longer broad monitoring/self-healing work under `#39`.
That issue is still important, but right now it is too wide, too timeout-prone, and too easy to turn into another backend thrash lane.

The sharper unlock is `#117`:
**Close deployment surface parity drift across API, CLI, SDK, and docs.**

Why `#117` should go first now:
1. **It matches the canonical UI.** The shell now consistently points operators toward `Deployments`; the backend/client/doc contract for that resource should become truthful next.
2. **It is narrower than `#39`.** Better bounded work means a better chance of re-enabling a backend execution lane without recreating the recent 540s timeout pattern.
3. **It unlocks demoability faster.** A truthful deployment lifecycle surface across server + SDK/CLI/docs is more valuable in the next week than deeper self-healing internals that users cannot yet feel.
4. **It gives later monitoring work a stable noun.** Monitoring/self-healing should attach to a coherent deployment/runtime contract, not evolve in parallel with a still-drifting surface.

Concrete backlog adjustment:
- **Reorder the top of `autonomy-queue.json` to:**
  1. `#117` — deployment parity
  2. `#39` — monitoring/self-healing runtime integration
- Keep `#114`, `#115`, `#112` behind those two.

Recommended execution scope for the next backend lane:
- only deployment-facing contract truth:
  - create
  - restart
  - logs
  - metrics
  - event history
  - SDK/CLI/docs parity
  - focused contract tests
- explicitly **do not** reopen broad self-healing/runtime plumbing in the same pass

Net: the architecture has converged enough on canonical `/dashboard` + `Deployments` that the next unlock is to make the deployment contract truthful everywhere. **`#117` is now the right first backend wedge; `#39` should follow once that foundation is stable.**
