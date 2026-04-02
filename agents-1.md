---
description: Agent guidance and contract for autonomous coding agents operating in the MUTX repo.
icon: file-code
---

# Agent Guidance

This file provides ground-truth guidance for autonomous coding agents working in this repository.

## Key Constraints

* Always use the `/v1/*` API contract for all agent-facing endpoints.
* There is no global `/v1` backend prefix in Next.js — routes are served directly.
* Agent definitions live in `agents/{agent_name}/AGENT.md`.
* The repo root `AGENTS.md` provides the executive context for the autonomous program.
* Trust mounted source code and `docs/api/openapi.json` over prose docs when they disagree.

## Auth & Ownership

* Every `/v1/*` route that reads or writes user-scoped resources must enforce auth.
* Ownership checks must verify `resource.user_id == current_user.id`.
* Never trust client-supplied `user_id` in request bodies.

## Ground-Truth Commands

* Python backend: `uvicorn src.api.main:app --reload --port 8000`
* Frontend dev: `npm run dev`
* Python tests: `uv run pytest tests/api/ -v`
* OpenAPI generation: `python -c "from scripts.generate_openapi import build_openapi_document; import json; print(json.dumps(build_openapi_document(), indent=2))"`

## Known Drift

* RAG and Scheduler return 503 — not production-ready.
* Vault is a stub.
* Dashboard stable routes: `/dashboard`, `/dashboard/agents`, `/dashboard/deployments`.
* Dashboard preview routes: `/control/*`.
