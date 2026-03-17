# Template-Apply Dynamic Gates

Use this guide for all template-driven tasks (including fill, patch, and rebuild variants).

## Purpose

Let the model edit freely while engineering gates enforce constraints derived from the actual user template.

## Two Execution Lanes

1. `create` lane (no template): C# OpenXML generation.
2. `template-apply` lane (template/reference provided): dynamic constraints + gated execution.

This guide applies only to `template-apply`.

## Dynamic Constraint Sheet (Per Task)

Build a task-specific constraint sheet from template analysis before editing:

- `topology_constraints`: section topology, break positions, anchor regions.
- `frozen_constraints`: signature blocks, legal fixed clauses, non-edit zones.
- `derived_constraints`: TOC, cross-references, numbering summaries (derived from source content).
- `style_constraints`: style IDs and key formatting contracts that must remain stable.

Treat the sheet as runtime contract for gates, not a static prompt checklist.

## Mapping-Driven Fill Trigger

Fill/patch mode is allowed only when mapping table is complete.

Generate a scaffold first (do not handcraft from empty file):

```bash
python3 <skill-path>/docx_engine.py map-template mapping.json --require R1,R2
```

A mapping table is complete when:

- every row has `id`, `requirement_ids`, `selector`, `action`, `status`.
- `action` is one of `replace|delete|insert`.
- `status` is `resolved` for all executable rows.
- `replace` and `insert` rows contain non-empty `target_value`.
- all required requirement IDs are covered by resolved rows.

Use:

```bash
python3 <skill-path>/docx_engine.py map-gate mapping.json --require R1,R2
```

Gate fail means fill/patch mode is blocked.

## Mapping Schema Contract

- Canonical schema file: `schemas/mapping.schema.json`
- Schema version: `minimax-docx.map.v1`
- Generate scaffold first:

```bash
python3 <skill-path>/docx_engine.py map-template mapping.json --require R1,R2
```

Model should edit only:

- `rows[].selector`
- `rows[].action`
- `rows[].target_value`
- `rows[].status`
- `rows[].notes` (optional)

Model should keep stable unless requirements change:

- `schema_version`
- `required_requirement_ids`
- `requirements[].id`
- `rows[].id`
- `rows[].requirement_ids`

## Mode Decision

- `map-gate pass` -> execute deterministic fill/patch (Python stdlib XML executor):
  `python3 <skill-path>/docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> --require R1,R2`.
- `map-gate fail` -> do not run fill/patch; either:
  - request mapping completion, or
  - switch to template-apply rebuild mode (still under template constraints).

## Forbidden Outcomes

- leaving stale template sample values mixed with new values.
- modifying frozen zones without explicit user instruction.
- preserving stale derived content after source edits.
- shipping output when any dynamic gate fails.
