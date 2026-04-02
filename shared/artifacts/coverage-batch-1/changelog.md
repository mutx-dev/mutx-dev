# Coverage Batch 1 — Changelog

## Summary

Added pytest contract tests for 4 SDK modules in `sdk/mutx/` that previously had zero test coverage. `api_keys.py` already had coverage via `test_sdk_api_keys_contract.py`.

## Files Added

| Test File | Module Covered | Test Count |
|---|---|---|
| `tests/test_sdk_agents_contract.py` | `mutx/agents.py` | 30 tests |
| `tests/test_sdk_analytics_contract.py` | `mutx/analytics.py` | 18 tests |
| `tests/test_sdk_assistant_contract.py` | `mutx/assistant.py` | 34 tests |
| `tests/test_sdk_budgets_contract.py` | `mutx/budgets.py` | 16 tests |

**Total: 84 new tests across 4 modules**

## Modules With Coverage After This PR

- `agent_runtime.py` — already had `test_sdk_agent_runtime_contract.py`
- `agents.py` — **new** `test_sdk_agents_contract.py`
- `analytics.py` — **new** `test_sdk_analytics_contract.py`
- `api_keys.py` — already had `test_sdk_api_keys_contract.py`
- `assistant.py` — **new** `test_sdk_assistant_contract.py`
- `budgets.py` — **new** `test_sdk_budgets_contract.py`

## What the Tests Cover

Each test file follows the existing SDK contract test pattern in the repo:

1. **Data model tests** — verify that dataclass wrappers (`Agent`, `AgentLog`, `AnalyticsSummary`, etc.) correctly parse API response fields
2. **Sync client tests** — verify that each `sync` method hits the correct HTTP route with correct HTTP method, path, and JSON/query params
3. **Async client tests** — same as sync, but for `async` methods using `httpx.AsyncClient` with `MockTransport`
4. **Client type guard tests** — verify that sync methods raise `RuntimeError` when passed an async client (and vice versa)

## Test Results

```
84 passed in 0.21s
```

## Branch

- `feature/coverage-batch-1` → PR target: `mutx-dev/mutx-dev`
