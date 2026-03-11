---
name: slide-making-skill
description: "Must use this skill to know the html-ppt implementation details"
---
## Appendix A — Responsive Scaling Snippet (REQUIRED)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}
.slide-content {
  width: 960px;
  height: 540px;
  position: relative;
  transform-origin: center center;
}
</style>
<script>
function scaleSlide() {
  const slide = document.querySelector('.slide-content');
  if (!slide) return;
  const slideWidth = 960;
  const slideHeight = 540;
  const scaleX = window.innerWidth / slideWidth;
  const scaleY = window.innerHeight / slideHeight;
  const scale = Math.min(scaleX, scaleY);
  slide.style.width = slideWidth + 'px';
  slide.style.height = slideHeight + 'px';
  slide.style.transform = `scale(${scale})`;
  slide.style.transformOrigin = 'center center';
  slide.style.flexShrink = '0';
}
window.addEventListener('load', scaleSlide);
window.addEventListener('resize', scaleSlide);
</script>
```

## Appendix B — CSS Rules (REQUIRED)

### ⚠️ Inline-Only CSS

**All CSS styles MUST be inline (except the snippet in Appendix A).**

- Do NOT use `<style>` blocks outside Appendix A
- Do NOT use external stylesheets
- Do NOT use CSS classes or class-based styling

```html
<!-- ✅ Correct: Inline styles -->
<div style="position:absolute; left:60px; top:120px; width:840px; height:240px; background:#023047;"></div>
<p style="position:absolute; left:60px; top:140px; font-size:28px; color:#ffffff;">Title</p>

