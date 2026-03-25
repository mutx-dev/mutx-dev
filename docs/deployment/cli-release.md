---
description: Release checklist for the root CLI distribution, Textual TUI, and Homebrew tap.
icon: rocket
---

# CLI Release Runbook

This runbook is for the root CLI distribution, not the SDK package under `sdk/`.

## 1. Sync and install

```bash
git fetch origin
git checkout main
git pull --ff-only origin main

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
python -m pip install build
```

## 2. Validate the operator surface

```bash
pytest tests/test_cli_auth_and_tui.py tests/test_cli_agents_contract.py tests/test_cli_deploy_contract.py
mutx status
mutx --help
```

For an end-to-end local operator smoke:

```bash
make dev
make test-auth
mutx login --email test@local.dev --password TestPass123!
make seed
mutx tui
```

## 3. Cut the CLI release

The CLI version source of truth is the root `pyproject.toml` version.

```bash
python -m build
git checkout main
git pull --ff-only origin main
git tag -a cli-v0.2.1 -m "MUTX CLI v0.2.1"
git push origin cli-v0.2.1
```

Publish GitHub release notes from the `cli-v0.2.1` tag and include:

* install notes for `pip install -e ".[tui]"`
* operator-facing TUI changes
* config and auth compatibility notes
* Homebrew tap formula update details

## 4. Publish the Homebrew tap

Pushing the `cli-vX.Y.Z` tag now drives the tap update automatically. The release workflow:

* regenerates `Formula/mutx.rb` from the tagged CLI source
* commits the updated formula to `mutx-dev/homebrew-tap`
* pushes the tap update before creating the CLI GitHub release

The workflow requires a `HOMEBREW_TAP_TOKEN` repository secret with write access to `mutx-dev/homebrew-tap`.

Manual fallback only if the workflow fails:

```bash
python scripts/generate_homebrew_formula.py --tag cli-v0.2.1 --output homebrew-tap/Formula/mutx.rb
brew uninstall mutx || true
brew tap mutx-dev/homebrew-tap
brew install mutx
mutx --help
mutx setup --help
mutx doctor --help
```

The formula test must stay non-networked, and `main` pushes alone should not move the tap.

## 5. Post-release checks

```bash
mutx --help
mutx setup --help
mutx doctor --help
mutx tui
```

If you have a seeded local stack, verify the TUI can:

* deploy an agent
* inspect deployment events/logs/metrics
* restart, scale, and delete a deployment
