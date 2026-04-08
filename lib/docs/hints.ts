/**
 * Preprocess GitBook-style hint blocks: {% hint style="info" %}...{% endhint %}
 * Converts to accessible HTML callout divs.
 */

const HINT_STYLES: Record<string, { icon: string; label: string; cssClass: string }> = {
  info: {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    label: "Note",
    cssClass: "docs-callout docs-callout-info",
  },
  warning: {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    label: "Warning",
    cssClass: "docs-callout docs-callout-warning",
  },
  danger: {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    label: "Danger",
    cssClass: "docs-callout docs-callout-danger",
  },
  tip: {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    label: "Tip",
    cssClass: "docs-callout docs-callout-tip",
  },
};

/**
 * Convert GitBook liquid hint syntax to accessible HTML callout divs.
 * Handles: {% hint style="info" %}...{% endhint %}
 */
export function preprocessHints(source: string): string {
  // Match {% hint style="TYPE" %}...{% endhint %}
  const hintRegex = /{%\s*hint\s+style=["']([^"']+)["']\s*%}([\s\S]*?){%\s*endhint\s*%}/g;

  return source.replace(hintRegex, (_match, style: string, content: string) => {
    const styleKey = (style || "info").toLowerCase();
    const config = HINT_STYLES[styleKey] ?? HINT_STYLES.info;

    // Strip trailing whitespace from content but preserve paragraphs
    const trimmedContent = content.trim();

    return `<div class="${config.cssClass}" role="note" aria-label="${config.label}">
<div class="docs-callout-icon">${config.icon}</div>
<div class="docs-callout-body">${trimmedContent}</div>
</div>`;
  });
}