<!-- ❌ Wrong: Style blocks or classes -->
<style>
  .card { background:#023047; }
</style>
<div class="card"></div>
```

### ⚠️ Background on .slide-content Directly

**Do NOT create a full-size background DIV inside `.slide-content`. Instead, set the background directly on `.slide-content` itself.**

- Background color/image should be applied via inline style on the `.slide-content` element
- Do NOT nest a 960x540 wrapper DIV just for background purposes
- This avoids z-index issues and keeps the DOM clean

### ⚠️ No Bold for Body Text and Captions

**Plain body text and caption/legend text must NOT use bold or `font-weight >= 600`.**

- Body paragraphs, descriptions, and explanatory text should use normal weight (400-500)
- Image captions, chart legends, and footnotes must remain light-weight
- Reserve bold (`font-weight: 600+`) for titles, headings, and key emphasis only

```html
<!-- ✅ Correct: Background directly on .slide-content -->
<div class="slide-content" style="background:#023047;">
  <p style="position:absolute; left:60px; top:140px; ...">Title</p>
</div>

<!-- ❌ Wrong: Nested full-size background DIV -->
<div class="slide-content">
  <div style="position:absolute; left:0; top:0; width:960px; height:540px; background:#023047;"></div>
  <p style="position:absolute; left:60px; top:140px; ...">Title</p>
</div>
```

## Appendix C — Color Palette Rules (REQUIRED)

### ⚠️ Strict Color Palette Adherence

**You MUST strictly use the provided color palette. Do NOT create or modify color values.**

- All colors must come from the user-provided palette (typically obtained via color-scheme-skill)
- Do NOT use any colors outside the palette
- Do NOT modify palette colors (e.g., adjusting brightness, saturation, or mixing colors)
- **Only exception**: You may add opacity to palette colors for background overlays (e.g., `rgba(r,g,b,0.1)`)

```html
<!-- ✅ Correct: Using original palette colors -->
<rect fill="#023047"/>
<text fill="#8ecae6"/>
<path stroke="#ffb703"/>

<!-- ❌ Wrong: Using colors outside the palette -->
<rect fill="#1a1a2e"/>  <!-- Not in palette -->
<text fill="#4ecdc4"/>  <!-- Not in palette -->
```

### ⚠️ No Gradients Allowed

**Gradients are strictly prohibited in PPT HTML. Use solid colors only.**

- No CSS `linear-gradient()`, `radial-gradient()`, `conic-gradient()`
- No SVG `<linearGradient>`, `<radialGradient>`
- All fills, backgrounds, and borders must use solid colors
- For visual hierarchy, use different colors from the palette instead of gradients

```html
<!-- ✅ Correct: Using solid colors -->
<rect fill="#fb8500"/>
<div style="background: #023047;"/>

<!-- ❌ Wrong: Using gradients -->
<defs>
  <linearGradient id="grad">
    <stop offset="0%" stop-color="#fb8500"/>
    <stop offset="100%" stop-color="#ffb703"/>
  </linearGradient>
</defs>
<rect fill="url(#grad)"/>

<!-- ❌ Wrong: CSS gradients -->
<div style="background: linear-gradient(135deg, #023047, #012535);"/>
```

### ⚠️ No Animations Allowed

**Animations and transitions are strictly prohibited in PPT HTML. Use static designs only.**

- No CSS `animation`, `@keyframes`, or `transition` properties
- No JavaScript-based animations (requestAnimationFrame, setInterval, GSAP, anime.js, etc.)
- No hover effects with motion (`:hover` transforms, fades, slides)
- No loading spinners, blinking elements, or auto-playing effects
- No SVG animations (`<animate>`, `<animateTransform>`, `<animateMotion>`)

**Reason**: These slides are meant to be static presentation assets. Animations add unnecessary complexity, increase file size, cause rendering inconsistencies across browsers, and distract from the content.

```html
<!-- ✅ Correct: Static styling -->
<div class="card" style="opacity: 1; transform: translateY(0);">
  Content here
</div>

<!-- ❌ Wrong: CSS animations -->
<style>
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .card { animation: fadeIn 0.5s ease-in; }
</style>

<!-- ❌ Wrong: CSS transitions -->
<style>
  .card { transition: all 0.3s ease; }
  .card:hover { transform: scale(1.05); }
</style>

<!-- ❌ Wrong: SVG animations -->
<svg>
  <circle r="10">
    <animate attributeName="r" from="10" to="20" dur="1s" repeatCount="indefinite"/>
  </circle>
</svg>
```

### Correct Approach for Visual Hierarchy

To create visual depth or hierarchy:
1. Use different colors from the palette (e.g., dark for primary areas, light for secondary)
2. Use solid color + opacity overlay
3. Combine different palette colors strategically

```html
<!-- ✅ Correct: Using different palette colors for hierarchy -->
<rect class="bg-primary" fill="#023047"/>      <!-- Primary background -->
<rect class="bg-secondary" fill="#219ebc"/>    <!-- Secondary area -->
<rect class="accent" fill="#ffb703"/>          <!-- Accent color -->

<!-- ✅ Correct: Solid color + opacity -->
<rect fill="#8ecae6" fill-opacity="0.15"/>
```

---

## Appendix D — SVG Conversion Constraints (CRITICAL)

### ⚠️ PPTX Converter Limitations

**The HTML-to-PPTX converter has STRICT SVG support limitations. Violating these will cause your decorations to be SKIPPED in the final PPTX.**

#### Supported SVG Elements (WHITELIST)
- ✅ `<rect>` — rectangles (with `rx`/`ry` for rounded corners)
- ✅ `<circle>` — circles
- ✅ `<ellipse>` — ellipses
- ✅ `<line>` — straight lines
- ✅ `<polyline>` — connected line segments (stroke only, NO fill)
- ✅ `<polygon>` — closed polyline (stroke only, NO fill)
- ✅ `<path>` — **ONLY with M/L/H/V/Z commands** (see below)
- ✅ `<pattern>` — repeating patterns (dots, stripes, grids)

#### `<path>` Command Restrictions (CRITICAL)
**ONLY these commands are supported:**
- ✅ `M/m` — moveTo
- ✅ `L/l` — lineTo
- ✅ `H/h` — horizontal line
- ✅ `V/v` — vertical line
- ✅ `Z/z` — close path

**FORBIDDEN commands (will cause SVG to be SKIPPED):**
- ❌ `Q/q` — quadratic Bézier curve
- ❌ `C/c` — cubic Bézier curve
- ❌ `S/s` — smooth cubic Bézier
- ❌ `T/t` — smooth quadratic Bézier
- ❌ `A/a` — elliptical arc

#### Additional SVG Constraints
- ❌ **NO rotated shapes** — `transform="rotate()"` on shapes causes fallback failure
- ❌ **NO `<text>` in complex SVGs** — SVG text is NOT converted to editable PPTX text (it becomes rasterized)
- ❌ **Filled `<path>` must be rectangles** — if a path has fill, it must form a closed rectangle with only M/L/H/V/Z
- ⚠️ **`<linearGradient>` / `<radialGradient>` are TECHNICALLY supported but DISCOURAGED** — they work for simple fills but can break unexpectedly

#### ⚠️ CRITICAL: Pie Charts — Image Generation Tool is MANDATORY

**Pie charts MUST be created using the image generation tool. There is NO alternative.**

**Why this is non-negotiable:**
- The HTML-to-PPTX converter CANNOT handle pie chart SVGs — they WILL be stripped from the final PPTX
- SVG pie charts require arc commands (`A`) which are FORBIDDEN and will cause conversion failure
- ALL workarounds (layered circles, stroke-dasharray tricks, clip-paths, conic-gradient, rotated segments) WILL FAIL during PPTX conversion
- Any attempt to "creatively" build pie charts with basic shapes will result in broken or missing charts in the exported PPTX

**The ONLY correct approach:**
1. Use the image generation tool to create the pie chart as a PNG/JPG image
2. Embed the generated image using an `<img>` element
3. Do NOT attempt any SVG-based or CSS-based pie chart solutions — they will break

```html
<!-- ✅ SUPPORTED: Simple shapes -->
<svg width="200" height="4">
  <rect width="200" height="4" rx="2" fill="#dda15e"/>
</svg>

<!-- ✅ SUPPORTED: Straight line with path -->
<svg width="200" height="2">
  <path d="M0 1 L200 1" stroke="#dda15e" stroke-width="2"/>
</svg>

<!-- ✅ SUPPORTED: Multi-segment straight lines -->
<svg width="100" height="100">
  <path d="M10 10 L50 10 L50 50 L10 50 Z" fill="#bc6c25"/>
</svg>

<!-- ❌ FORBIDDEN: Bézier curves (Q/C commands) -->
<svg width="200" height="20">
  <path d="M0 10 Q25 0 50 10 T100 10" stroke="#dda15e" stroke-width="2"/>
  <!-- ^ This will be SKIPPED in PPTX -->
</svg>

<!-- ❌ FORBIDDEN: Arc command (A) -->
<svg width="32" height="32">
  <path d="M16 4a8 8 0 0 1 5 14.3" stroke="#dda15e"/>
  <!-- ^ This will be SKIPPED in PPTX -->
</svg>

<!-- ⚠️ WORKAROUND: Approximate curves with line segments -->
<svg width="200" height="20">
  <path d="M0 10 L12 6 L25 4 L37 6 L50 10" stroke="#dda15e" stroke-width="2"/>
  <!-- ^ This is supported (straight line segments) -->
</svg>
```

---

## Appendix E — Advanced Techniques (REQUIRED)

Use only when helpful; keep output clean.

- **SVG — ONLY for Decorative Shapes (NOT a replacement for real images)**:
  - ⚠️ **CRITICAL WARNING**: SVG is for **decorative elements ONLY**. It does **NOT** satisfy the "real image" requirement.
  - ⚠️ **You MUST still use WebSearch to find and include a real photo/illustration** even if the slide uses SVG for diagrams or charts.
  - **DO NOT** use SVG to "draw" illustrations, backgrounds, or hero visuals. That is WRONG.

- **SVG usage guidelines**:
  - Prefer SVG for **all decorative shapes** (lines/dividers, corner accents, badges, frames, arrows), especially when the slide is **scaled via `transform: scale()`**.
  - Use SVG when you need **pixel-crisp geometry** that won't blur/shift under scaling (CSS borders and 1px lines often anti-alias badly).
  - Use SVG for **masks/overlays** and for **diagram-like UI** (timeline rails, connectors).
  - **Rule of thumb**: if it's a "shape" (not text, not a photo), SVG is usually the cleanest.
  - ⚠️ **ALWAYS check Appendix D constraints before writing SVG paths**

- ⚠️ **CRITICAL: Background Shapes Must Use SVG**:
  - **Do NOT use CSS background/border for decorative background shapes.** The following elements must use SVG `<rect>` or `<path>`:
    - Badge/tag backgrounds (rounded rectangles, pill shapes)
    - Feature tag backgrounds
    - Card borders
    - Button-like backgrounds
  - **Dividers** must use SVG `<rect>` or `<path>`. Do NOT use CSS `background`, `border`, or `<hr>` elements
  - **Reason**: CSS borders/backgrounds blur under `transform: scale()` due to anti-aliasing. SVG stays crisp.

  ```html
  <!-- ✅ Correct: Using SVG for badge with text INSIDE the SVG -->
  <svg class="badge" width="180" height="52" viewBox="0 0 180 52">
    <rect width="180" height="52" rx="26" fill="#fb8500"/>
    <text x="90" y="26" text-anchor="middle" dominant-baseline="central"
          font-size="16" font-weight="700" fill="#ffffff">LABEL</text>
  </svg>

  <!-- ❌ Wrong: Using span overlay on SVG (text will be lost in PPTX conversion) -->
  <div class="badge">
    <svg class="badge-bg" viewBox="0 0 180 52" preserveAspectRatio="none" aria-hidden="true">
      <rect width="180" height="52" rx="26" fill="#fb8500"/>
    </svg>
    <span>LABEL</span>
  </div>

  <!-- ❌ Wrong: Using CSS background -->
  <div class="badge" style="background: #fb8500; border-radius: 26px;">
    <span>LABEL</span>
  </div>

  <!-- ✅ Correct: Using SVG for divider -->
  <svg width="120" height="4" aria-hidden="true">
    <rect width="120" height="4" rx="2" fill="#219ebc"/>
  </svg>

  <!-- ❌ Wrong: Using CSS for divider -->
  <div style="width: 120px; height: 4px; background: #219ebc;"></div>
  ```

### SVG Use Cases

**1. Background Patterns** — Geometric textures for visual depth:
- Dot grid, grid lines, honeycomb hexagons
- Diagonal stripes, waves
- Low-poly, fluid curves

```html
<!-- Dot grid pattern -->
<svg class="bg-pattern" width="100%" height="100%" style="position:absolute;top:0;left:0;opacity:0.08;pointer-events:none;">
  <defs>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="2" fill="currentColor"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dots)"/>
