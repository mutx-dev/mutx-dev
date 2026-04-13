---
description: Orchestra Research skillpack integration for MUTX — pinned upstream catalog, curated bundles, templates, and swarm blueprints.
---

# Orchestra Research skillpack in MUTX

MUTX ships a pinned integration with Orchestra Research's `AI-Research-SKILLs` repository.

Upstream source of truth:
- repo: `https://github.com/Orchestra-Research/AI-Research-SKILLs`
- pinned commit: `05f1958727bfc2bc22240f41d060504473c4f236`
- license: `MIT`

MUTX does not rewrite the upstream skill content into first-party docs. Instead it ships:
- a pinned catalog manifest at `src/api/data/orchestra_research_catalog.json`
- curated bundle definitions for common research stacks
- starter templates that preload those bundles into OpenClaw-backed assistants
- swarm blueprints for multi-agent orchestration
- a sync script that copies the upstream skill tree into the MUTX-managed runtime root

## What ships

### Catalog

`GET /v1/clawhub/skills` now exposes:
- first-party MUTX starter skills
- locally discovered runtime skills
- Orchestra Research catalog entries with upstream repo, commit, path, and availability state

### Bundles

`GET /v1/clawhub/bundles` returns curated packs such as:
- `orchestra-research-foundation`
- `orchestra-rag-stack`
- `orchestra-post-training-lab`
- `orchestra-inference-optimization`
- `orchestra-multimodal-safety`

`POST /v1/clawhub/install-bundle` installs all currently available skills from a bundle onto an assistant.

### Starter templates

`GET /v1/templates` now includes Orchestra-backed starter templates:
- `orchestra_research_foundation`
- `orchestra_rag_lab`
- `orchestra_post_training_lab`
- `orchestra_inference_lab`

These are still OpenClaw/MUTX assistants under the hood. The difference is the default skill payload and the attached orchestration metadata.

### Swarm blueprints

`GET /v1/swarms/blueprints` exposes pinned multi-agent presets such as:
- `research-triad`
- `trainer-eval-safety`
- `rag-ship-room`
- `inference-ops-lane`

These are recommendation objects, not auto-spawned clusters. They exist to make orchestration explicit instead of tribal.

## Runtime sync

Catalog visibility is not the same as runtime availability.

To make Orchestra skills actually installable on a runtime host, sync them into the MUTX-managed root:

```bash
python scripts/sync_orchestra_research_skills.py
```

Default destination:

```text
~/.mutx/skills/orchestra-research
```

Optional flags:

```bash
python scripts/sync_orchestra_research_skills.py --source ~/.hermes/tmp/AI-Research-SKILLs
python scripts/sync_orchestra_research_skills.py --dest ~/.mutx/skills/orchestra-research
python scripts/sync_orchestra_research_skills.py --no-clean
```

Discovery roots now include:
- `MUTX_SKILLS_DIR` when set
- `~/.mutx/skills`
- `~/.hermes/skills`
- `~/.openclaw/skills`
- detected runtime/workspace skill roots from OpenClaw state

If a catalog entry is visible but marked unavailable, sync has not landed on that runtime yet.

## CLI flow

List bundles:

```bash
mutx clawhub bundles
```

List catalog entries:

```bash
mutx clawhub list
```

Install a bundle to an assistant:

```bash
mutx clawhub install-bundle --agent-id <agent-id> --bundle-id orchestra-research-foundation
```

Install a single skill:

```bash
mutx clawhub install --agent-id <agent-id> --skill-id langchain
```

## Attribution stance

Orchestra Research deserves explicit credit here.

MUTX imports and indexes their skill catalog, templates, and orchestration recommendations. The upstream skill content remains attributed to Orchestra Research and the upstream project authors they documented. MUTX adds:
- catalog normalization
- bundle curation for shipping use cases
- starter template wiring
- swarm blueprint metadata
- runtime sync and operator-facing surfaces

That is integration work, not authorship laundering.
