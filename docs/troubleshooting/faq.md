---
description: Short answers to the most common repo and product questions.
icon: question
---

# FAQ

## What is in this repo today?

A Next.js marketing and app surface, a FastAPI backend, a Python CLI, a Python SDK, Docker workflows, and Terraform plus Ansible infrastructure code.

## Is the waitlist real?

Yes. Waitlist signups are stored in Postgres through `lib/waitlist.ts` and `lib/db.ts`.

## Is there a `/v1` API prefix?

Yes. The current FastAPI app mounts versioned routes such as `/v1/auth`, `/v1/agents`, `/v1/deployments`, and `/v1/webhooks`.

## Can I use the CLI for everything?

Not yet. Core auth and deployment flows work well, but some commands still lag the current API surface.

Current examples:

- `mutx deploy create` now targets the canonical `POST /v1/deployments` route
- `mutx tui` provides the current operator-focused agents and deployments shell
- `mutx agents create` now relies on authenticated ownership instead of a client-supplied `user_id`

## Is the SDK fully aligned with the API?

Not completely. The SDK has useful wrappers, but some methods still assume older endpoints or broader coverage than the current FastAPI app exposes.

## Does the contact form persist submissions?

Not currently. The contact route validates input and logs the payload, but it does not persist or send submissions yet.

## Do the Playwright tests run against localhost?

Yes. The checked-in Playwright config starts the local standalone app server and targets localhost. Build first when `.next/standalone` is missing, then use `npx playwright test --list` or `./scripts/test.sh` for the repo validation path. In short: build first when `.next/standalone` is missing.

## Are the architecture docs purely current-state?

No. Some architecture docs describe the direction of the platform as well as implemented pieces. For current route and workflow behavior, prefer the README, `docs/README.md`, and the code under `src/api/`, `cli/`, and `sdk/`.

## What license does this repo use?

MUTX core is source-available under BUSL-1.1. The Python SDK is Apache-2.0. See `LICENSE` and `LICENSE-FAQ.md` for details.

Commercial hosted, managed, white-labeled, OEM, and embedded offerings require a separate license from MUTX.
