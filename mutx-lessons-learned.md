# MUTX Fleet Lessons Learned

## What Works
1. Running multiple factory workers in parallel = more PRs
2. Quality scoring before merge = better code
3. Auto-retry CI failures = fewer manual interventions
4. Staggered schedules = avoid rate limits

## What Doesn't Work
1. Workers picking same issue = conflicts
2. No label on issues = random selection
3. Long timeouts = stuck workers

## Bug Patterns Fixed
1. **JWT_SECRET too short** - Test config needed 32+ chars
2. **plan.value vs plan** - String vs Enum mismatch after migration
3. **Railway EU West outage** - Need fallback region

## Improvements Made
1. Added priority queue (P0 first)
2. Added human escalation for 3x failures
3. Added centralized state file
4. Added metrics dashboard

## Notes
- Keep factory workers focused (backend vs frontend)
- Quality score threshold at 70 is working well
- 1-minute cadence is aggressive but effective
