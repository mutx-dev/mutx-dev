// ---------------------------------------------------------------------------
// HSL Triplet System (aligned with mission-control design-tokens.ts)
// ---------------------------------------------------------------------------

/** HSL color representation as numeric triplet */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert an HSL triplet to a CSS color string.
 * With alpha: "hsl(187 82% 53% / 0.5)"
 * Without alpha: "hsl(187 82% 53%)"
 */
export function hsl(color: HSL, alpha?: number): string {
  const { h, s, l } = color;
  if (alpha !== undefined) {
    return `hsl(${h} ${s}% ${l}% / ${alpha})`;
  }
  return `hsl(${h} ${s}% ${l}%)`;
}

/**
 * Convert an HSL triplet to raw CSS value (for use in CSS custom properties).
 * Returns "187 82% 53%" without the hsl() wrapper.
 */
export function hslRaw(color: HSL): string {
  const { h, s, l } = color;
  return `${h} ${s}% ${l}%`;
}

/** Core void palette — dark theme foundation */
export const voidPalette = {
  background: { h: 60, s: 5, l: 4 },
  card: { h: 60, s: 6, l: 8 },
  primary: { h: 18, s: 100, l: 50 },
  secondary: { h: 60, s: 5, l: 11 },
  muted: { h: 60, s: 4, l: 14 },
  border: { h: 60, s: 4, l: 14 },
  ring: { h: 18, s: 100, l: 50 },
} satisfies Record<string, HSL>;

/** Accent palette for status, highlights, and semantic colors */
export const voidAccents = {
  cyan: { h: 187, s: 82, l: 53 },    // #22D3EE
  mint: { h: 160, s: 60, l: 52 },    // #34D399
  amber: { h: 38, s: 92, l: 50 },    // #F59E0B
  violet: { h: 263, s: 90, l: 66 },  // #A78BFA
  crimson: { h: 0, s: 72, l: 51 },   // #DC2626
} satisfies Record<string, HSL>;

/** Status color mapping — maps status states to HSL accent values */
export const statusColors = {
  idle: voidAccents.cyan,
  running: { h: 18, s: 100, l: 50 },
  success: voidAccents.mint,
  error: voidAccents.crimson,
  warning: voidAccents.amber,
} satisfies Record<string, HSL>;

/** Surface elevation scale — 4-level depth system */
export const surfaces = {
  0: { h: 60, s: 5, l: 4 },
  1: { h: 60, s: 6, l: 7 },
  2: { h: 60, s: 5, l: 10 },
  3: { h: 60, s: 4, l: 14 },
} as const;

