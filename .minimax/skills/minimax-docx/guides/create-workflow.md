# Create Workflow

Use this guide when:
- Creating a new document from scratch
- **Redesigning/beautifying** an existing poorly-formatted document (content extraction + new design)

---

## 1. Lane Clarification

| Scenario | Lane | Rationale |
|----------|------|-----------|
| No input file | Create | Pure creation |
| Input file + "fill this template" | Template-Apply | Preserve structure |
| Input file + "redesign/beautify this" | **Create** | Extract content, rebuild with new design |
| Input file + "fix formatting issues" | **Create** | Content is source, not structure |

When input exists but user wants redesign, treat the file as **content source**, not template.

---

## 2. Content Extraction (When Input Exists)

### 2.1 Detect Container Type

Check magic bytes before processing:

```bash
xxd -l 8 <input-file>
```

| Container | Magic Bytes | Action |
|-----------|-------------|--------|
| OOXML (.docx) | `50 4B 03 04` | Extract directly |
| OLE Binary (.doc) | `D0 CF 11 E0 A1 B1 1A E1` | Convert first |

### 2.2 Convert Legacy .doc

```bash
soffice --headless --convert-to docx --outdir <tmp-dir> <input.doc>
```

- Do NOT use `textutil` (loses structure fidelity)
- Keep original read-only
- Work with converted copy

### 2.3 Extract Content

```bash
# Preview text content
python3 <skill-path>/docx_engine.py preview <input.docx>

# Or use pandoc for structured extraction
pandoc <input.docx> -t markdown -o content.md
```

Extract:
- Text content (paragraphs, headings)
- Table data
- List items
- Image references (if reusable)

Discard:
- Poor styling/formatting
- Broken layouts
- Inconsistent spacing

---

## 3. Scene Routing

Match the document's purpose to a template starting point:

| Scene Characteristics | Recommended Template | Key Features |
|----------------------|---------------------|--------------|
| Academic/Research | `AcademicPaper.cs` | Abstract, citations, formal hierarchy |
| Technical Manual | `TechManual.cs` | Code blocks, tables, procedures |
| Book/Collection/Small paper (A5/B5) | `PoetryCollection.cs` | Section isolation, headers/footers |
| Business Report | Combine primitives | Executive summary, charts, recommendations |

**No exact match?** Use design primitives (Section 2) to compose from scratch.

---

## 4. Design Primitives

When no template fits, combine these building blocks:

### 2.1 Cover Page Patterns

| Pattern | Visual Effect | Best For |
|---------|---------------|----------|
| **Full-bleed** | Background image fills page, text overlays | Brochures, pitch decks, event programs |
| **Whitespace-centered** | Large margins, content centered or offset | Resumes, academic covers, minimalist reports |
| **Split** | Left/right or top/bottom zones with contrast | Proposals, dual-language documents |

Implementation: `render/page_art.py` for backgrounds, Word text layer for editability.

### 2.2 Body Layout Patterns

| Pattern | Visual Effect | Best For |
|---------|---------------|----------|
| **Single column** | Traditional flow | Reports, papers, contracts |
| **Two column** | Magazine feel | Newsletters, catalogs, manuals |
| **Card grid** | Equal-width blocks with images | Product listings, performer bios, portfolios |
| **Timeline** | Vertical axis with nodes | Resumes, project histories, event schedules |
| **Side-by-side** | Left/right comparison | Contracts, before/after, bilingual |

Implementation: See `Layout.cs` for column/section helpers.

### 2.3 Navigation Elements

| Element | When to Include | Implementation |
|---------|-----------------|----------------|
| TOC | 3+ major sections | `Fields.cs` → TOC field + refresh hint |
| Page numbers | Multi-page documents | Footer with PAGE/NUMPAGES fields |
| Headers | Persistent identification needed | Document title or org name |
| Section dividers | Long documents with distinct parts | PageBreakBefore + visual heading |

---

## 5. Design Decision Framework

When composing without a template, answer these questions:

### 3.1 Content Density

| If... | Then... |
|-------|---------|
| High density (tables, lists, data) | Tighter spacing, smaller margins, compact headings |
| Low density (prose, few elements) | Generous whitespace, larger titles, more breathing room |

### 3.2 Visual Focus

| If... | Then... |
|-------|---------|
| Image-heavy | Full-bleed covers, card layouts, minimal text styling |
| Text-heavy | Strong heading hierarchy, wider line spacing, clear indentation |

### 3.3 Reading Pattern

| If... | Then... |
|-------|---------|
| Sequential (start to end) | Traditional chapters, numbered sections, linear flow |
| Random access (flip through) | Independent pages, strong navigation, visual anchors |

### 3.4 Audience & Purpose

| If reader needs to... | Prioritize... |
|----------------------|---------------|
| Approve budget/scope | Executive summary, decision options, recommendations early |
| Execute implementation | Procedures, constraints, checklists, verification steps |
| Audit compliance | Traceability tables, signature blocks, metadata |

---

## 6. Adjustment Guide

### 4.1 Color Palette

**Location**: `src/Templates/Themes.cs` or inline in your code.

