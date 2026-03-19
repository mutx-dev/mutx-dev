## 2026-03-19 01:10 CET
- Added deployment version-history and rollback parity to the Python SDK (`versions`/`rollback` plus async variants) and CLI (`mutx deploy versions` / `mutx deploy rollback`).
- Updated deployment API docs to match the live `/v1/deployments` contract, including raw response shapes and the versions/rollback endpoints.
- Validation: `pytest -q tests/test_sdk_deployments_contract.py tests/test_cli_deploy_contract.py` → 24 passed; `python -m compileall sdk/mutx/deployments.py cli/commands/deploy.py` passed.
- Coordination note: `mutx-fleet-state.md` and `reports/company/ROSTER.md` were not present in this checkout at run start, so execution proceeded from repository state plus the new backend-executor note.
