# MUTX Fleet Prompt Variants

## Factory Worker Variants

### Variant A (Current)
```
Pick unassigned issues, fix, validate, push
```

### Variant B (Aggressive)
```
Pick the easiest P0 issue first. Fix fast. 
Don't overthink. Ship it.
```

## Ship Worker Variants

### Variant A (Conservative)
```
Merge only if: CI pass + merge-ready + no conflicts
```

### Variant B (Aggressive)
```
Merge if CI passes. Auto-resolve conflicts.
Don't wait for perfect.
```

## A/B Test Results

| Variant | PRs Merged | Avg Time | Failure Rate |
|---------|------------|----------|--------------|
| Factory A | 10 | 20 min | 5% |
| Factory B | TBD | TBD | TBD |
| Ship A | 8 | 5 min | 2% |
| Ship B | TBD | TBD | TBD |