</svg>

<!-- Diagonal stripes -->
<svg class="bg-stripes" width="100%" height="100%" style="position:absolute;top:0;left:0;opacity:0.05;pointer-events:none;">
  <defs>
    <pattern id="stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="10" height="20" fill="currentColor"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#stripes)"/>
</svg>

<!-- Honeycomb hexagons -->
<svg class="bg-hex" width="100%" height="100%" style="position:absolute;top:0;left:0;opacity:0.06;pointer-events:none;">
  <defs>
    <pattern id="hexagons" width="56" height="100" patternUnits="userSpaceOnUse">
      <path d="M28 0 L56 25 L56 75 L28 100 L0 75 L0 25 Z" stroke="currentColor" stroke-width="1" fill="none"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#hexagons)"/>
</svg>
```

**2. Decorative Elements** — Enhance visual design:
- **Dividers**: horizontal lines, segmented lines, dashed lines
- **Corner accents**: L-shaped corners, square brackets, geometric frames
- **Borders/frames**: card borders, rounded rectangles
- **Arrows/connectors**: simple arrows using lines, pointers
- **Badges/tags**: corner ribbons, status badges

```html
<!-- L-shaped corner decoration (for card corners) -->
<svg width="40" height="40" style="position:absolute;top:0;left:0;" aria-hidden="true">
  <path d="M0 35 L0 0 L35 0" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4"/>
