# Product Decision Brief — 2026-03-29

## Lane utility verdict
- **Status:** STRONG
- **Recommendation:** KEEP

## What changed in truth
- The outside-in signal is now sharper: the market is describing agent products as **governed execution** — isolation, constrained outputs, logging, scoped credentials, policy controls, and enforceable boundaries.
- MUTX already has the right lane shape for that story: supported `/dashboard`, signed desktop download, release summary, and docs-backed release notes are all positioned as the trusted surfaces.
- The bottleneck did **not** move operationally: the roundtable is still review-bound, no merge-ready PRs landed, and independent approvals plus CI remain the gate.
- SDK truth is still delicate: `MutxAsyncClient` remains limited/deprecated, so async support should stay out of the supported story until the contract is real.

## Exact evidence
- `reports/roundtable.md` — state remains review-bound; product/runtime truth on `/dashboard` must stay conservative.
- `gtm/outside-in-intelligence/reports/signal-brief.md` — market language has shifted to governed execution, secure defaults, policy controls, and comprehensive logging.
- `queue/TODAY.md` — current product priorities center on supported surfaces, first deployment path, and async contract honesty.
- `README.md` and `docs/surfaces.md` in `/Users/fortune/MUTX` — supported surfaces are already defined around `mutx.dev/download/macos`, `mutx.dev/releases`, and `app.mutx.dev/dashboard`.
- `sdk.md` / `sdk/README.md` / `tests/test_sdk_async_client_contract.py` in `/Users/fortune/MUTX` — `MutxAsyncClient` is explicitly deprecated/limited.
- Fresh truth pass command: `rg -n "MutxAsyncClient|/dashboard|mutx.dev/download|mutx setup hosted|v1.3|releases" /Users/fortune/MUTX -g '!node_modules' -g '!dist'`

## If idle or blocked, why exactly
- The product lane is blocked by truth maintenance, not by a missing grand plan: supported surfaces are defined, but the live review/merge gate is still elsewhere.
- The real constraint is approval throughput plus CI, so this lane should not invent new scope while the release story is still being validated.

## What Fortune can do with this today
- Keep selling only the supported path: download/install, authenticate, deploy once, and confirm runtime truth in `/dashboard`.
- Treat any preview or placeholder route as internal-only until it is wired into the supported narrative.
- Keep async SDK ambiguity out of design-partner conversations.

## What should change in this lane next
- Tighten the `/dashboard` truth strip so docs, overview copy, and runtime state all say the same thing.
- Keep the supported story narrow until review pressure clears and the release lane proves stable.
- Do not expand the product narrative until the first 15 minutes path is clean enough to trust.
