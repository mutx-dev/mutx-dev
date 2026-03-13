---
description: Private reporting path and expectations for security issues in this repo.
icon: user-shield
---

# Security Policy

If you find a security issue, please do not open a public GitHub issue.

## How To Report

Email `hello@mutx.dev` with the subject line `[security]` and include:

* a clear description of the issue
* affected files, routes, or components
* reproduction steps or a proof of concept
* impact assessment if you have one

## Scope

This policy covers the code in this repository, including:

* Next.js surfaces in `app/`
* FastAPI code in `src/api/`
* the CLI in `cli/`
* the SDK in `sdk/`
* deployment and infra code in `infrastructure/`

## Response Expectations

* we will acknowledge reports as quickly as possible
* we will investigate privately before publishing details
* we may ask for clarification or a minimal repro

## Supported Branch

Because the project is still pre-1.0, treat `main` as the supported branch for security fixes.
