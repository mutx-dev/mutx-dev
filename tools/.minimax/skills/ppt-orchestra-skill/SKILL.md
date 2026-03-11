---
name: ppt-orchestra-skill
description: "A must use skill before generating a multi-paged HTML presentation"
license: Proprietary. LICENSE.txt has complete terms
---

# Slide Page Types (Standard)

For slide-by-slide generation (one HTML file per slide), classify **every slide** as **exactly one** of these 5 page types. This keeps structure consistent and prevents “random layout drift”.

1. **Cover Page**
   - **Use for**: opening + tone setting
   - **Content**: big title, subtitle/presenter, date/occasion, strong background/motif
2. **Table of Contents**
   - **Use for**: navigation + expectation setting (3–5 sections)
   - **Content**: section list (optional icons / page numbers)
3. **Section Divider**
   - **Use for**: clear transitions between major parts
   - **Content**: section number + title (+ optional 1–2 line intro)
4. **Content Page** (pick a subtype)
   - **Text**: bullets/quotes/short paragraphs (still add icons/shapes)
   - **Mixed media**: two-column / half-bleed image + text overlay
   - **Data visualization**: chart + 1–3 key takeaways + **source**
   - **Comparison**: side-by-side columns/cards (A vs B, pros/cons)
   - **Timeline / process**: steps with arrows, journey, phases
   - **Image showcase**: hero image, gallery, or visual-first layout
5. **Summary / Closing Page**
   - **Use for**: wrap-up + action
   - **Content**: key takeaways, CTA/next steps, contact/QR, thank-you

**Layout options:**
- Two-column (text left, illustration on right)
- Icon + text rows (icon in colored circle, bold header, description below)
- 2x2 or 2x3 grid (image on one side, grid of content blocks on other)
- Half-bleed image (full left or right side) with content overlay

**Data display:**
- Large stat callouts (big numbers 60-72pt with small labels below)
- Comparison columns (before/after, pros/cons, side-by-side options)
- Timeline or process flow (numbered steps, arrows)

**Visual polish:**
- Icons in small colored circles next to section headers
- Italic accent text for key stats or taglines

### Typography

**Choose an interesting font pairing** — don't default to Arial. Pick a header font with personality and pair it with a clean body font.

| Header Font | Body Font |
|-------------|-----------|
| Georgia | Calibri |
| Arial Black | Arial |
| Calibri | Calibri Light |
| Cambria | Calibri |
| Trebuchet MS | Calibri |
| Impact | Arial |
| Palatino | Garamond |
| Consolas | Calibri |

| Element | Size |
|---------|------|
| Slide title | 36-44pt bold |
| Section header | 20-24pt bold |
| Body text | 14-16pt |
| Captions | 10-12pt muted |

### Spacing

- 0.5" minimum margins
- 0.3-0.5" between content blocks
- Leave breathing room—don't fill every inch

### Avoid (Common Mistakes)

- **Don't repeat the same layout** — vary columns, cards, and callouts across slides
- **Don't center body text** — left-align paragraphs and lists; center only titles
- **Don't skimp on size contrast** — titles need 36pt+ to stand out from 14-16pt body
- **Don't default to blue** — pick colors that reflect the specific topic
- **Don't mix spacing randomly** — choose 0.3" or 0.5" gaps and use consistently
- **Don't style one slide and leave the rest plain** — commit fully or keep it simple throughout
- **Don't create text-only slides** — add images, icons, charts, or visual elements; avoid plain title + bullets
- **Don't forget text box padding** — when aligning lines or shapes with text edges, set `margin: 0` on the text box or offset the shape to account for padding
- **Don't use low-contrast elements** — icons AND text need strong contrast against the background; avoid light text on light backgrounds or dark text on dark backgrounds
- **NEVER use accent lines under titles** — these are a hallmark of AI-generated slides; use whitespace or background color instead

## Dependencies

- `pip install "markitdown[pptx]"` - text extraction
- `pip install Pillow` - thumbnail grids
- `npm install -g pptxgenjs` - creating from scratch
- LibreOffice (`soffice`) - PDF conversion (auto-configured for sandboxed environments via `scripts/office/soffice.py`)
- Poppler (`pdftoppm`) - PDF to images
