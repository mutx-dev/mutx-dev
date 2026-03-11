# DOC Input Normalization Protocol

Use this guide when the user provides a Word file that may be legacy binary `.doc`.

## Objective

Normalize all template inputs to `.docx` before analysis or rewrite so downstream tooling always operates on OOXML.

## Detect Container by Signature

Do not trust extension names alone.

| Format | Signature (hex) | Meaning |
|---|---|---|
| OOXML ZIP (`.docx`) | `50 4B 03 04` | Zip package with XML parts |
| OLE CFB (`.doc`) | `D0 CF 11 E0 A1 B1 1A E1` | Legacy binary Word container |

Quick check:

```bash
xxd -l 8 <input-file>
```

## Required Workflow

1. If signature is ZIP, treat input as `.docx` and continue normally.
2. If signature is OLE, convert to `.docx` before any content analysis.
3. Keep original `.doc` read-only and preserve it for traceability.
4. Run `audit` and `residual` on converted `.docx` before rewrite.
5. Use only the converted `.docx` in `from-template` mode.

## Conversion Command

```bash
soffice --headless --convert-to docx --outdir <tmp-dir> <input.doc>
```

Do not use `textutil` for template-driven `.doc` normalization. It is not accepted in this skill because structure fidelity is insufficient for downstream map/apply and gate checks.

Validation after conversion:

```bash
python3 <skill-path>/docx_engine.py audit <tmp-dir>/<converted>.docx
python3 <skill-path>/docx_engine.py residual <tmp-dir>/<converted>.docx
```

## Failure Handling

- If `soffice` is unavailable, install LibreOffice or request user-provided `.docx`.
- In restricted sandbox environments, LibreOffice conversion may require elevated execution permission.
- If conversion fails or produced `.docx` cannot pass `audit`, stop and request a clean `.docx`.
- If content is visibly damaged after conversion, do not continue template rewrite on that file.

## Practical Caveats

- Old `.doc` with embedded objects/macros may partially degrade during conversion.
- Formatting drift is expected in some edge cases; prioritize structural fidelity and user-specified edits.
- Do not convert final deliverable back to `.doc` unless user explicitly asks.
