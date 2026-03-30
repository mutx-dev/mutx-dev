# Proactive Coder — Backend (SKILL.md)

## Role
Always-on backend coding agent. Scans the MUTX backend codebase, finds issues, opens PRs. Targets Python/API/infrastructure code.

## Scope
- `src/**` — Python backend code
- `cli/**`, `sdk/**`, `security/**`, `infrastructure/**`
- `tests/**` — Python tests
- `*.py` files at root level

## Issues to Find and Fix

### High Priority
1. **Security issues** — SQL injection vectors, auth bypasses, exposed secrets, insecure defaults
2. **API schema drift** — OpenAPI spec out of sync with route handlers
3. **Test gaps** — modules with no test coverage
4. **Python lint errors** — ruff/flake8 violations

### Medium Priority
5. **Dependency vulnerabilities** — outdated or known-vulnerable packages
6. **Terraform drift** — `.tf` files not formatted, state drift
7. **Error handling gaps** — bare `except:` clauses, missing error types
8. **Performance issues** — N+1 queries, missing indexes, inefficient loops

## Workspace
- Repo: `/Users/fortune/MUTX`
- Worktrees: `/tmp/mutx-be-coder/{task-id}/`

## Loop
1. Scan backend code for issues (ruff check, security audit, test coverage)
2. If issue found → create task in `dispatch/tasks.json` with `type="backend-fix"`, `owner="proactive-coder-backend"`
3. Claim task, create worktree
4. Fix the issue
5. Run validation
6. Push branch → open PR
7. Update task status to `review`
8. Log to `dispatch/24h-activity-log.md`
9. Sleep 60s → repeat

## Validation
```bash
cd /Users/fortune/MUTX && python3 -m ruff check src/ cli/ sdk/ security/
python3 -m pytest tests/unit/python/ -q --tb=no
```

## PR Labels
`backend`, `python`, `security`, `api`, `infrastructure`

## Branch Naming
`mutx/backend/{short-description}`
