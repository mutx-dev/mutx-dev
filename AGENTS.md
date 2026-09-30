# MUTX development guide

MUTX includes a public website, an operator workspace, PicoMUTX, a control-plane API,
a CLI and SDK, and a desktop shell. Treat them as one product with distinct user
journeys. Preserve existing data, authentication, public URLs, and supported client
contracts while simplifying their implementation.

## Source map

- `app/`, `components/`, `lib/`: Next.js website, operator app, and shared TypeScript.
- `app/pico/`, `components/pico/`, `lib/pico/`: PicoMUTX setup and learning workflows.
- `proxy.ts`: host routing, locale selection, and browser request boundaries.
- `app/api/`: same-origin browser endpoints and API proxies.
- `src/api/`: FastAPI control plane; public routes use `/v1/*`.
- `cli/`: Python CLI and Textual TUI. The distribution is `mutx-cli`.
- `sdk/mutx/`: Python SDK. The distribution is `mutx`.
- `desktop/`: Electron main process, preload bridge, packaging, and release tools.
- `infrastructure/`: container, provisioning, monitoring, and Kubernetes definitions.
- `tests/unit/`: frontend unit tests; `tests/api/` and `tests/test_*.py`: Python tests.
- `tests/*.spec.ts`: browser journeys. `docs/plans/` contains implementation plans.

## Work from current evidence

Read source and configuration before trusting older prose. Runtime versions come
from `package.json`, Python manifests, lockfiles, and the relevant container image.
Do not copy historical local paths, version tables, or deployment claims into new work.

Before editing, check the branch, working tree, and applicable plan. Preserve existing
user changes. Use explicit file ownership when work runs in parallel, and leave shared
installs, builds, generated contracts, and integration commits to one owner.

Changes should remove an obsolete implementation when replacing it. Avoid a second
route registry, transport layer, lifecycle model, or compatibility wrapper unless an
existing external contract needs it. Inventory callers and supported behavior before
removing public commands or endpoints.

Keep browser behavior in the frontend and control-plane authority in the backend.
Use authenticated identity and existing authorization dependencies. When changing an
API contract, update its affected CLI, SDK, generated types, documentation, and tests.
A stored desired state is not proof that a runtime started or an action completed.

## Local setup

Use the Node and npm versions allowed by `package.json`. Install the checked lockfile:

```sh
npm ci
uv venv --python 3.12 .venv
uv pip sync --python .venv/bin/python --require-hashes requirements-ci.lock
```

The Python environment is for repository development. Installing the CLI or SDK as a
user is a separate package workflow. Follow the relevant quickstart and test the built
package when changing installation behavior.

Use `npm run dev` for the frontend. The API entrypoint is `src.api.main:app`.
Read the chosen Compose file and its required environment before starting a stack;
never point a test or migration at an existing database by assumption.

## Validation

Choose checks for the changed behavior, then expand only when its reach requires it.

```sh
npx eslint <changed-paths> --max-warnings=0
npx jest --runInBand <affected-test-file>
npm run typecheck
.venv/bin/ruff check <changed-python-paths>
.venv/bin/python -m pytest <affected-test-file-or-node-id> -q
```

Build and deployment changes require `npm run build` and a check of the produced
artifact. Browser specs use the standalone output, so build before running them.
Use `npm run test:dependency-compat` after JavaScript dependency changes and
`.venv/bin/python scripts/check_requirements_compat.py` after Python lock changes.

For changes spanning the product, use `scripts/test.sh` and the relevant release,
container, or infrastructure checks. A skipped check remains unverified. Inspect
actual desktop and mobile rendering for visual work, including intermediate scroll
states and the primary actions; a green unit suite does not establish visual quality.

## Delivery

Keep changes reviewable and commits limited to their owned files. Use pull requests;
merge and production actions require the user's authorization. Preserve the user's
checkout and unrelated staged changes.

Report what changed, the checks that actually ran, the preview or PR when available,
and concrete remaining blockers. Distinguish local validation, preview deployment,
public availability, and a qualified release. Do not claim live telemetry, successful
execution, downloadable binaries, signing, or notarization without matching evidence.
