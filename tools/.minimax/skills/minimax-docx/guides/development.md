# C# OpenXML Coding Guide

> **Required Reading**: This document contains critical rules to avoid compile errors. Must read before writing C# code.

For template-apply workflow, see `guides/template-apply-workflow.md` first.

---

## 1. Dependency Discipline

- Keep core workflow dependency-free (Python stdlib + .NET).
- Treat `matplotlib`, `playwright`, `Pillow` as optional.
- Use lazy imports for optional libraries.
- Degrade gracefully when optional features are unavailable.

---

## 2. OOXML Order Profiles

`spec/ooxml_order.py` uses layered constraints:

| Layer | Meaning | Typical Use |
|---|---|---|
| `MUST` | Schema anchor order | Any generation |
| `SHOULD` | Compatibility order | Default `repair` profile |
| `MAY` | Optional hints | `compat`/`strict` |
| `VENDOR` | Implementation-specific | `strict` diagnostics |

Profiles: `minimal`, `repair` (default), `compat`, `strict`

```bash
python3 <skill-path>/docx_engine.py order pPr repair
```

---

## 3. String Encoding Rules (CRITICAL)

### Core Principle: Keep text as-is, escape only when necessary

**Default behavior**: All Chinese, Japanese, Korean (CJK) characters are written directly in strings.

**Only these characters require Unicode escaping**:

| Character | Unicode | Reason |
|-----------|---------|--------|
| " (Chinese left double quote) | `\u201c` | C# compiler treats it as string delimiter → CS1003 |
| " (Chinese right double quote) | `\u201d` | Same as above |
| ' (Chinese left single quote) | `\u2018` | May conflict with character literals |
| ' (Chinese right single quote) | `\u2019` | Same as above |

### Wrong vs Correct Examples

```csharp
// ❌ Wrong - Chinese quotes cause CS1003 compile error
new Text("Please click "OK" button")

// ✓ Correct - Only quotes use Unicode escaping, other Chinese stays as-is
new Text("Please click \u201cOK\u201d button")

// ✓ Correct - Book title marks, parentheses, colons used directly
new Text("See《User Manual》Chapter 3（Important）：Notes")
```

### Never Use Verbatim Strings @""

**`\u` escaping does not work in `@""` verbatim strings**:

```csharp
// ❌ Wrong - @"" doesn't escape \u, outputs literal \u201c
string text = @"She said\u201cHello\u201d";  // Output: She said\u201cHello\u201d

// ✓ Correct - Regular string, \u escapes properly
string text = "She said\u201cHello\u201d";   // Output: She said"Hello"
```

### Long Text: Use + Concatenation

```csharp
var para = new Text(
    "As urbanization accelerates, smart city construction has become a national priority. " +
    "The \u201cFourteenth Five-Year\u201d National Informatization Plan states: " +
    "\u201cDigital transformation shall drive production method reform.\u201d"
);
```

### Characters That Don't Need Escaping

| Category | Characters | Example |
|----------|------------|---------|
| Book title marks | 《 》 | `"See《Guide》"` |
| Chinese parentheses | （ ） | `"（Note）"` |
| Chinese punctuation | ：。，；！？、 | Use directly |

---

## 4. Namespace Aliases (MANDATORY)

**CRITICAL**: `DocumentFormat.OpenXml.Drawing` and `DocumentFormat.OpenXml.Wordprocessing` contain identical class names (`Paragraph`, `Run`, `Text`, `Table`, etc.). Direct `using` causes CS0104 ambiguity errors.

```csharp
// ✓ Correct - use aliases
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;  // Main namespace, no alias needed
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;  // Anchor, Inline
using A = DocumentFormat.OpenXml.Drawing;                   // Graphic, Blip
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;        // Picture
using C = DocumentFormat.OpenXml.Drawing.Charts;            // Chart

// Usage: DW.Anchor, A.Graphic, PIC.Picture, C.BarChart
// Wordprocessing types (Paragraph, Run, Text) need no prefix

// ❌ Wrong - causes ambiguity
using DocumentFormat.OpenXml.Drawing;           // Conflicts with Wordprocessing!
using DocumentFormat.OpenXml.Wordprocessing;
```

---

## 5. API Quick Reference

### Common Wrong vs Correct Names

