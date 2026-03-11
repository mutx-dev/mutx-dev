# Pitfall Guide - Common Mistakes & Correct Patterns

> This guide is compiled from real user feedback. All issues listed have high occurrence rates.

---

## 1. FontSize is Half-Points

**FontSize.Val uses half-points, NOT points!**

| Val | Actual Size | Use Case |
|-----|-------------|----------|
| `"144"` | 72pt | Extra large title |
| `"72"` | 36pt | Large title |
| `"44"` | 22pt | Medium title |
| `"24"` | 12pt | Body text |
| `"22"` | 11pt | Body text |
| `"20"` | 10pt | Footnote |

```csharp
// ❌ Wrong - Expecting Val="44" to be 44pt
new FontSize { Val = "44" }  // Actually only 22pt!

// ✓ Correct - For 44pt, set Val to 88
new FontSize { Val = "88" }  // 44pt
```

**Formula**: `Val = pt × 2`

---

## 1.5. 空白控制

**禁止用大字号的空行/空格撑空白。** 要留白用 `SpacingBetweenLines.Before/After`，不要创建72pt的空Run。

`Before = "6000"` 这种巨大段前间距，只适用于页面内容很少的场景。用之前先估算：这一页还要放多少内容？放得下吗？

---

## 1.6. TOC必须用Field Code

**禁止用超链接列表模拟目录。** 优先使用 `Fields.TableOfContents(...)` 生成目录字段；如需手写域代码，必须保证字段指令结构完整。

---

## 2. Landscape Page Setup
**Key**: Width/Height values are swapped from portrait.

```csharp
// ❌ Wrong - Using portrait dimensions directly
new PageSize { Width = 11906, Height = 16838 }  // Still portrait!

// ✓ Correct - Swap dimensions + set Orient
new PageSize {
    Width = (UInt32Value)16838U,   // Portrait height → Landscape width
    Height = (UInt32Value)11906U,  // Portrait width → Landscape height
    Orient = PageOrientationValues.Landscape
}
```

**Landscape Checklist**:
- [ ] PageSize.Width = Portrait height value
- [ ] PageSize.Height = Portrait width value
- [ ] PageSize.Orient = Landscape
- [ ] SectionProperties placed at end of Body

---

## 3. C# Constructor Multi-Element Syntax
**OpenXML constructors accept multiple child elements. Bracket positions are error-prone.**

```csharp
// ❌ Wrong - Closing bracket misplaced
new Run(new RunProperties(new Bold(), new Color { Val = "333333" }),
new Text("content")
));  // Extra closing bracket

// ✓ Correct - All child elements at same bracket level
new Run(
    new RunProperties(new Bold(), new Color { Val = "333333" }),
    new Text("content")
)

// ❌ Wrong - Missing Append closing bracket
body.Append(new Paragraph(
    new Run(new Text("content"))
);

// ✓ Correct - Complete bracket closure at each level
body.Append(new Paragraph(
    new Run(new Text("content"))
));
```

**Tip**: Use IDE auto-format to align brackets.

---

## 4. Working Directory
**Run `python3 <skill-path>/docx_engine.py ...` from the user workspace (`cwd`).**

`docx_engine.py` resolves paths relative to current working directory:

- staging: `cwd/.docx_workspace/`
- output: `cwd/output/`

```bash
# Standard workflow
python3 <skill-path>/docx_engine.py doctor
python3 <skill-path>/docx_engine.py render output.docx
python3 <skill-path>/docx_engine.py audit output/output.docx
```

⚠️ **Note**: Do not run commands from the skill installation directory.

---

## 4.5 Legacy `.doc` Binary Input

**Do not treat `.doc` as XML.** Legacy `.doc` is OLE binary, not OOXML zip.

Identify container first:

```bash
xxd -l 8 <input-file>
# ZIP/OOXML: 50 4b 03 04
# OLE binary: d0 cf 11 e0 a1 b1 1a e1
```

If OLE binary, convert first:

```bash
soffice --headless --convert-to docx --outdir <tmp-dir> <input.doc>
python3 <skill-path>/docx_engine.py audit <tmp-dir>/<converted>.docx
python3 <skill-path>/docx_engine.py residual <tmp-dir>/<converted>.docx
```

