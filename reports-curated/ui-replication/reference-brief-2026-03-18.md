# Reference UI brief — 2026-03-18

Use this as the shared source of truth for the attached reference UI replication.

## Overall product feel
- Dark, premium control-plane aesthetic.
- High-density operator dashboard rather than marketing site styling.
- Surfaces feel deliberate and structured, with crisp alignment, strong hierarchy, and restrained accent color use.
- Nothing should look placeholder-ish or generic admin-template-ish.

## Layout structure
- Full-height app shell.
- Persistent left sidebar / nav rail with brand at top and grouped navigation below.
- Main content area with a strong top header region.
- Content uses a dashboard grid with multiple cards/panels aligned to a consistent spacing system.
- Panels should feel modular and composable, not stretched full-width blobs.

## Component inventory to preserve faithfully
- App shell / sidebar
- Route/page header
- Grouped navigation sections
- KPI / summary cards
- Large feature panels
- Secondary information cards
- Pills / badges / status labels
- Tables or list-like content regions where visible
- Empty/loading states only where needed, but styled consistently with the reference
- Strong card framing, subtle borders, and premium dark surfaces

## Visual language
- Background: near-black / charcoal canvas.
- Cards: slightly elevated dark panels with soft contrast from the page background.
- Borders: thin, low-contrast, cool-toned or neutral, never heavy.
- Radius: medium-large rounded corners; premium SaaS/control-plane feel.
- Shadows/glows: subtle and controlled, not fluffy.
- Text hierarchy:
  - primary headings bright / near-white
  - secondary labels muted gray
  - tertiary helper copy lower contrast
- Accent palette should remain cool and technical: blue / cyan leaning, with possible purple support if already present in the source system.

## Typography
- Clean modern sans system (Inter / Geist / SF-like feel).
- Page heading should feel substantial and crisp.
- Card titles semibold.
- Overlines / eyebrow labels small, tracked slightly wider.
- Avoid oversized marketing typography inside the app shell.

## Spacing system
- Outer page gutters: generous.
- Card padding: consistent and slightly roomy.
- Grid gaps: consistent across rows/columns.
- Tight internal spacing for metadata rows, looser spacing between major content blocks.
- Preserve visual rhythm; do not compress everything just to fit.

## Sidebar/nav behavior
- Group nav into meaningful sections.
- Active item must be visually obvious via background, border, or accent treatment.
- Inactive items stay low-noise but clearly legible.
- Mobile should preserve navigation utility rather than simply hiding structure.

## Interaction / state expectations
- Hover states should be subtle and premium.
- Active/selected states should be stronger than hover.
- Buttons / chips / pills should feel deliberate, not default HTML/button kit.
- Keep interactions truthful; do not invent fake controls or fake data visualizations.

## Responsiveness
- Desktop-first shell with thoughtful collapse behavior.
- Sidebar should degrade cleanly on narrower widths.
- Card grid should collapse without breaking hierarchy.
- Avoid awkward full-width text slabs or orphaned mini-cards.

## Implementation guidance
- Replicate the visible structure and styling of the reference as closely as possible.
- Prefer porting/adapting real shell and component patterns from `~/mutx-worktrees/factory/mutx-control` where they match.
- Keep content truthful to MUTX; if data is unavailable, preserve the visual structure without fabricating product metrics.
- Use one shared source of truth across all lanes; note assumptions explicitly instead of letting implementations drift.

## Known ambiguity policy
When the screenshot leaves behavior ambiguous:
1. match the visible state exactly first
2. infer the simplest production-safe interaction model
3. document the assumption in the verification note
