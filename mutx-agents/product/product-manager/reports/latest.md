# latest.md — Product Manager

- Product truth moved materially: v1.3 gives MUTX one coherent public operator story across `mutx.dev/download`, `mutx.dev/releases`, the v1.3 docs note, and the supported `/dashboard` surface.
- That changes the product priority. Deployment lifecycle parity is now reflected across API, CLI, SDK, docs, and contract tests, so the old issue #117 brief is no longer the sharpest blocker.
- The single highest-leverage move now is to lock one design-partner-ready “first 15 minutes” path: install or download, authenticate, deploy once, and see truthful runtime state without crossing into preview territory.
- Why this matters: it is the shortest path from curiosity to trust. If that path is clean, revenue conversations get easier; if it is fuzzy, the new release surfaces become marketing overhead instead of proof.
- Remaining trust trap: `MutxAsyncClient` is still explicitly limited/deprecated, so async SDK ambiguity should stay out of the supported story until the contract is real.
