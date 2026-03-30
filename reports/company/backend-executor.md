## 2026-03-19 01:30 CET
- Closed the webhook operator parity gap that was still blocking truthful backend/CLI usage of the Webhooks surface.
- Added canonical CLI write/test commands in `cli/commands/webhooks.py`: `create`, `update`, `test`, and `delete`, alongside the existing `list`, `get`, and `deliveries` reads.
- Updated `docs/api/webhooks.md` to match the live backend contract (`/v1/webhooks`, raw resource arrays, `is_active`, `PATCH`, delivery filters, and real test response shape) instead of the older envelope/name-based docs.
- Added focused CLI contract coverage for the new webhook commands in `tests/test_cli_webhooks_contract.py`.
- Validation: `pytest -q tests/test_cli_webhooks_contract.py tests/test_sdk_webhooks_contract.py` → 12 passed; `python -m compileall cli/commands/webhooks.py sdk/mutx/webhooks.py` passed.
- Git: committed and pushed on `backend-executor/deployments-versions-rollback-parity` as `6a04e9f` (`cli: add webhook operator commands`).
