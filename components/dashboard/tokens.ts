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
  background: { h: 215, s: 27, l: 4 },  // #07090C
  card: { h: 220, s: 30, l: 8 },         // #0F141C
  primary: { h: 217, s: 91, l: 60 },     // #3b82f6 (MUTX brand blue)
  secondary: { h: 220, s: 25, l: 11 },
  muted: { h: 220, s: 20, l: 14 },
  border: { h: 220, s: 20, l: 14 },
  ring: { h: 217, s: 91, l: 60 },        // #3b82f6 (brand blue)
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
  running: { h: 217, s: 91, l: 60 },    // brand blue
  success: voidAccents.mint,
  error: voidAccents.crimson,
  warning: voidAccents.amber,
} satisfies Record<string, HSL>;

/** Surface elevation scale — 4-level depth system */
export const surfaces = {
  0: { h: 215, s: 27, l: 4 },   // Deepest void
  1: { h: 222, s: 35, l: 7 },   // Dark navy
  2: { h: 220, s: 30, l: 10 },  // Mid surface
  3: { h: 220, s: 25, l: 14 },  // Raised surface
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
  bgCanvas: "var(--mutx-dashboard-bg-canvas, #070b13)",
  bgCanvasRaised: "var(--mutx-dashboard-bg-canvas-raised, #0d1220)",
  bgSurface: "var(--mutx-dashboard-bg-surface, #111827)",
  bgSurfaceStrong: "var(--mutx-dashboard-bg-surface-strong, #162033)",
  bgSurfaceHigher: "var(--mutx-dashboard-bg-surface-higher, #1d2a40)",
  bgSubtle: "var(--mutx-dashboard-bg-subtle, rgba(59, 130, 246, 0.12))",
  bgInset: "var(--mutx-dashboard-bg-inset, #0a0f18)",
  panelGradient:
    "var(--mutx-dashboard-panel-gradient, linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(8,12,20,0.98) 100%))",
  panelGradientStrong:
    "var(--mutx-dashboard-panel-gradient-strong, radial-gradient(circle at top right, rgba(96,165,250,0.14), transparent 28%), linear-gradient(180deg, rgba(20,29,45,0.98) 0%, rgba(8,12,20,0.98) 100%))",
  shellGradient:
    "var(--mutx-dashboard-shell-gradient, linear-gradient(180deg, rgba(13,19,31,0.98) 0%, rgba(7,10,16,0.98) 100%))",
  textPrimary: "var(--mutx-dashboard-text-primary, #f4f8ff)",
  textSecondary: "var(--mutx-dashboard-text-secondary, rgba(223, 233, 250, 0.88))",
  textSubtle: "var(--mutx-dashboard-text-subtle, rgba(176, 196, 227, 0.8))",
  textMuted: "var(--mutx-dashboard-text-muted, rgba(132, 156, 192, 0.84))",
  textLabel: "var(--mutx-dashboard-text-label, #93c5fd)",
  borderSubtle: "var(--mutx-dashboard-border-subtle, rgba(191, 219, 254, 0.12))",
  borderStrong: "var(--mutx-dashboard-border-strong, rgba(96, 165, 250, 0.28))",
  borderInteractive: "var(--mutx-dashboard-border-interactive, rgba(96, 165, 250, 0.46))",
  focusRing: "var(--mutx-dashboard-focus-ring, rgba(96, 165, 250, 0.48))",
  brand: "var(--mutx-dashboard-brand, #3b82f6)",
  brandStrong: "var(--mutx-dashboard-brand-strong, #dbeafe)",
  brandSoft: "var(--mutx-dashboard-brand-soft, rgba(59, 130, 246, 0.16))",
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
  shadowSm: "var(--mutx-dashboard-shadow-sm, 0 18px 38px rgba(2, 2, 5, 0.32))",
  shadowLg: "var(--mutx-dashboard-shadow-lg, 0 38px 120px rgba(2, 2, 5, 0.56))",
} as const;

export const statusTokens = {
  idle: {
    bg: "var(--mutx-dashboard-status-idle-bg, rgba(148, 163, 184, 0.14))",
    border: "var(--mutx-dashboard-status-idle-border, rgba(148, 163, 184, 0.26))",
    text: "var(--mutx-dashboard-status-idle-text, #d9e2f0)",
    dot: "var(--mutx-dashboard-status-idle-dot, #94a3b8)",
  },
  running: {
    bg: "var(--mutx-dashboard-status-running-bg, rgba(59, 130, 246, 0.16))",
    border: "var(--mutx-dashboard-status-running-border, rgba(59, 130, 246, 0.32))",
    text: "var(--mutx-dashboard-status-running-text, #dbeafe)",
    dot: "var(--mutx-dashboard-status-running-dot, #60a5fa)",
  },
  success: {
    bg: "var(--mutx-dashboard-status-success-bg, rgba(14, 165, 233, 0.16))",
    border: "var(--mutx-dashboard-status-success-border, rgba(14, 165, 233, 0.3))",
    text: "var(--mutx-dashboard-status-success-text, #d9f5ff)",
    dot: "var(--mutx-dashboard-status-success-dot, #38bdf8)",
  },
  error: {
    bg: "var(--mutx-dashboard-status-error-bg, rgba(248, 113, 113, 0.16))",
    border: "var(--mutx-dashboard-status-error-border, rgba(248, 113, 113, 0.3))",
    text: "var(--mutx-dashboard-status-error-text, #ffd7d7)",
    dot: "var(--mutx-dashboard-status-error-dot, #f87171)",
  },
  warning: {
    bg: "var(--mutx-dashboard-status-warning-bg, rgba(245, 158, 11, 0.16))",
    border: "var(--mutx-dashboard-status-warning-border, rgba(245, 158, 11, 0.3))",
    text: "var(--mutx-dashboard-status-warning-text, #ffe6b6)",
    dot: "var(--mutx-dashboard-status-warning-dot, #f59e0b)",
  },
} as const;
