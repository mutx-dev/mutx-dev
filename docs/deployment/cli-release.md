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
git tag -a cli-v0.2.0 -m "MUTX CLI v0.2.0"
git push origin cli-v0.2.0
```

Publish GitHub release notes from the `cli-v0.2.0` tag and include:

* install notes for `pip install -e ".[tui]"`
* operator-facing TUI changes
* config and auth compatibility notes
* Homebrew tap formula update details

## 4. Update the Homebrew tap

From the tap repo:

```bash
cd ../homebrew-tap
```

Update `Formula/mutx.rb` to the matching `cli-vX.Y.Z` archive URL and `sha256`, then validate:

```bash
brew uninstall mutx || true
brew tap mutx-dev/homebrew-tap
brew install mutx
mutx status
```

The formula test must stay non-networked.

## 5. Post-release checks

```bash
mutx status
mutx --help
mutx tui
```

If you have a seeded local stack, verify the TUI can:

* deploy an agent
* inspect deployment events/logs/metrics
* restart, scale, and delete a deployment
