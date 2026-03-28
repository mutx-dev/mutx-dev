## Outbound brief — 2026-03-28

**Best wedge:** platform / developer-infra teams shipping an agent product with public API, CLI, SDK, and docs surfaces that already drift.

**Why this beats the broader platform/infra bucket:** the pain is concrete. Teams do not need a vague “agent platform” pitch; they need their control plane story to stay truthful across surfaces.

**Trigger to watch:** a release, docs, or onboarding change that exposes API/CLI/SDK/dashboard mismatch. That is when the buyer feels contract risk.

**Message angle:**
> MUTX helps you keep the control plane truthful across dashboard, API, CLI, SDK, and docs so operators trust what is actually live.

**Proof points we can safely use:**
- canonical `/dashboard`
- live `/v1/*` contract
- explicit supported vs preview surface split
- signed Mac download lane
- honest current-state docs

**Do not lead with:** self-healing, runtime autonomy, or “it fixes itself” claims. Issue `#39` is still not a strong proof point.