/** Spacing scale (px) */
export const spacing = {
  unit: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

/** Border radius scale (px) */
export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Legacy CSS-var token system (unchanged — backward compatible)
// ---------------------------------------------------------------------------

export const dashboardTokens = {
  bgCanvas: "var(--mutx-dashboard-bg-canvas, #f2efe6)",
  bgCanvasRaised: "var(--mutx-dashboard-bg-canvas-raised, #ebe6da)",
  bgSurface: "var(--mutx-dashboard-bg-surface, #fbfaf6)",
  bgSurfaceStrong: "var(--mutx-dashboard-bg-surface-strong, #ffffff)",
  bgSurfaceHigher: "var(--mutx-dashboard-bg-surface-higher, #f0ece2)",
  bgSubtle: "var(--mutx-dashboard-bg-subtle, rgba(240, 74, 0, 0.08))",
  bgInset: "var(--mutx-dashboard-bg-inset, #ece7dc)",
  panelGradient:
    "var(--mutx-dashboard-panel-gradient, linear-gradient(180deg, #ffffff 0%, #faf8f2 100%))",
  panelGradientStrong:
    "var(--mutx-dashboard-panel-gradient-strong, linear-gradient(180deg, #ffffff 0%, #f7f3ea 100%))",
  shellGradient:
    "var(--mutx-dashboard-shell-gradient, linear-gradient(180deg, #191916 0%, #11110f 100%))",
  textPrimary: "var(--mutx-dashboard-text-primary, #191916)",
  textSecondary: "var(--mutx-dashboard-text-secondary, #4f4b44)",
  textSubtle: "var(--mutx-dashboard-text-subtle, #6e6a62)",
  textMuted: "var(--mutx-dashboard-text-muted, #8b877e)",
  textLabel: "var(--mutx-dashboard-text-label, #a63808)",
  borderSubtle: "var(--mutx-dashboard-border-subtle, #d8d3c7)",
  borderStrong: "var(--mutx-dashboard-border-strong, rgba(240, 74, 0, 0.34))",
  borderInteractive: "var(--mutx-dashboard-border-interactive, rgba(240, 74, 0, 0.58))",
  focusRing: "var(--mutx-dashboard-focus-ring, rgba(240, 74, 0, 0.42))",
  brand: "var(--mutx-dashboard-brand, #f04a00)",
  brandStrong: "var(--mutx-dashboard-brand-strong, #191916)",
  brandSoft: "var(--mutx-dashboard-brand-soft, rgba(240, 74, 0, 0.1))",
  statusActive: "var(--mutx-dashboard-status-active, var(--mutx-dashboard-status-running-dot, #60a5fa))",
  warn: "var(--mutx-dashboard-warn, #f59e0b)",
  warnSoft: "var(--mutx-dashboard-warn-soft, rgba(245, 158, 11, 0.16))",
  danger: "var(--mutx-dashboard-danger, #f87171)",
  radiusSm: "var(--swarm-radius-sm, 10px)",
  radiusMd: "var(--swarm-radius-md, 14px)",
  radiusLg: "var(--swarm-radius-lg, 18px)",
  radiusXl: "var(--swarm-radius-xl, 24px)",
  fontSans: "var(--swarm-font-family-sans, var(--font-site-body, var(--font-display)))",
  fontMono: "var(--swarm-font-family-mono, var(--font-mono))",
  shadowSm: "var(--mutx-dashboard-shadow-sm, 0 1px 2px rgba(25, 25, 22, 0.06))",
  shadowLg: "var(--mutx-dashboard-shadow-lg, 0 18px 48px rgba(25, 25, 22, 0.1))",
} as const;

export const statusTokens = {
  idle: {
    bg: "var(--mutx-dashboard-status-idle-bg, #eeebe2)",
    border: "var(--mutx-dashboard-status-idle-border, #d6d1c5)",
    text: "var(--mutx-dashboard-status-idle-text, #5f5b54)",
    dot: "var(--mutx-dashboard-status-idle-dot, #8b877e)",
  },
  running: {
    bg: "var(--mutx-dashboard-status-running-bg, #fff0e8)",
    border: "var(--mutx-dashboard-status-running-border, #f6b493)",
    text: "var(--mutx-dashboard-status-running-text, #8d2e05)",
    dot: "var(--mutx-dashboard-status-running-dot, #f04a00)",
  },
  success: {
    bg: "var(--mutx-dashboard-status-success-bg, #e8f5ee)",
    border: "var(--mutx-dashboard-status-success-border, #a9d8c0)",
    text: "var(--mutx-dashboard-status-success-text, #146c49)",
    dot: "var(--mutx-dashboard-status-success-dot, #20a36a)",
  },
  error: {
    bg: "var(--mutx-dashboard-status-error-bg, #fff0ee)",
    border: "var(--mutx-dashboard-status-error-border, #efb5ae)",
    text: "var(--mutx-dashboard-status-error-text, #a83226)",
    dot: "var(--mutx-dashboard-status-error-dot, #c8493c)",
  },
  warning: {
    bg: "var(--mutx-dashboard-status-warning-bg, #fff5dc)",
    border: "var(--mutx-dashboard-status-warning-border, #e8cb82)",
    text: "var(--mutx-dashboard-status-warning-text, #805600)",
    dot: "var(--mutx-dashboard-status-warning-dot, #c58a00)",
  },
} as const;
