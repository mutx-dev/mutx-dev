# Best Practices: Creating Documents from Scratch

> **Scope**: This guide applies when creating a new document without a user-provided template or reference file. When the user supplies a template, outline, or explicit structural instructions, **defer to their input** — these recommendations do not override user intent.

---

## 1. Recommended Document Structure Elements

When building a formal document from scratch (proposals, reports, theses, contracts), the following elements elevate perceived quality:

| Element | When to Include | Implementation Notes |
|---------|----------------|---------------------|
| Cover page | Formal deliverables (proposals, reports, contracts, invitations) | Use designer-quality background images via `render/page_art.py`; text implemented in Word for editability |
| Back cover | Paired with cover page for polished deliverables | Lighter design than cover; contact info or branding |
| Table of Contents | Documents with 3+ major sections | Include TOC refresh hint in gray, smaller font |
| Header | Most multi-page documents | Typically: document title or company name |
| Footer with page numbers | Most multi-page documents | Field codes for automatic numbering |

## 2. Visual Standards

| Property | Recommended Value | Rationale |
|----------|------------------|-----------|
| Page margins | ≥72pt (1 inch) all sides | Sufficient white space for readability |
| Paragraph spacing (body) | After ≥200 twips (10pt) | Visual separation between paragraphs |
| Line spacing (body) | ≥1.5x (`Line="360"`, Auto) | CJK readability |
| Color palette | Low saturation, muted tones | Professional appearance; see `src/Templates/Themes.cs` and `render/themes.py` |
| Font hierarchy | H1 > H2 > body, clear size contrast | Visual hierarchy guides the reader |

## 3. Scenario Completeness Matrix

When creating from zero, check whether the document is missing role-critical blocks.
Treat this as a completion matrix, not a rigid template.

| Scenario | Must-Have Blocks | Why It Matters |
|----------|------------------|----------------|
| Examination sheet | Candidate identity zone, score columns, reviewer signature zone | Supports grading and filing |
| Contract package | Party metadata, signature/seal slots, effective date, annex index | Improves enforceability and auditability |
| Meeting record | Participants/non-participants, owner-tagged action log, due-date column | Enables follow-up execution |
| Proposal | Decision summary, scope boundaries, delivery milestones, budget assumptions, acceptance terms | Reduces ambiguity at approval stage |
| Academic manuscript | Abstract, keyword block, citation list, author/affiliation metadata | Meets publication conventions |
| Commercial invoice | Invoice code, taxable line items, subtotal/tax/total, remittance details | Supports reconciliation and payment |

## 4. Structure Selection Heuristics (No User Outline)

Use audience and decision type to choose the skeleton:

| Document Category | Suggested Flow |
|-------------------|----------------|
| Academic | Problem framing → Related work → Method → Evidence → Discussion → Closing |
| Business | Context snapshot → Key findings → Decision options → Recommended path |
| Technical | System view → Design constraints → Implementation path → Validation examples → Ops FAQ |

### 4.1 Quick Decision Tree

1. If the reader must **approve budget/scope**, prioritize decision-oriented sections early.
2. If the reader must **execute implementation**, prioritize constraints, procedures, and verification artifacts.
3. If the reader must **audit compliance**, prioritize traceability tables and signature-ready metadata.

## 5. Pagination Control

| Element | Property | Purpose |
|---------|----------|---------|
| Primary heading (H1) | `PageBreakBefore` + `KeepNext` | Chapter separation |
| Secondary heading (H2) | `KeepNext` | Bind heading with following content |
| Pre-table text | `KeepNext` | Keep introductory text with table |
| Body paragraphs | `WidowControl` | Prevent orphan/widow lines |

## 6. Small Paper Sizes (A5, B5)

When designing for A5/B5 paper, be aware of reduced vertical space:

| Paper | Height vs A4 | Practical Impact |
|-------|--------------|------------------|
| A5 | ~70% of A4 | Cover designs that work on A4 may overflow |
| B5 | ~84% of A4 | Moderate reduction, usually safe |

### Cover Page Guidelines for Small Paper

**Problem**: Using `SpacingBetweenLines` (Gaps) to simulate vertical centering is fragile on small paper.

**Solution**: Always isolate cover pages with explicit section breaks:

```csharp
// After cover content, end the section
body.Append(new Paragraph(
    new ParagraphProperties(
        new SectionProperties(
            new SectionType { Val = SectionMarkValues.NextPage }
        )
    )
));
```

**Reference template**: `src/Templates/PoetryCollection.cs` demonstrates this pattern.

### Reduced Spacing Recommendations

| Element | A4 Value | A5/B5 Value |
|---------|----------|-------------|
| Cover top gap | 150pt | 60-80pt |
| Paragraph after | 10pt | 6-8pt |
| Section spacing | 24pt | 14-18pt |

## 7. TOC Hierarchy (Outline Levels)

TOC entries are determined by `OutlineLevel` in paragraph properties:

| OutlineLevel | TOC Display | Typical Usage |
|--------------|-------------|---------------|
| 0 | Level 1 | Major chapters, categories |
| 1 | Level 2 | Sections within chapters |
| 2 | Level 3 | Subsections |

**Common mistake**: Setting all titles to the same level causes flat TOC structure.

**Fix**: Ensure category/chapter headings use `OutlineLevel=0`, item titles use `OutlineLevel=1`.

See `src/Templates/PoetryCollection.cs` for correct hierarchy example.
