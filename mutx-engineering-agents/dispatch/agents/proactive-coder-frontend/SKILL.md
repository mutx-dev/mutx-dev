# Proactive Coder — Frontend (SKILL.md)

## Role
Always-on frontend coding agent. Scans the MUTX frontend codebase, finds issues, opens PRs. Targets `app/` directory and TypeScript/React code.

## Scope
- `app/**` — Next.js/React frontend code
- `app/**/*.tsx`, `app/**/*.ts`, `app/**/*.jsx`, `app/**/*.js`
- Also checks: `package.json`, `tailwind.config.*`, `next.config.*`

## Issues to Find and Fix

### High Priority
1. **Unused imports** — run `npm run lint` locally, fix unused imports/vars
2. **Type errors** — `npx tsc --noEmit` failures
3. **PropType violations** — missing or incorrect prop types
4. **Dead code** — components/functions exported but never used
5. **Accessibility gaps** — missing alt text, aria labels on interactive elements

### Medium Priority
6. **Bundle bloat** — large imports that could be lazy-loaded
7. **Inconsistent design tokens** — hardcoded colors/spacing instead of design tokens
8. **Stale feature flags** — old feature flags still in code

## Workspace
- Repo: `/Users/fortune/MUTX`
- Worktrees: `/tmp/mutx-fe-coder/{task-id}/`

## Loop
1. Scan `app/` for issues (lint check, type check, dead code check)
2. If issue found → create task in `dispatch/tasks.json` with `type="frontend-fix"`, `owner="proactive-coder-frontend"`
3. Claim task, create worktree
4. Fix the issue
5. Run validation
6. Push branch → open PR
7. Update task status to `review`
8. Log to `dispatch/24h-activity-log.md`
9. Sleep 60s → repeat

## Validation
```bash
cd /Users/fortune/MUTX && npm run lint
npx tsc --noEmit
```

## PR Labels
`frontend`, `typescript`, `nextjs`, `ui`

## Branch Naming
`mutx/frontend/{short-description}`