`textutil` is intentionally unsupported for this conversion path because template-structure fidelity is not reliable enough for deterministic mapping gates.

Common failures:

- `soffice: command not found`
  Install LibreOffice, or ask user for `.docx`.
- `Abort trap: 6` or conversion exits in restricted runtime
  Retry with elevated execution permission or run conversion outside sandbox.
- Conversion output missing
  Check write permissions on `--outdir` and file path encoding.
- Converted file fails `audit`
  Stop rewrite and request user-provided clean `.docx`.

---

## 4.6 Mapping Gate Failures (Template Fill/Patch)

If fill/patch mode is blocked by mapping gate:

```bash
python3 <skill-path>/docx_engine.py map-template <mapping.json> --require R1,R2
python3 <skill-path>/docx_engine.py map-gate <mapping.json> --require R1,R2
```

Common failures:

- `unresolved status`:
  some rows are `ambiguous/blocked`; resolve mapping decisions first.
- `missing required requirements`:
  one or more required requirement IDs are not covered by resolved rows.
- `replace/insert requires target_value`:
  executable row is missing replacement payload.
- `duplicate id`:
  mapping rows are not uniquely identifiable.

Action:

- Fix mapping table and rerun gate.
- If gate still fails, switch to template-apply rebuild mode instead of forcing fill/patch.

---

## 5. Multi-Column Layout

### 5.1 Basic Column Declaration

**Columns are set via SectionProperties.**

```csharp
// Option 1: True columns (recommended)
new SectionProperties(
    new Columns { ColumnCount = (Int16Value)2, Space = "720" },  // 2 cols, 720 twips gap
    new PageSize { ... },
    new PageMargin { ... }
)

// Option 2: Table-simulated columns (better compatibility)
var table = new Table(
    new TableProperties(new TableBorders()),
    new TableGrid(
        new GridColumn { Width = "4680" },
        new GridColumn { Width = "4680" }
    ),
    new TableRow(
        new TableCell(new Paragraph(new Run(new Text("Left column")))),
        new TableCell(new Paragraph(new Run(new Text("Right column"))))
    )
);
```

⚠️ **Note**: A single Paragraph won't auto-break across columns.

### 5.2 Full-Width Header + Multi-Column Body (Section-Switching)

When a document needs a **full-width title/header area** above **multi-column body text** (e.g., newspaper masthead, IEEE paper title, magazine cover), you must use **Continuous section breaks** to switch column counts without inserting a page break.

**Pattern:**
```
[Full-width zone: masthead/title, cols=1]
    → Continuous section break (ends cols=1 zone)
[Multi-column zone: body text, cols=N]
    → Final SectionProperties (cols=N)
```

**How it works:**
1. Write the full-width content (title, subtitle, author info, etc.)
2. End the full-width zone with a `Continuous` section break that declares `ColumnCount = 1`
3. Write the multi-column body content
4. The **final** `SectionProperties` (direct child of `Body`) declares the target column count

```csharp
// Step 1: Full-width title content
body.Append(titleParagraph);

// Step 2: End full-width zone → Continuous break with cols=1
body.Append(new Paragraph(
    new ParagraphProperties(
        new SectionProperties(
            new SectionType { Val = SectionMarkValues.Continuous },
            new PageSize { Width = (UInt32Value)(uint)pageW, Height = (UInt32Value)(uint)pageH },
            new PageMargin { Top = marginT, Right = (uint)marginLR, Bottom = marginB, Left = (uint)marginLR },
            new Columns { ColumnCount = 1 }
        )
    )
));

// Step 3: Multi-column body content
body.Append(col1Content);
body.Append(col2Content);
// ...

// Step 4: Final SectionProperties with target column count
body.Append(new SectionProperties(
    new PageSize { ... },
    new PageMargin { ... },
    new Columns { ColumnCount = 5, EqualWidth = true, Space = "200" }
));
```

**Reference:** See `src/Templates/AcademicPaper.cs`, `src/Templates/TechManual.cs`, and `src/Core/Layout.cs` for section and column composition patterns.

