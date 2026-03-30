# Auto-Merge Policy

## Auto-merge allowed
- low-risk docs-only changes
- low-risk script/path fixes
- bounded non-destructive config truth fixes

## Auto-merge blocked
- auth changes
- runtime protocol changes
- infrastructure delivery changes affecting prod
- monitoring/executor truth changes
- anything with unclear blast radius

## Rule
Auto-merge only after:
1. second-agent review
2. green CI
3. low-risk scope
