# MUTX Recovery Packet — README First

This packet is meant to be fed to your main OpenClaw agent as a working set.

## What this is

A fast-shipping roadmap to:
- harvest the best operator UX from Mission Control
- keep MUTX as the backend/control-plane source of truth
- use multi-agent orchestration aggressively once Codex/OpenCode limits lift
- avoid ontology drift into a task/session-first product

## Reading order

1. `01_EXECUTIVE_PLAN.md`
2. `02_IMPLEMENTATION_ROADMAP.md`
3. `03_MISSION_CONTROL_HARVEST_MAP.md`
4. `04_MULTI_AGENT_EXECUTION_PLAN.md`
5. `05_PR_HEALING_AND_SHIP_CHECKLISTS.md`

## Core decision

Mission Control won the open-source operator cockpit race.
MUTX should not try to outbuild a worse cockpit from scratch.

MUTX should:
- reuse/port the operator shell
- keep FastAPI + infra + deployment semantics as the system of record
- differentiate on deployments, runs, traces, governance, API-key lifecycle, webhooks, budgets, and tenant/network controls

## Non-negotiables

- MUTX primitives stay: `agent`, `deployment`, `run`, `trace`, `api_key`, `webhook`, `tenant`
- OpenClaw is first-class, but behind explicit integration boundaries
- No more speculative backend surface area until contract drift is tightened
- Ship visible operator credibility first, then deepen the moat

## Immediate directive

Do not start with greenfield design.
Start with a compatibility layer and a fork/port plan.
