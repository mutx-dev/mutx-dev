# Docs brief — 2026-03-28

## Gap closed
`docs/deployment/quickstart.md` still described the local app surface as an “app shell” and did not name the canonical dashboard route. That leaves onboarding ambiguous after the `/dashboard` cutover.

Source: `docs/deployment/quickstart.md`

## What changed
- Added `http://localhost:3000/dashboard` to the local URLs list.
- Replaced “site and app shell” with “site and dashboard” so the bootstrap path matches current operator truth.

## Why it matters
This is the first place many operators land after install. If the quickstart still points them at legacy app-shell language, it weakens the `/dashboard` truth stack right at entry.

## Next docs move
Sweep the remaining operator-facing docs for old `app/app` wording, starting with `docs/app-dashboard.md` and `docs/overview.md`.