</svg>

<!-- Straight divider line -->
<svg width="400" height="2" aria-hidden="true">
  <rect width="400" height="2" fill="currentColor" opacity="0.3"/>
</svg>

<!-- Segmented divider (approximates curves) -->
<svg width="300" height="3" aria-hidden="true">
  <path d="M0 1.5 L100 1.5 M120 1.5 L220 1.5 M240 1.5 L300 1.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
</svg>

<!-- Simple arrow (right-pointing) -->
<svg width="40" height="16" viewBox="0 0 40 16" aria-hidden="true">
  <path d="M0 8 L32 8 M24 2 L32 8 L24 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
```

**3. Icons** — Information and visual guidance:
- **UI icons**: navigation arrows, close buttons, plus/minus signs
- **Status icons**: checkmark ✓, X mark ✕
- **Numbered circles**: circled numbers, step markers
- ⚠️ **Complex icons with curves should be imported as PNG images instead**

```html
<!-- Circled number icon (⚠️ WARNING: <text> will become rasterized) -->
<svg width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" fill="none"/>
  <text x="24" y="24" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="bold" fill="currentColor">1</text>
</svg>

<!-- Solid numbered circle (⚠️ WARNING: <text> will become rasterized) -->
<svg width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="18" fill="currentColor"/>
  <text x="18" y="18" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="bold" fill="white">2</text>