| Wrong | Correct |
|-------|---------|
| `mainPart.Styles` | `mainPart.AddNewPart<StyleDefinitionsPart>()` |
| `StyleBasedOn` | `BasedOn` |
| `SpacingBefore` / `SpacingAfter` | `SpacingBetweenLines` |
| `Alignment` / `ParagraphAlignment` | `Justification` |
| `JustificationValues.Justify` | `JustificationValues.Both` (justified) |
| `PageBreak` | `new Break { Type = BreakValues.Page }` |
| `LineSpacing` | `SpacingBetweenLines` |
| `Indention` (typo) | `Indentation` |
| `new FontSize { Val = 24 }` (int) | `new FontSize { Val = "24" }` (string) |
| `StrikeThrough` | `Strike` |
| `NumberingFormatValues` | `NumberFormatValues` (no -ing) |
| `new Level(0)` | `new Level() { LevelIndex = 0 }` |
| `sectPr.TitlePage = new TitlePage()` | `sectPr.Append(new TitlePage())` |

### Paragraph Properties Quick Reference

| Property | Class | Example |
|----------|-------|---------|
| Space after | SpacingBetweenLines | `new SpacingBetweenLines { After = "200" }` |
| Space before | SpacingBetweenLines | `new SpacingBetweenLines { Before = "600" }` |
| Line spacing | SpacingBetweenLines | `new SpacingBetweenLines { Line = "360", LineRule = LineSpacingRuleValues.Auto }` |
| First line indent | Indentation | `new Indentation { FirstLine = "420" }` |
| Center | Justification | `new Justification { Val = JustificationValues.Center }` |
| Justify | Justification | `new Justification { Val = JustificationValues.Both }` |

### Common Code Patterns

```csharp
// Centered heading
new Paragraph(
    new ParagraphProperties(
        new Justification { Val = JustificationValues.Center },
        new SpacingBetweenLines { After = "400", Before = "600" }
    ),
    new Run(new Text("Title"))
)

// Left-aligned body (first line indent)
new Paragraph(
    new ParagraphProperties(
        new Indentation { FirstLine = "420" },
        new SpacingBetweenLines { After = "200" }
    ),
    new Run(new Text("Body content"))
)
```

---

## 6. RunProperties Element Order (CRITICAL)

OpenXML ordering in `RunProperties` is profile-sensitive. In `strict` profile, use the sequence below to avoid validation drift.

**Recommended strict-profile order (top to bottom):**

| # | Element | Example |
|---|---------|---------|
| 1 | rStyle | `new RunStyle { Val = "Heading1Char" }` |
| 2 | rFonts | `new RunFonts { Ascii = "Arial", EastAsia = "SimSun" }` |
| 3 | b | `new Bold()` |
| 4 | i | `new Italic()` |
| 5 | strike | `new Strike()` |
| 6 | color | `new Color { Val = "FF0000" }` |
| 7 | sz | `new FontSize { Val = "24" }` |
| 8 | szCs | `new FontSizeComplexScript { Val = "24" }` |
| 9 | u | `new Underline { Val = UnderlineValues.Single }` |
| 10 | vertAlign | `new VerticalTextAlignment { Val = VerticalPositionValues.Superscript }` |

```csharp
// ❌ Wrong order - sz before color
new RunProperties(
    new FontSize { Val = "24" },
    new Color { Val = "666666" }
)

// ✓ Correct order - color before sz
new RunProperties(
    new RunFonts { EastAsia = "SimSun" },
    new Color { Val = "666666" },
    new FontSize { Val = "24" }
)
```

---

## 7. Type Conversions (CRITICAL)

OpenXML properties often require explicit type conversions.

| Target Type | Conversion | Example |
|-------------|------------|---------|
| `UInt32Value` | `(UInt32Value)(uint)value` | `new TableRowHeight { Val = (UInt32Value)(uint)400 }` |
| `Int32Value` | `(Int32Value)value` | `new Indentation { Left = (Int32Value)420 }` |
| `StringValue` | `value.ToString()` | `new FontSize { Val = "24" }` |
| `OnOffValue` | `new OnOffValue(true)` | `new Bold { Val = new OnOffValue(true) }` |
| `EnumValue<T>` | Direct assignment | `new Justification { Val = JustificationValues.Center }` |

