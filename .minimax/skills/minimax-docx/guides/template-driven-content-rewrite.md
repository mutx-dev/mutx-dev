# Template-Driven Content Rewrite Protocol

Use this guide whenever a user provides a `.docx` template and expects content to be filled or updated.

## Objective

Prevent blind concatenation of template sample text and target content by forcing explicit keep/replace/drop decisions before writing.

## Mandatory Execution Sequence

1. Ensure input is normalized `.docx` (for legacy `.doc`, follow `guides/doc-input-normalization.md` first).
2. Parse template structure with `TemplateAnalyzer`.
3. Enumerate candidate text units to change (titles, table cells, labels, inline values, signature-adjacent fields).
4. Build a **Replacement Matrix** before editing any text.
5. Reject matrix rows with unknown action or missing target values.
6. Generate schema-aligned mapping scaffold: `python3 <skill-path>/docx_engine.py map-template <mapping.json> --require R1,R2`.
7. Fill mapping rows from the matrix, then run gate: `python3 <skill-path>/docx_engine.py map-gate <mapping.json> --require R1,R2`.
8. Run deterministic executor: `python3 <skill-path>/docx_engine.py map-apply <input.docx> <mapping.json> <output.docx> --require R1,R2`.
9. Apply modifications only from resolved `REPLACE` and `DROP` rows.
10. Run preview and residual-placeholder checks.

Do not skip step 3. No matrix means no rewrite.

## Replacement Matrix Format

Each row must include:

- `template_snippet`: exact text found in template
- `field_name`: semantic meaning (company_name, contract_date, total_amount)
- `action`: `KEEP` or `REPLACE` or `DROP`
- `target_value`: required for `REPLACE`, empty for `KEEP`, optional for `DROP`
- `value_source`: where target value comes from (user input or confirmed inference)

## Decision Rules

Apply rules in order:

1. User explicit instruction overrides template text.
2. Keep structural scaffolding by default:
   headings, legal boilerplate, section labels, numbering anchors, signature captions.
3. Replace business facts when user supplies updates:
   names, dates, amounts, addresses, IDs, phone numbers, table values.
4. Drop obvious placeholders and demos unless user asks to keep:
   `XXX`, `TODO`, `TBD`, `sample`, `example`, `template`, `[company]`, `[date]`, `示例`, `模板`, `仅供参考`.
5. If uncertain, mark `KEEP` and ask for clarification. Never guess and never partially replace.

## Anti-Concatenation Constraints

- Never output combined strings like `TemplateValue/NewValue` unless user explicitly requests dual-display.
- When a field is replaced, remove old value entirely from the same field.
- Do not append new paragraphs to avoid editing existing placeholder rows when the task is "fill template".

## Quick Residual Check

After build:

1. Run `python3 <skill-path>/docx_engine.py preview <output.docx>`.
2. Run `python3 <skill-path>/docx_engine.py residual <output.docx>`.
3. Confirm all `REPLACE` rows landed.

If any placeholder remains unexpectedly, return to matrix and patch logic before final delivery.

## Minimal Example

| template_snippet | field_name | action | target_value | value_source |
|---|---|---|---|---|
| `Acme Co., Ltd.` | company_name | REPLACE | `Beijing Nova Tech Co., Ltd.` | user brief |
| `[Date]` | contract_date | REPLACE | `2026-02-14` | user brief |
| `This template is for reference only.` | demo_notice | DROP |  | template cleanup rule |
| `Authorized Signature` | signature_caption | KEEP |  | structure rule |
