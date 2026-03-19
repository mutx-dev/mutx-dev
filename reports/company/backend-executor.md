## 2026-03-19 01:10 CET
- Added deployment version-history and rollback parity to the Python SDK (`versions`/`rollback` plus async variants) and CLI (`mutx deploy versions` / `mutx deploy rollback`).
- Updated deployment API docs to match the live `/v1/deployments` contract, including raw response shapes and the versions/rollback endpoints.
- Validation: `pytest -q tests/test_sdk_deployments_contract.py tests/test_cli_deploy_contract.py` → 24 passed; `python -m compileall sdk/mutx/deployments.py cli/commands/deploy.py` passed.
- Coordination note: `mutx-fleet-state.md` and `reports/company/ROSTER.md` were not present in this checkout at run start, so execution proceeded from repository state plus the new backend-executor note.
## 2026-03-19 01:30 CET
- Closed the webhook operator parity gap that was still blocking truthful backend/CLI usage of the Webhooks surface.
- Added canonical CLI write/test commands in `cli/commands/webhooks.py`: `create`, `update`, `test`, and `delete`, alongside the existing `list`, `get`, and `deliveries` reads.
- Updated `docs/api/webhooks.md` to match the live backend contract (`/v1/webhooks`, raw resource arrays, `is_active`, `PATCH`, delivery filters, and real test response shape) instead of the older envelope/name-based docs.
- Added focused CLI contract coverage for the new webhook commands in `tests/test_cli_webhooks_contract.py`.
- Validation: `pytest -q tests/test_cli_webhooks_contract.py tests/test_sdk_webhooks_contract.py` → 12 passed; `python -m compileall cli/commands/webhooks.py sdk/mutx/webhooks.py` passed.
- Git: committed and pushed on `backend-executor/deployments-versions-rollback-parity` as `6a04e9f` (`cli: add webhook operator commands`).

## 2026-03-19 02:02 CET
- Unblocked the monitoring/runtime truth lane by repairing `tests/conftest.py`, whose shared async test fixture had lost the core imports (`create_async_engine`, `AsyncSession`, `sessionmaker`, `StaticPool`, `AsyncClient`, `ASGITransport`, `asyncio`, `uuid`, and ready-check datetime helpers).
- Impact: `tests/api/test_monitoring.py` now executes real assertions again instead of dying in fixture setup with `NameError: create_async_engine is not defined`, so the monitoring auto-fail/auto-heal/webhook regression slice is trustworthy again for backend + UI coordination.
- Validation: `pytest -q tests/api/test_monitoring.py tests/test_sdk_deployments_contract.py tests/test_cli_webhooks_contract.py tests/test_sdk_webhooks_contract.py` → 33 passed; `python -m compileall tests/conftest.py` passed.
