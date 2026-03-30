## Summary
- tighten the shared ownership helper used by agent-facing Next API routes
- enforce ownership checks across the agent read / deploy / stop / logs surfaces
- cover the narrowed ownership path with focused route tests

## Scope
- `app/api/_lib/ownership.ts`
- `app/api/agents/[id]/route.ts`
- `app/api/agents/[id]/deploy/route.ts`
- `app/api/agents/[id]/stop/route.ts`
- `app/api/agents/[id]/logs/route.ts`
- `app/api/dashboard/agents/[agentId]/route.ts`
- `tests/unit/agentOwnershipRoutes.test.ts`

## Testing
- `npm run test:app -- --runInBand tests/unit/agentOwnershipRoutes.test.ts` ✅
  - actual Jest result on this branch: 9 passing suites / 89 passing tests / 1 skipped suite
  - expected console warning observed for the denied-ownership path
