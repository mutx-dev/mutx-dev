# GitHub Issue Resolver — Quick Reference

## GitHub API Endpoints

### Issues
```
GET /repos/{owner}/{repo}/issues?state=open&per_page=100
GET /repos/{owner}/{repo}/issues/{issue_number}
GET /repos/{owner}/{repo}/issues/{issue_number}/comments
GET /repos/{owner}/{repo}/issues/{issue_number}/timeline
```

### Pull Requests
```
POST /repos/{owner}/{repo}/pulls
```

## Response Fields (Key)

### Issue Object
```json
{
  "number": 42,
  "title": "Bug title",
  "body": "Description...",
  "state": "open",
  "labels": [{"name": "bug"}],
  "comments": 5,
  "updated_at": "2024-01-15T10:30:00Z",
  "pull_request": {} // Present if this is actually a PR
}
```

## Quality Scoring Rubric

| Factor | Points | Notes |
|--------|--------|-------|
| good first issue | +50 | Best label for new contributors |
| help wanted | +30 | Maintainer wants help |
| bug | +20 | Clear problem to solve |
| easy/beginner | +25 | Complexity indicator |
| Description length >100 chars | +10 | Has context |
| Updated <7 days | +15 | Fresh activity |
| Updated <30 days | +10 | Recent activity |
| Updated >180 days | -20 | Stale issue |
| 1-10 comments | +10 | Good engagement |

## Labels to Prioritize

- `good first issue`
- `help wanted`
- `bug`
- `easy`
- `beginner-friendly`
- `hacktoberfest`

## Labels to Deprioritize

- `wontfix`
- `duplicate`
- `blocked`
- `needs-design`
- `question` (usually not actionable)

## Common Test Commands

### JavaScript/TypeScript
```bash
npm test
npm test -- --testPathPattern="Component"
npm test -- --testNamePattern="should handle"
```

### Python
```bash
pytest -v
pytest path/to/test.py -v
pytest -k "test_name_pattern" -v
```

### Go
```bash
go test ./...
go test ./package -v
go test -run TestName -v
```

### Rust
```bash
cargo test
cargo test --test integration
cargo test test_name
```

## PR Title Conventions

```
Fix #42: Brief description of the fix

Fixes #42 — Clear imperative statement

feat: Add feature X (fixes #42)

fix(component): Resolve memory leak (closes #42)
```

## PR Body Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- List of specific changes made
- Each bullet should be atomic

## Testing
- How you tested the fix
- Test results

## Related Issues
Fixes #42
```
