export const dashboardTokens = {
  bgCanvas: "var(--swarm-color-bg-canvas, var(--background, #000000))",
  bgSurface: "var(--swarm-color-bg-surface, var(--surface, #0a0a0a))",
  bgSurfaceStrong: "var(--swarm-color-bg-surface-strong, var(--surface-strong, #111111))",
  bgSubtle: "var(--swarm-color-bg-subtle, rgba(255, 255, 255, 0.04))",
  textPrimary: "var(--swarm-color-fg-primary, var(--foreground, #ffffff))",
  textMuted: "var(--swarm-color-fg-muted, var(--muted, #888888))",
  textSubtle: "var(--swarm-color-fg-subtle, rgba(255, 255, 255, 0.65))",
  borderSubtle: "var(--swarm-color-border-subtle, var(--line, rgba(255, 255, 255, 0.1)))",
  borderStrong: "var(--swarm-color-border-strong, rgba(255, 255, 255, 0.2))",
  focusRing: "var(--swarm-color-focus-ring, rgba(255, 255, 255, 0.45))",
  brand: "var(--swarm-color-brand, var(--primary, #ffffff))",
  radiusSm: "var(--swarm-radius-sm, 8px)",
  radiusMd: "var(--swarm-radius-md, 10px)",
  radiusLg: "var(--swarm-radius-lg, 14px)",
  radiusXl: "var(--swarm-radius-xl, 18px)",
  fontSans: "var(--swarm-font-family-sans, var(--font-display))",
  fontMono: "var(--swarm-font-family-mono, var(--font-mono))",
  shadowSm: "var(--swarm-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.35))",
  shadowLg: "var(--swarm-shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.45))",
} as const;

export const statusTokens = {
  idle: {
    bg: "var(--swarm-color-status-idle-bg, rgba(148, 163, 184, 0.14))",
    border: "var(--swarm-color-status-idle-border, rgba(148, 163, 184, 0.35))",
    text: "var(--swarm-color-status-idle-text, #cbd5e1)",
    dot: "var(--swarm-color-status-idle-dot, #94a3b8)",
  },
  running: {
    bg: "var(--swarm-color-status-running-bg, rgba(56, 189, 248, 0.14))",
    border: "var(--swarm-color-status-running-border, rgba(56, 189, 248, 0.36))",
    text: "var(--swarm-color-status-running-text, #7dd3fc)",
    dot: "var(--swarm-color-status-running-dot, #38bdf8)",
  },
  success: {
    bg: "var(--swarm-color-status-success-bg, rgba(16, 185, 129, 0.14))",
    border: "var(--swarm-color-status-success-border, rgba(16, 185, 129, 0.35))",
    text: "var(--swarm-color-status-success-text, #6ee7b7)",
    dot: "var(--swarm-color-status-success-dot, #10b981)",
  },
  error: {
    bg: "var(--swarm-color-status-error-bg, rgba(244, 63, 94, 0.14))",
    border: "var(--swarm-color-status-error-border, rgba(244, 63, 94, 0.36))",
    text: "var(--swarm-color-status-error-text, #fda4af)",
    dot: "var(--swarm-color-status-error-dot, #f43f5e)",
  },
  warning: {
    bg: "var(--swarm-color-status-warning-bg, rgba(245, 158, 11, 0.14))",
    border: "var(--swarm-color-status-warning-border, rgba(245, 158, 11, 0.36))",
    text: "var(--swarm-color-status-warning-text, #fcd34d)",
    dot: "var(--swarm-color-status-warning-dot, #f59e0b)",
  },
} as const;