### 5.3 Column Breaks for Manual Content Distribution

**⚠️ Critical: Word columns use flow-based filling.** Text flows left-to-right, filling each column sequentially. When text runs out, remaining columns stay **empty**.

```
❌ Anti-pattern: Set ColumnCount=5, write some content, expect 5 filled columns
   → Result: content fills columns 1-3, columns 4-5 are blank

✓ Correct: Calculate content per column, insert column breaks to force distribution
   → Result: content evenly distributed across all 5 columns
```

**Use `Break { Type = BreakValues.Column }` to push content to the next column:**

```csharp
// Column 1 content
body.Append(new Paragraph(new Run(new Text("Column 1 article text..."))));
body.Append(new Paragraph(new Run(new Text("More column 1 content..."))));

// Force move to column 2
body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Column })));

// Column 2 content
body.Append(new Paragraph(new Run(new Text("Column 2 article text..."))));

// Force move to column 3
body.Append(new Paragraph(new Run(new Break { Type = BreakValues.Column })));

// Column 3 content
body.Append(new Paragraph(new Run(new Text("Column 3 article text..."))));

// ... repeat for columns 4, 5, etc.
```

**Key rules:**
- You need exactly **N-1 column breaks** for N columns
- The column break can be inside any Run — it pushes all subsequent content to the next column
- If a column break is the only content in a paragraph, that paragraph acts as a column separator

### 5.4 Content Volume and Page Capacity Estimation

When filling N columns on a single page, estimate how much content is needed:

**Single-column usable width:**
```
colWidth = (pageWidth - marginLeft - marginRight - (N-1) × columnSpace) / N
```

**Characters per line (Chinese, 10pt ≈ 210 twips per character):**
```
charsPerLine ≈ colWidth(twips) / 210
```

**Lines per column:**
```
linesPerCol ≈ (pageHeight - marginTop - marginBottom - headerAreaHeight) / lineSpacing(twips)
```

**Example — A4 landscape, 5 columns, 10pt Chinese text:**
```
pageWidth = 16838, marginLR = 900 each, columnSpace = 200 twips
colWidth = (16838 - 900 - 900 - 4×200) / 5 = 2847 twips
charsPerLine ≈ 2847 / 210 ≈ 13 characters
pageHeight = 11906, marginTB = 1080+1440, headerArea ≈ 1500 twips
linesPerCol ≈ (11906 - 1080 - 1440 - 1500) / 300 ≈ 26 lines
Total per column ≈ 13 × 26 ≈ 338 characters
Total for 5 columns ≈ 1690 characters
```

**⚠️ If the user asks to "fill all N columns" but content is insufficient:**
- Generate supplementary content (filler articles, lorem ipsum equivalent)
- Or reduce font size / tighten line spacing to make content stretch further
- Or reduce column count to match available content

### 5.5 Single-Page Constraint (Broadsheet / Newspaper Mode)

For newspaper-style or poster layouts that **must fit on a single page**:

**Mandatory rules:**
1. **All section breaks must use `SectionMarkValues.Continuous`** — never use `NextPage`
2. **Never insert `Break { Type = BreakValues.Page }`** — this creates a second page
3. **Back-calculate content limits** — estimate max content per §5.4, stay within bounds
4. **Adjust typography to fit:** shrink font size, tighten line spacing, reduce margins

```csharp
// ✓ Correct: All sections use Continuous
new SectionProperties(
    new SectionType { Val = SectionMarkValues.Continuous },
    // ...
)

// ❌ Wrong: paged section break creates a new page (OddPage/NextPage alike)
new SectionProperties(
    new SectionType { Val = SectionMarkValues.OddPage },
    // ...
)

// ❌ Wrong: Page break forces content to page 2
new Run(new Break { Type = BreakValues.Page })
```

**Broadsheet checklist:**
- [ ] All `SectionType` values are `Continuous`
- [ ] No `BreakValues.Page` anywhere in the document
- [ ] Content volume fits within estimated page capacity
- [ ] Font size and line spacing adjusted if content overflows
- [ ] Column breaks used to distribute content evenly across all columns

---