</svg>

<!-- Checkmark icon (using polyline - SUPPORTED) -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>

<!-- Simple arrow icon (using path with L/M commands - SUPPORTED) -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12 L19 12 M12 5 L19 12 L12 19"/>
</svg>

<!-- Plus sign icon (using lines - SUPPORTED) -->
<svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>
```

**4. Data Visualization Helpers** — Simple data displays:
- Progress bars, percentage rings (donut/ring charts)
- Simple bar charts, mini bar graphs, comparison indicators
- Rating stars, trend arrows

```html
<!-- Percentage ring (70%) -->
<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" stroke="#e0e0e0" stroke-width="8" fill="none"/>
  <circle cx="50" cy="50" r="40" stroke="#4CAF50" stroke-width="8" fill="none"
          stroke-dasharray="251.3" stroke-dashoffset="75.4" stroke-linecap="round"
          transform="rotate(-90 50 50)"/>
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="bold" fill="currentColor">70%</text>
</svg>

<!-- Horizontal progress bar -->
<svg width="200" height="12" viewBox="0 0 200 12">
  <rect x="0" y="0" width="200" height="12" rx="6" fill="#e0e0e0"/>
  <rect x="0" y="0" width="140" height="12" rx="6" fill="#2196F3"/>
</svg>

<!-- Mini bar chart -->
<svg width="80" height="40" viewBox="0 0 80 40">
  <rect x="0" y="20" width="12" height="20" fill="currentColor" opacity="0.6"/>
  <rect x="17" y="10" width="12" height="30" fill="currentColor" opacity="0.8"/>
  <rect x="34" y="5" width="12" height="35" fill="currentColor"/>
  <rect x="51" y="15" width="12" height="25" fill="currentColor" opacity="0.7"/>
  <rect x="68" y="8" width="12" height="32" fill="currentColor" opacity="0.9"/>
</svg>
```

**5. Masks & Overlays** — Image processing and visual effects:
- Opacity overlays: solid color overlays for text readability
- Shape clipping: rectangular/circular overlays
- Glow/highlight effects: solid color with opacity

```html
<!-- Bottom overlay (for text readability over background images) -->
<svg width="100%" height="300" style="position:absolute;bottom:0;left:0;pointer-events:none;">
  <rect width="100%" height="100%" fill="#000000" fill-opacity="0.7"/>
</svg>

<!-- Side overlay (left to right) -->
<svg width="400" height="100%" style="position:absolute;left:0;top:0;pointer-events:none;">
  <rect width="100%" height="100%" fill="#000000" fill-opacity="0.8"/>
</svg>

<!-- Center circle highlight (use solid color with opacity) -->
<svg width="100%" height="100%" style="position:absolute;top:0;left:0;pointer-events:none;">
  <circle cx="50%" cy="50%" r="200" fill="#ffffff" fill-opacity="0.1"/>
</svg>
```

### SVG Implementation Tips

- Use `<path>` (or `<rect>`) and add `vector-effect="non-scaling-stroke"` to keep stroke widths stable under `transform: scale()`.
- For thin lines, prefer **filled rectangles** (a thin `<path>`/`<rect>` with `fill`) to avoid stroke anti-alias artifacts.
- Use `overflow="visible"` when the SVG needs to extend beyond its box.
- Use `aria-hidden="true"` for purely decorative SVGs (improves accessibility).
- Use `currentColor` for easy theming — SVG inherits the parent element's CSS `color`.
- Use `pointer-events: none` for overlay SVGs to avoid blocking clicks.

### Minimal Patterns

```html
<!-- Crisp divider line (filled rect - SUPPORTED) -->
<svg overflow="visible" width="320" height="2" aria-hidden="true">
  <rect width="320" height="2" fill="rgba(255,255,255,0.35)"></rect>
</svg>

