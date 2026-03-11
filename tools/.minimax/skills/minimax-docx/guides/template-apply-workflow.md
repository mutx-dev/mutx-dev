# Template-Apply Workflow

Use this guide when the user provides a `.docx` or `.doc` file as template/reference.

---

## Core Principle

**Template = Contract**. The user's template defines structure, styling, and topology. Your job is to fill or modify content while preserving the contract.

---

## 1. Input Normalization

### 1.1 Detect Container Type

Check magic bytes, not file extension:

| Container | Magic Bytes | Action |
|-----------|-------------|--------|
| OOXML (.docx) | `50 4B 03 04` | Use directly |
| OLE Binary (.doc) | `D0 CF 11 E0 A1 B1 1A E1` | Convert first |

```bash
xxd -l 8 <input-file>
```

### 1.2 Convert Legacy .doc

```bash
soffice --headless --convert-to docx --outdir <tmp-dir> <input.doc>
```

**Do NOT use `textutil`** — it loses structural fidelity.

After conversion:
1. Use the converted `.docx` as template source
2. Run `audit` before any edits
3. Keep original `.doc` read-only

---

## 2. Dynamic Constraint Sheet

Before editing, derive constraints from the template:

| Constraint Type | What to Capture |
|-----------------|-----------------|
| `topology` | Section count, break positions, anchor regions |
| `frozen` | Signature blocks, legal clauses, no-edit zones |
| `derived` | TOC presence, cross-references, numbering schemes |
| `style` | Style IDs, key formatting (fonts, colors, spacing) |

These constraints become runtime gates — edits are allowed freely, but delivery is blocked if any gate fails.

---

## 3. Content Classification

Build a **Replacement Matrix** before any text edits:

| template_snippet | field_name | action | target_value | value_source |
|------------------|------------|--------|--------------|--------------|
| `Acme Co., Ltd.` | company_name | REPLACE | `Nova Tech` | user input |
| `[Date]` | contract_date | REPLACE | `2026-02-16` | user input |
| `This is a sample.` | demo_notice | DROP | | template cleanup |
| `Authorized Signature` | signature_caption | KEEP | | structure rule |

### Classification Rules (in order)

1. **User instruction overrides all**
2. **KEEP by default**: Headings, legal boilerplate, section labels, signature captions, numbering anchors
3. **REPLACE when user provides updates**: Names, dates, amounts, addresses, table values
4. **DROP obvious placeholders**: `XXX`, `TODO`, `TBD`, `sample`, `example`, `[company]`, `示例`, `模板`
5. **If uncertain**: Mark KEEP, ask user. Never guess.

### Anti-Concatenation Rule

When replacing a field:
- Remove old value completely
- Never output `OldValue/NewValue` mixed strings
- Never append new paragraphs when task is "fill template"

---

## 4. TOC Handling

Identify TOC implementation before edits:

| Type | Detection | Action |
|------|-----------|--------|
| Field-based | `TOC` field code in document | Keep field, refresh on open |
| Static paragraphs | `TOC1/TOC2/...` style paragraphs | Delete stale entries, rebuild from current headings |

Static TOC entries become stale after heading changes — they must be rebuilt, not preserved.

---

## 5. Mapping-Driven Execution

### 5.1 Generate Mapping Scaffold

```bash
python3 <skill-path>/docx_engine.py map-template mapping.json --require R1,R2
```

### 5.2 Fill Mapping Rows

Complete these fields for each row:
- `selector`: XPath or identifier
- `action`: `replace` | `delete` | `insert`
- `target_value`: New content (required for replace/insert)
- `status`: Set to `resolved` when ready

### 5.3 Run Completeness Gate

```bash
python3 <skill-path>/docx_engine.py map-gate mapping.json --require R1,R2
```

**Gate pass** → Execute deterministic fill/patch
**Gate fail** → Block fill mode, request mapping completion or switch to rebuild

### 5.4 Execute Fill/Patch

```bash
python3 <skill-path>/docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> --require R1,R2

# Dry-run first
python3 <skill-path>/docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> --dry-run
```

---

## 6. Execution Checklist

Run this sequence for every template task:

### Phase 1: Setup
- [ ] Confirm input path exists, output path is explicit
- [ ] Detect container by magic bytes
- [ ] Convert legacy `.doc` if needed
- [ ] Audit normalized template: `docx_engine.py audit <template.docx>`

### Phase 2: Analysis
- [ ] Freeze requested scope (list only allowed edits)
- [ ] Define preserved structure (sections, signatures, anchors)
- [ ] Generate dynamic constraint sheet
- [ ] Determine TOC mode (field vs static)
- [ ] Build replacement matrix

### Phase 3: Mapping
- [ ] Generate mapping scaffold: `map-template`
- [ ] Fill all required rows with selectors, actions, values
- [ ] Run completeness gate: `map-gate`
- [ ] Route: gate pass → fill/patch; gate fail → complete mapping or rebuild

### Phase 4: Build
- [ ] Run environment check: `docx_engine.py doctor`
- [ ] Execute build:
  - Fill/Patch: `map-apply`
  - Rebuild: `dotnet run -- from-template <template.docx> <output.docx>`

### Phase 5: Validation
- [ ] Audit output: `docx_engine.py audit <output.docx>`
- [ ] Preview content: `docx_engine.py preview <output.docx>`
- [ ] Check preservation: No unrequested cover/TOC/chapter additions
- [ ] Check residuals: `docx_engine.py residual <output.docx>`

### Phase 6: Fix if needed
- [ ] On any gate failure: patch logic, rerun build and validation

---

## 7. Forbidden Actions

- Adding cover/TOC/chapters not present in template
- Replacing template typography/palette with preset styles
- Reordering major section topology
- Mixing old sample values with new values
- Modifying frozen zones (signatures, legal clauses) without explicit instruction
- Using `AcademicPaper.cs` or `TechManual.cs` for template tasks

---

## 8. Commands Reference

```bash
# Detect container
xxd -l 8 <file>

# Convert .doc to .docx
soffice --headless --convert-to docx --outdir <tmp-dir> <input.doc>

# Audit template
python3 <skill-path>/docx_engine.py audit <template.docx>

# Generate mapping scaffold
python3 <skill-path>/docx_engine.py map-template mapping.json --require R1,R2

# Check mapping completeness
python3 <skill-path>/docx_engine.py map-gate mapping.json --require R1,R2

# Execute deterministic fill
python3 <skill-path>/docx_engine.py map-apply <input.docx> <mapping.json> <output.docx>

# Template rebuild (when fill/patch insufficient)
dotnet run --project <skill-path>/src/DocForge.csproj -- from-template <template.docx> <output.docx>

# Preview content
python3 <skill-path>/docx_engine.py preview <output.docx>

# Check residual placeholders
python3 <skill-path>/docx_engine.py residual <output.docx>
```

---

## 9. Related Guides

| Guide | When to Read |
|-------|--------------|
| `doc-input-normalization.md` | Detailed .doc conversion protocol |
| `template-apply-dynamic-gates.md` | Deep dive on constraint derivation |
| `template-driven-content-rewrite.md` | Detailed replacement matrix protocol |
| `development.md` | C# coding patterns for rebuild path |
