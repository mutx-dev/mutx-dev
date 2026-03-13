---
description: How to choose work, stay truthful, and submit clean MUTX contributions.
icon: handshake
---

# Contributing

Thanks for helping improve `mutx.dev`.

## Before You Start

* Read `README.md`, `docs/README.md`, `ROADMAP.md`, and `docs/project-status.md`.
* Trust the code over older docs when they disagree.
* Keep changes scoped. This repo spans web, API, CLI, SDK, Docker, Terraform, and Ansible.

## Local Setup

Use the canonical quickstart in `docs/deployment/quickstart.md`.

## What To Work On

The best starting points live in:

* `ROADMAP.md`
* `docs/project-status.md`
* open issues created from those docs

Good contribution shapes:

* API contract fixes
* CLI and SDK alignment
* dashboard/product surface improvements
* docs drift cleanup
* backend tests and CI improvements

## Pull Requests

* Prefer small PRs by area.
* Link an issue when there is one.
* Explain what changed and why.
* Include the validation commands you ran.
* Update the closest docs when behavior changes.
* Do not bundle unrelated cleanup with the main change.

## Validation

Use the smallest relevant validation set for your change.

### Frontend

```bash
npm run lint
npm run build
```

### Python API, CLI, and SDK

```bash
ruff check src/api cli sdk
black --check src/api cli sdk
python3 -m compileall src/api cli sdk/mutx
```

### Playwright

```bash
npx playwright test --list
```

Important: current Playwright specs target `https://mutx.dev`, not localhost.

## Source Of Truth

When behavior is unclear, inspect:

* `src/api/routes/`
* `cli/commands/`
* `sdk/mutx/`
* `docker-compose.yml`
* `docker-compose.production.yml`

## Questions And Support

See `SUPPORT.md`.
