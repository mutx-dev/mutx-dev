# FAQ

## What is in this repo today?

A Next.js marketing and app surface, a FastAPI backend, a Python CLI, a Python SDK, Docker workflows, and Terraform plus Ansible infrastructure code.

## Is the waitlist real?

Yes. Waitlist signups are stored in Postgres through `lib/waitlist.ts` and `lib/db.ts`.

## Is there a `/v1` API prefix?

No. The current FastAPI app mounts plain routes such as `/auth`, `/agents`, `/deployments`, and `/webhooks`.

## Can I use the CLI for everything?

Not yet. Core auth and listing flows work well, but some commands still reflect older API assumptions.

The two biggest gaps right now are:

- `mutx deploy create` still points at an older `/api/v1/...` route

`mutx agents create` now relies on authenticated ownership instead of a client-supplied `user_id`.

## Is the SDK fully aligned with the API?

Not completely. The SDK has useful wrappers, but some methods still assume older endpoints or broader coverage than the current FastAPI app exposes.

## Does the contact form persist submissions?

Not currently. The contact route validates input and logs the payload, but it does not persist or send submissions yet.

## Do the Playwright tests run against localhost?

No. The current Playwright config targets `https://mutx.dev`.

## Are the architecture docs purely current-state?

No. Some architecture docs describe the direction of the platform as well as implemented pieces. For current route and workflow behavior, prefer the README, `docs/README.md`, and the code under `src/api/`, `cli/`, and `sdk/`.

## What license does this repo use?

MIT. See `LICENSE`.
