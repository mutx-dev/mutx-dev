---
description: Minimum gate to ship MUTX v0.1 safely and quickly.
icon: rocket
---

# v0.1 Release Runbook

Target release date: **Monday, March 16, 2026**.

This file is the historical platform release checklist. For the current CLI distribution, TUI, and Homebrew flow, use [`cli-release.md`](./cli-release.md).

## 1. Sync and install once

```bash
git fetch origin
git checkout main
git pull --ff-only origin main

npm ci
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"
```

## 2. Run the release gate

Fast gate (default, skips Playwright):

```bash
npm run release:check
```

Full gate (includes Playwright):

```bash
npm run release:check -- --with-playwright
```

`release:check` sets fallback Turnstile test keys if they are not already configured and then runs the repository validation suite.

## 3. Cut the release

```bash
git checkout main
git pull --ff-only origin main
git tag -a v0.1.0 -m "MUTX v0.1.0"
git push origin v0.1.0
```

Then publish GitHub release notes from the `v0.1.0` tag and include:

- key API/CLI/SDK changes
- migration or config notes
- known limitations and follow-up issues

## 4. Post-release checks

```bash
curl -fsS https://api.mutx.dev/health
curl -fsS https://api.mutx.dev/ready
```

Verify:

- `https://mutx.dev`
- `https://app.mutx.dev`
- `https://docs.mutx.dev`