```csharp
// Use a predefined theme
var colors = Themes.Ocean;  // or Forest, Stone, Ember, Amethyst, Monochrome

// Apply to heading
new Color { Val = colors.Heading }

// Apply to body
new Color { Val = colors.Body }
```

**Principles**:
- Maximum 3 primary colors
- Use muted/desaturated tones
- Ensure sufficient contrast (heading vs body)

**Scene-color mapping**:

| Scene | Recommended Palette |
|-------|---------------------|
| Corporate/Finance | Stone, Monochrome |
| Tech/Product | Ocean, Stone |
| Academic | Ocean, Forest |
| Creative/Event | Amethyst, Ember |
| ESG/Nature | Forest |

### 4.2 Spacing & Margins

**Location**: `src/Core/Layout.cs`, `src/Core/Primitives.cs`

| Element | Property | Default | Small Paper (A5/B5) |
|---------|----------|---------|---------------------|
| Page margins | `PageMargin` | 1440 twips (1") | 1080 twips (0.75") |
| Paragraph after | `SpacingBetweenLines.After` | 200 twips (10pt) | 120-160 twips |
| Line height | `SpacingBetweenLines.Line` | 360 (1.5x) | 300-360 |
| Section gap | Before major heading | 480 twips (24pt) | 280-360 twips |

**Unit reference**: 1 pt = 20 twips, 1 inch = 1440 twips

### 4.3 Structure Modifications

**Add cover page**:
```csharp
// 1. Add cover content
body.Append(CreateCoverPage(title, subtitle, date));

// 2. End cover section (CRITICAL for small paper)
body.Append(new Paragraph(
    new ParagraphProperties(
        new SectionProperties(
            new SectionType { Val = SectionMarkValues.NextPage }
        )
    )
));

// 3. Continue with body content
```

**Add TOC**:
```csharp
// Use Fields.cs helper
body.Append(Fields.TableOfContents());

// Add refresh hint (gray, smaller font)
body.Append(new Paragraph(
    new ParagraphProperties(new ParagraphStyleId { Val = "TOCHint" }),
    new Run(
        new RunProperties(
            new Color { Val = "808080" },
            new FontSize { Val = "18" }
        ),
        new Text("(Right-click TOC → Update Field to refresh page numbers)")
    )
));
```

**Remove headers/footers**: Simply don't append HeaderPart/FooterPart.

### 4.4 Paper Size Adaptation

**Small paper (A5/B5) checklist**:
- [ ] Use section breaks, not spacing hacks, for cover isolation
- [ ] Reduce all spacing proportionally (see 4.2)
- [ ] Test that cover content fits on one page
- [ ] Consider removing TOC if document is short

**Reference**: `src/Templates/PoetryCollection.cs` demonstrates A5/B5 patterns.

---

## 7. Scenario Completeness

When creating from scratch, verify role-critical blocks are present:

| Document Type | Required Blocks |
|---------------|-----------------|
| Exam/Quiz | Candidate info zone, score columns, grader signature |
| Contract | Party info, signature/seal slots, effective date, annexes |
| Meeting Minutes | Attendees, action items with owners, due dates |
| Proposal | Decision summary, scope, milestones, budget, acceptance terms |
| Invoice | Invoice number, line items, subtotal/tax/total, payment details |
| Resume | Contact info, experience timeline, skills summary |
| Event Program | Schedule, performer/speaker info, venue details |

---

## 8. Visual Exit Checklist

Before delivery, verify:

- [ ] **Hierarchy**: H1 > H2 > H3 visually distinct (size, weight, spacing)
- [ ] **Spacing**: Consistent paragraph gaps, no cramped sections
- [ ] **Alignment**: Text aligned consistently (usually left/justified)
- [ ] **Colors**: ≤3 primary colors, no clashing tones
- [ ] **Whitespace**: Margins ≥72pt, content not edge-to-edge
- [ ] **Flow**: `KeepNext` on headings, `PageBreakBefore` on chapters
- [ ] **Navigation**: Page numbers present if multi-page
- [ ] **TOC**: Includes refresh hint if present

---

## 9. Build Commands

```bash
# 1. Check environment
python3 <skill-path>/docx_engine.py doctor

# 2. Generate document
python3 <skill-path>/docx_engine.py render output.docx

# 3. Validate
python3 <skill-path>/docx_engine.py audit output.docx

# 4. Preview content
python3 <skill-path>/docx_engine.py preview output.docx
```

---

## 10. Code References

| Need | Reference File |
|------|----------------|
| Page/section layout | `src/Core/Layout.cs` |
| Text/paragraph primitives | `src/Core/Primitives.cs` |
| TOC/bookmarks/fields | `src/Core/Fields.cs` |
| Image embedding | `src/Core/Media.cs` |
| Unit conversions | `src/Core/Metrics.cs` |
| Academic document example | `src/Templates/AcademicPaper.cs` |
| Technical manual example | `src/Templates/TechManual.cs` |
| Book/collection example | `src/Templates/PoetryCollection.cs` |
| Color themes | `src/Templates/Themes.cs` |
| Background rendering | `render/page_art.py` |
