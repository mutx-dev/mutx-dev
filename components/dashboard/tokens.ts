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

/** Core flight-recorder palette — carbon surfaces with a warm signal accent. */
export const voidPalette = {
  background: { h: 80, s: 5, l: 4 },
  card: { h: 75, s: 6, l: 7 },
  primary: { h: 16, s: 100, l: 55 },
  secondary: { h: 72, s: 6, l: 10 },
  muted: { h: 65, s: 6, l: 15 },
  border: { h: 58, s: 7, l: 17 },
  ring: { h: 16, s: 100, l: 64 },
} satisfies Record<string, HSL>;

/** Accent palette for status, highlights, and semantic colors */
export const voidAccents = {
  cyan: { h: 210, s: 100, l: 66 },
  mint: { h: 156, s: 63, l: 56 },
  amber: { h: 39, s: 84, l: 62 },
  violet: { h: 263, s: 72, l: 70 },
  crimson: { h: 3, s: 100, l: 70 },
} satisfies Record<string, HSL>;

/** Status color mapping — maps status states to HSL accent values */
export const statusColors = {
  idle: { h: 60, s: 4, l: 46 },
  running: voidAccents.cyan,
  success: voidAccents.mint,
  error: voidAccents.crimson,
  warning: voidAccents.amber,
} satisfies Record<string, HSL>;

/** Surface elevation scale — 4-level depth system */
export const surfaces = {
  0: { h: 80, s: 5, l: 4 },
  1: { h: 75, s: 6, l: 7 },
  2: { h: 72, s: 6, l: 10 },
  3: { h: 65, s: 6, l: 14 },
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
  xs: 3,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 8,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// CSS-var token system. Names remain stable for existing dashboard surfaces.
// ---------------------------------------------------------------------------

export const dashboardTokens = {
  bgCanvas: "var(--mutx-dashboard-bg-canvas, #090a08)",
  bgCanvasRaised: "var(--mutx-dashboard-bg-canvas-raised, #0d0e0c)",
  bgSurface: "var(--mutx-dashboard-bg-surface, #11120f)",
  bgSurfaceStrong: "var(--mutx-dashboard-bg-surface-strong, #151612)",
  bgSurfaceHigher: "var(--mutx-dashboard-bg-surface-higher, #1a1b17)",
  bgSubtle: "var(--mutx-dashboard-bg-subtle, rgba(255, 87, 28, 0.09))",
  bgInset: "var(--mutx-dashboard-bg-inset, #0c0d0b)",
  panelGradient: "var(--mutx-dashboard-panel-gradient, #11120f)",
  panelGradientStrong: "var(--mutx-dashboard-panel-gradient-strong, #151612)",
  shellGradient: "var(--mutx-dashboard-shell-gradient, #080907)",
  textPrimary: "var(--mutx-dashboard-text-primary, #eee9dc)",
  textSecondary: "var(--mutx-dashboard-text-secondary, #c8c0b0)",
  textSubtle: "var(--mutx-dashboard-text-subtle, #999284)",
  textMuted: "var(--mutx-dashboard-text-muted, #8d867a)",
  textLabel: "var(--mutx-dashboard-text-label, #ff8355)",
  borderSubtle: "var(--mutx-dashboard-border-subtle, #2b2b26)",
  borderStrong: "var(--mutx-dashboard-border-strong, #48463e)",
  borderInteractive: "var(--mutx-dashboard-border-interactive, rgba(255, 87, 28, 0.72))",
  focusRing: "var(--mutx-dashboard-focus-ring, rgba(255, 123, 76, 0.72))",
  brand: "var(--mutx-dashboard-brand, #ff571c)",
  brandStrong: "var(--mutx-dashboard-brand-strong, #ff8355)",
  brandSoft: "var(--mutx-dashboard-brand-soft, rgba(255, 87, 28, 0.11))",
  trace: "var(--mutx-dashboard-trace, #58aaff)",
  traceSoft: "var(--mutx-dashboard-trace-soft, rgba(88, 170, 255, 0.11))",
  success: "var(--mutx-dashboard-success, #4bd69b)",
  successSoft: "var(--mutx-dashboard-success-soft, rgba(75, 214, 155, 0.11))",
  statusActive: "var(--mutx-dashboard-status-active, #4bd69b)",
  warn: "var(--mutx-dashboard-warn, #efb654)",
  warnSoft: "var(--mutx-dashboard-warn-soft, rgba(239, 182, 84, 0.12))",
  danger: "var(--mutx-dashboard-danger, #ff6d66)",
  dangerSoft: "var(--mutx-dashboard-danger-soft, rgba(255, 109, 102, 0.11))",
  radiusSm: "var(--swarm-radius-sm, 4px)",
  radiusMd: "var(--swarm-radius-md, 6px)",
  radiusLg: "var(--swarm-radius-lg, 8px)",
  radiusXl: "var(--swarm-radius-xl, 8px)",
  fontSans: "var(--swarm-font-family-sans, var(--font-site-body, var(--font-display)))",
  fontMono: "var(--swarm-font-family-mono, var(--font-mono))",
  shadowSm: "var(--mutx-dashboard-shadow-sm, 0 1px 0 rgba(255, 255, 255, 0.025))",
  shadowLg: "var(--mutx-dashboard-shadow-lg, 0 24px 64px rgba(0, 0, 0, 0.48))",
} as const;

export const statusTokens = {
  idle: {
    bg: "var(--mutx-dashboard-status-idle-bg, #171813)",
    border: "var(--mutx-dashboard-status-idle-border, #34342e)",
    text: "var(--mutx-dashboard-status-idle-text, #aaa397)",
    dot: "var(--mutx-dashboard-status-idle-dot, #77766d)",
  },
  running: {
    bg: "var(--mutx-dashboard-status-running-bg, #101c26)",
    border: "var(--mutx-dashboard-status-running-border, #294d6c)",
    text: "var(--mutx-dashboard-status-running-text, #8ac7ff)",
    dot: "var(--mutx-dashboard-status-running-dot, #58aaff)",
  },
  success: {
    bg: "var(--mutx-dashboard-status-success-bg, #0f2018)",
    border: "var(--mutx-dashboard-status-success-border, #285a43)",
    text: "var(--mutx-dashboard-status-success-text, #78e3b4)",
    dot: "var(--mutx-dashboard-status-success-dot, #4bd69b)",
  },
  error: {
    bg: "var(--mutx-dashboard-status-error-bg, #241312)",
    border: "var(--mutx-dashboard-status-error-border, #66302e)",
    text: "var(--mutx-dashboard-status-error-text, #ff9b96)",
    dot: "var(--mutx-dashboard-status-error-dot, #ff6d66)",
  },
  warning: {
    bg: "var(--mutx-dashboard-status-warning-bg, #211a0e)",
    border: "var(--mutx-dashboard-status-warning-border, #65502b)",
    text: "var(--mutx-dashboard-status-warning-text, #f4cc82)",
    dot: "var(--mutx-dashboard-status-warning-dot, #efb654)",
  },
} as const;