<!-- Stroke that stays consistent under scaling (SUPPORTED) -->
<svg overflow="visible" width="320" height="2" aria-hidden="true">
  <path vector-effect="non-scaling-stroke" d="M0 1 L320 1" stroke="rgba(255,255,255,0.55)" stroke-width="2"></path>
</svg>

<!-- Solid overlay (gradients NOT recommended for conversion) -->
<svg width="100%" height="200" style="position:absolute;bottom:0;left:0;pointer-events:none;">
  <rect width="100%" height="100%" fill="#000000" fill-opacity="0.6"/>
</svg>
```

- **Clip-path**: crop images to custom shapes (CSS `clip-path: circle()`, `clip-path: polygon()`) for modern layouts.
- **Inline highlights**: subtle emphasis using semi-transparent `<span>` elements.
- **Math**: include KaTeX only if the slide contains formulas (avoid otherwise).

---

## Appendix F — HTML2PPTX Validation Rules (REQUIRED)

The following rules must be followed for proper HTML-to-PPTX conversion.


### Layout and Dimensions

- Slide content must not overflow the body (no horizontal/vertical scroll).
- Text elements larger than 12pt must be at least 0.5" above the bottom edge.
- The HTML body dimensions must match the presentation layout size.

### Backgrounds and Images

- Do NOT use CSS gradients (`linear-gradient`, `radial-gradient`, etc.).
- Do NOT use `background-image` on `div` elements.
- For slide backgrounds, use a real `<img>` element as the background image.
- Solid background colors should be applied to a dedicated shape/div element.

### Text Elements

- `p`, `h1`-`h6`, `ul`, `ol`, `li` must NOT have background, border, or shadow.
- Inline elements (`span`, `b`, `i`, `u`, `strong`, `em`) must NOT have margins.
- Do NOT use manual bullet symbols. Use `<ul>` or `<ol>` lists.
- Do NOT leave raw text directly inside `div` (wrap all text in text tags).

### SVG and Text

- Do NOT place text (`<span>`, `<p>`, etc.) as an overlay on top of SVG elements using absolute positioning. The overlaid text will be **lost** during PPTX conversion.
- When a badge, tag, or label needs text on an SVG background shape, put the text **inside** the SVG using `<text>` element.
- SVG `<text>` must use `text-anchor="middle"` and `dominant-baseline="central"` for proper centering.

```html
<!-- ✅ Correct: Text inside SVG -->
<svg width="100" height="32" viewBox="0 0 100 32">
  <rect width="100" height="32" rx="16" fill="#bc6c25"/>
  <text x="50" y="16" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="700" fill="#fefae0" letter-spacing="3">丰收季</text>
</svg>

<!-- ❌ Wrong: Text overlaid on SVG (WILL BE LOST in PPTX) -->
<div class="badge">
  <svg aria-hidden="true"><rect .../></svg>
  <span style="position:absolute;">丰收季</span>
</div>
```

### Placeholders

- Elements with class `placeholder` must have non-zero width and height.

---

## Appendix G — Page Number Badge / 角标 (REQUIRED)

All slides **except Cover Page** MUST include a page number badge. It shows the current slide number (`slide index`) in the bottom-right corner.

- **Position**: `position:absolute; right:32px; bottom:24px;`
- **Must use SVG** (text inside `<text>`, not overlaid `<span>`) — same rule as Appendix F
- Colors from palette only; keep it subtle; same style across all slides
- Show current number only (e.g. `3` or `03`), **not** "3/12"

```html
<!-- ✅ Circle badge (default) -->
<svg style="position:absolute; right:32px; bottom:24px;" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="18" fill="#219ebc"/>
  <text x="18" y="18" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="600" fill="#ffffff">3</text>
</svg>

<!-- ✅ Pill badge -->
<svg style="position:absolute; right:32px; bottom:24px;" width="48" height="28" viewBox="0 0 48 28">
  <rect width="48" height="28" rx="14" fill="#219ebc"/>
  <text x="24" y="14" text-anchor="middle" dominant-baseline="central"
        font-size="13" font-weight="600" fill="#ffffff">03</text>
</svg>

<!-- ✅ Minimal (number only) -->
<p style="position:absolute; right:36px; bottom:24px; margin:0; font-size:13px; font-weight:500; color:#8ecae6;">03</p>
```