```csharp
// ❌ Wrong - int cannot convert to UInt32Value
new TableRowHeight { Val = 400 }

// ✓ Correct
new TableRowHeight { Val = (UInt32Value)(uint)400 }

// ❌ Wrong - int in conditional
new TableRowHeight { Val = row == 0 ? 400 : 300 }

// ✓ Correct
new TableRowHeight { Val = (UInt32Value)(uint)(row == 0 ? 400 : 300) }
```

---

## 8. Value Constraints

| Property | Type | Wrong | Correct |
|----------|------|-------|---------|
| `FontSize.Val` | Integer string | `"17.5"` ❌ | `"18"` ✓ (9pt) |
| `Indentation.FirstLine` | UInt32 (≥0) | `"-420"` ❌ | `"420"` ✓ |
| `Indentation.Left` | UInt32 (≥0) | `"-420"` ❌ | `"420"` ✓ |

**Negative indent solution**: Use `Hanging` property:

```csharp
// ❌ Wrong
new Indentation { FirstLine = "-420" }

// ✓ Correct
new Indentation { Hanging = "420", Left = "420" }
```

### Unit Conversions

| Conversion | Formula |
|------------|---------|
| 1 inch | = 72 pt = 1440 Twips = 914400 EMU |
| 1 pt | = 20 Twips = 12700 EMU |
| 1 cm | ≈ 567 Twips |
| 1 Twip | = 635 EMU |
| FontSize Val | = pt × 2 (half-points) |

### Paper Sizes (Twips)

| Size | Portrait (W×H) | Landscape |
|------|----------------|-----------|
| A3 | 16838 × 23811 | Swap + Orient |
| A4 | 11906 × 16838 | Swap + Orient |
| A5 | 8391 × 11906 | Swap + Orient |
| Letter | 12240 × 15840 | Swap + Orient |

**Landscape**: `PageSize { Width=H, Height=W, Orient=PageOrientationValues.Landscape }`

---

## 9. Common Error Troubleshooting

### Compile Errors

| Error | Cause | Solution |
|-------|-------|----------|
| CS1003 Chinese quotes | `""` treated as delimiter | Use `\u201c\u201d` |
| CS0246 `SpacingBefore` | Class doesn't exist | Use `SpacingBetweenLines` |
| CS0246 `Alignment` | Class doesn't exist | Use `Justification` |
| CS0117 `JustificationValues.Justify` | Enum value doesn't exist | Use `.Both` |
| CS0246 `LineSpacing` | Class doesn't exist | Use `SpacingBetweenLines` |
| CS0246 `StrikeThrough` | Wrong class name | Use `Strike` |

### Schema Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `'br' invalid child` | Break not inside Run | `new Run(new Break { Type = BreakValues.Page })` |
| `bookmarkStart invalid child of pPr` | Wrong Bookmark location | Place directly in Paragraph, not in pPr |
| `docPr id duplicates` | Hardcoded duplicate IDs | Use global counter `docPrId++` |

### Table Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Column width stretched by content | Missing `TableCellWidth` | Set `TableCellWidth { Type = Dxa }` for every cell |
| Table skewed | `GridColumn` doesn't match `TableCellWidth` | Ensure values match |
| Exceeds page | Total column width too large | Keep total under 9350 twips |

### ⚠️ Table Width Matching Rules (CRITICAL)

`GridColumn.Width` and `TableCellWidth.Width` **MUST use the same value and unit type**.

```csharp
// ❌ Wrong - GridColumn uses Pct, TableCellWidth uses Dxa
new TableGrid(
    new GridColumn { Width = "2500" },  // 50% in Pct
    new GridColumn { Width = "2500" }
);
new TableCellWidth { Width = "4680", Type = TableWidthUnitValues.Dxa }  // Mismatch!

// ✓ Correct - Both use Dxa with matching values
new TableGrid(
    new GridColumn { Width = "4680" },
    new GridColumn { Width = "4680" }
);
new TableCellWidth { Width = "4680", Type = TableWidthUnitValues.Dxa }

// ✓ Correct - Both use Pct (percentage × 50)
new TableGrid(
    new GridColumn { Width = "2500" },  // 50%
    new GridColumn { Width = "2500" }
);
new TableCellWidth { Width = "2500", Type = TableWidthUnitValues.Pct }
```

