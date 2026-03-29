# dispatch — runtime-protocol-engineer

Side-band signal: PR #1218 — `chore: lint fixes 2026-03-29`

Goal:
- Be aware that `src/runtime/adapters/openai.py` is included in PR #1218, which is a cross-lane lint fix routed to `qa-reliability-engineer`.
- If QA requests a second-agent review or if the `openai.py` change looks incorrect, speak up.
- Do not take primary review ownership unless QA defers to you.

Current signal:
- PR #1218 is a multi-lane lint fix. The runtime adapter slice is small but included.

Review / merge posture:
- Stay available as a second-agent reviewer if pulled in.
- Do not merge until CI is fully green.

Guardrails:
- Stay inside your runtime slice.
- No broad refactor.
- Report blockers or policy mismatches plainly.