## 6. Compile Error Quick Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| CS1003 | Chinese quotes as delimiter | Use `\u201c\u201d` escaping |
| CS0246 | Type not found | Check namespace or use full qualified name |
| CS1026 | Missing closing bracket | Check constructor bracket matching |
| CS1501 | Wrong argument count | Check method signatures in `src/Core/*.cs` |
| CS0029 | Type conversion failed | Use `(UInt32Value)(uint)` |
| CS0104 | Ambiguous call | Use namespace aliases `DW.`/`A.` |

---

## 7. Wrong vs Correct Patterns Summary

### 7.1 FontSize

```csharp
// ❌ Wrong
new FontSize { Val = "36" }  // Expecting 36pt, gets 18pt

// ✓ Correct
new FontSize { Val = "72" }  // For 36pt
```

### 7.2 Type Conversion

```csharp
// ❌ Wrong
new TableRowHeight { Val = 400 }

// ✓ Correct
new TableRowHeight { Val = (UInt32Value)(uint)400 }

// ❌ Wrong - Conditional without cast
new TableRowHeight { Val = row == 0 ? 400 : 300 }

// ✓ Correct
new TableRowHeight { Val = (UInt32Value)(uint)(row == 0 ? 400 : 300) }
```

### 7.3 Table Width Matching

```csharp
// ❌ Wrong - GridColumn and TableCellWidth type mismatch
new GridColumn { Width = "2500" };  // Pct implied
new TableCellWidth { Width = "4680", Type = TableWidthUnitValues.Dxa };

// ✓ Correct - Same value and type
int[] widths = { 2000, 3680, 3680 };
new GridColumn { Width = widths[0].ToString() };
new TableCellWidth { Width = widths[0].ToString(), Type = TableWidthUnitValues.Dxa };
```

### 7.4 Chinese Quotes

```csharp
// ❌ Wrong - CS1003 compile error
new Text("Click "OK" button")

// ✓ Correct
new Text("Click \u201cOK\u201d button")
```

### 7.5 Bookmark Placement

```csharp
// ❌ Wrong - Inside ParagraphProperties
new Paragraph(
    new ParagraphProperties(
        new BookmarkStart { Id = "100", Name = "Fig1" }
    ),
    ...
)

// ✓ Correct - Direct child of Paragraph
new Paragraph(
    new ParagraphProperties(...),
    new BookmarkStart { Id = "100", Name = "Fig1" },
    new Run(new Text("Figure 1")),
    new BookmarkEnd { Id = "100" }
)
```

### 7.6 Page Break

```csharp
// ❌ Wrong - Class doesn't exist
new PageBreak()

// ✓ Correct
new Run(new Break { Type = BreakValues.Page })
```

### 7.7 Justification Values

```csharp
// ❌ Wrong - Enum value doesn't exist
new Justification { Val = JustificationValues.Justify }

// ✓ Correct - "Both" means justified
new Justification { Val = JustificationValues.Both }
```

---

## 8. Color Recommendations

**Use low saturation colors for legal/formal documents:**

```csharp
// ❌ Avoid
new Color { Val = "FF0000" }  // Pure red, too bright
new Color { Val = "0066CC" }  // Pure blue, too vivid

// ✓ Recommended
new Color { Val = "4A6B4A" }  // Soft olive green (for "New" labels)
new Color { Val = "5A6B7A" }  // Muted gray-blue (for "Revised" labels)
new Color { Val = "1A1A2E" }  // Dark gray (body text)
new Color { Val = "5a6b62" }  // Neutral gray (secondary text)
```

**See `src/Templates/Themes.cs` and `render/themes.py` for palette definitions.**

---

## 9. Schema Auto-Fix Limitations

`python3 <skill-path>/docx_engine.py render` can normalize many element-order issues, but **cannot fix**:

| Auto-Fixed | NOT Auto-Fixed |
|------------|----------------|
| Element order in RunProperties | Table width type mismatch |
| Element order in SectionProperties | Missing TableGrid |
| HeaderRef/FooterRef ordering | Duplicate docPr IDs |

**Best Practice**: Write code in correct order from the start rather than relying on auto-fix.