**Complete table example:**
```csharp
var table = new Table();
int[] colWidths = { 2000, 3680, 3680 };  // Total = 9360 twips

// 1. TableProperties
table.Append(new TableProperties(
    new TableWidth { Width = "0", Type = TableWidthUnitValues.Auto },
    new TableLayout { Type = TableLayoutValues.Fixed }
));

// 2. TableGrid - define column widths
table.Append(new TableGrid(
    colWidths.Select(w => new GridColumn { Width = w.ToString() }).ToArray()
));

// 3. TableRow with matching TableCellWidth
var row = new TableRow();
foreach (var w in colWidths) {
    row.Append(new TableCell(
        new TableCellProperties(
            new TableCellWidth { Width = w.ToString(), Type = TableWidthUnitValues.Dxa }
        ),
        new Paragraph(new Run(new Text("Cell")))
    ));
}
table.Append(row);
```

---

## 10. Critical Code Snippets

### Correct Bookmark Placement

```csharp
// ❌ Wrong - Bookmark inside pPr
new Paragraph(
    new ParagraphProperties(
        new BookmarkStart { Id = "420", Name = "ChartAnchor_Q1" }  // Wrong!
    ),
    new Run(new Text("Q1 trend chart")),
    new BookmarkEnd { Id = "420" }
)

// ✓ Correct - Directly in Paragraph
new Paragraph(
    new ParagraphProperties(new ParagraphStyleId { Val = "FigureCaption" }),
    new BookmarkStart { Id = "420", Name = "ChartAnchor_Q1" },
    new Run(new Text("Chart A: Q1 Trend Overview")),
    new BookmarkEnd { Id = "420" }
)
```

In stream assembly terms, `BookmarkStart/BookmarkEnd` are content anchors and must stay in the paragraph payload stream, not inside paragraph property metadata (`pPr`).

### docPr ID Uniqueness

```csharp
// Class-level counter
private static uint _docPrId = 1;

// Increment on use
new DW.DocProperties { Id = _docPrId++, Name = "Image1" }
```

### Dynamic Image Dimensions

```csharp
// ❌ Never hardcode
long chartWidth = 6000000;
long chartHeight = 3375000;

// ✓ Read from PNG header
private static (int width, int height) GetPngDimensions(string path)
{
    using var fs = new FileStream(path, FileMode.Open, FileAccess.Read);
    fs.Seek(16, SeekOrigin.Begin);
    var buffer = new byte[8];
    fs.Read(buffer, 0, 8);
    int width = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
    int height = (buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7];
    return (width, height);
}

var (w, h) = GetPngDimensions(imagePath);
long displayWidth = 5000000L;
long displayHeight = displayWidth * h / w;
```

---

## 11. Golden Rule: Never Improvise API Calls

**Use current source modules as API references.** Prefer `src/Core/*.cs` and `src/Templates/*.cs` for class names, property names, and constructor patterns. When writing code:

✓ Correct approach:
1. Find the corresponding API pattern in `src/Core` or `src/Templates`
2. Reference its API call structure (class names, property assignments, element ordering)
3. Adapt content and **document structure** to match user requirements — examples are API cookbooks, not mandatory templates

❌ Wrong approach:
- Recall API names from memory and write directly
- Infer property names from "common sense"
- Use properties not found in any code examples

**Document structure is flexible.** Each helper in `src/Core` and each assembly segment in `src/Templates` is a reusable building block. Select and combine them based on the document's actual needs.

### Table Creation Checklist

- [ ] Based on `Layout.Matrix(...)` + `Layout.ThreeLineTable(...)` pattern?
- [ ] Has `TableGrid` defining column widths?
- [ ] **Every cell has `TableCellWidth`?**
- [ ] `TableCellWidth` matches `GridColumn` width?
- [ ] No properties not found in examples?

---

## 12. Extended Reference

Use current files as canonical references:

- `src/Core/Metrics.cs`: pt/Twips/EMU/cm conversions
- `src/Core/Layout.cs`: section/page/table layout helpers
- `src/Core/Fields.cs`: TOC, cross-reference, bookmark, update-on-open field helpers
- `src/Core/Primitives.cs`: text/paragraph primitives and style fragments
- `src/Templates/AcademicPaper.cs`: long-form report assembly pattern
- `src/Templates/TechManual.cs`: technical manual/table-heavy assembly pattern
