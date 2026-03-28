# Outbound Brief — 2026-03-28

**Best wedge:** platform / developer-infra teams shipping an agent product with public API, CLI, SDK, and docs surfaces that already drift.

**Core message:** keep the control plane truthful across dashboard, API, CLI, SDK, and docs so operators trust what is actually live.

**Trigger:** a release, docs, or onboarding change that exposes API/CLI/SDK/dashboard mismatch.

**Safe proof points:** canonical `/dashboard`, live `/v1/*`, explicit supported vs preview split, signed Mac download lane, and honest current-state docs.

**Do not lead with:** self-healing, runtime autonomy, or “it fixes itself” claims. Issue `#39` is not a strong proof point yet.
