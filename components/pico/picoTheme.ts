import { cn } from '@/lib/utils'

export const picoClasses = {
  label: 'font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--pico-text-muted)]',
  body: 'text-sm leading-6 text-[color:var(--pico-text-secondary)]',
  subdued: 'text-sm leading-6 text-[color:var(--pico-text-muted)]',
  title: 'font-[family:var(--font-site-body)] font-semibold tracking-[-0.055em] text-[color:var(--pico-text)]',
  panel: 'border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-panel)]',
  inset: 'border border-[color:var(--pico-border)] bg-transparent',
  soft: 'border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-raised)]',
  ember: 'border border-[color:var(--pico-accent)] bg-[color:var(--pico-bg-raised)] text-[color:var(--pico-text)]',
  primaryButton: 'inline-flex w-full max-w-full items-center justify-center gap-2 border border-[color:var(--pico-accent)] bg-[color:var(--pico-accent)] px-4 py-3 text-center font-[family:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[.08em] text-[color:var(--pico-accent-contrast)] transition sm:w-auto hover:bg-[color:var(--pico-text)]',
  secondaryButton: 'inline-flex w-full max-w-full items-center justify-center gap-2 border border-[color:var(--pico-border)] bg-transparent px-4 py-3 text-center font-[family:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[.08em] text-[color:var(--pico-text)] transition sm:w-auto hover:border-[color:var(--pico-accent)] hover:text-[color:var(--pico-accent)]',
  tertiaryButton: 'inline-flex w-full max-w-full items-center justify-center gap-2 border border-[color:var(--pico-border)] bg-transparent px-3.5 py-2.5 text-center text-sm text-[color:var(--pico-text-secondary)] transition sm:w-auto hover:text-[color:var(--pico-accent)]',
  metric: 'border border-[color:var(--pico-border)] bg-transparent p-4',
  metricValue: 'mt-2 font-[family:var(--font-site-body)] text-3xl font-semibold leading-none tracking-[-0.055em] text-[color:var(--pico-text)]',
  chip: 'inline-flex items-center border border-[color:var(--pico-accent)] bg-transparent px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-accent)]',
  chipNeutral: 'inline-flex items-center border border-[color:var(--pico-border)] bg-transparent px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-text-secondary)]',
  chipSuccess: 'inline-flex items-center border border-[color:var(--pico-accent)] bg-transparent px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-accent)]',
  chipWarning: 'inline-flex items-center border border-[color:var(--pico-yellow)] bg-transparent px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-yellow)]',
  chipDanger: 'inline-flex items-center border border-[color:var(--pico-red)] bg-transparent px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-red)]',
  link: 'text-sm font-medium text-[color:var(--pico-accent)] transition hover:text-[color:var(--pico-text)]',
  plane: 'border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-panel)]',
  note: 'border border-[color:var(--pico-accent)] bg-transparent px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]',
  monoLabel: 'font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--pico-text-muted)]',
  ledger: 'border border-[color:var(--pico-border)] bg-transparent px-4 py-3 text-sm text-[color:var(--pico-text-secondary)]',
} as const

export const picoCodex = {
  frame: 'border border-[color:var(--pico-border)] bg-[color:var(--pico-bg)]',
  spread: 'border border-[color:var(--pico-accent)] bg-[color:var(--pico-bg)]',
  sheet: 'border border-[color:var(--pico-accent)] bg-[color:var(--pico-bg-raised)]',
  inset: 'border border-[color:var(--pico-border)] bg-transparent',
  note: 'border border-[color:var(--pico-accent)] bg-[color:var(--pico-bg-raised)] text-[color:var(--pico-text)]',
  stamp: 'inline-flex items-center border border-[color:var(--pico-accent)] bg-transparent px-2.5 py-1 font-[family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.13em] text-[color:var(--pico-accent)]',
  rule: 'border-t border-[color:var(--pico-border)]',
  ink: 'text-[color:var(--pico-text)]',
  parchment: 'text-[color:var(--pico-text-secondary)]',
  muted: 'text-[color:var(--pico-text-muted)]',
} as const

export function picoPanel(extra?: string) { return cn(picoClasses.panel, extra) }
export function picoInset(extra?: string) { return cn(picoClasses.inset, extra) }
export function picoSoft(extra?: string) { return cn(picoClasses.soft, extra) }
export function picoEmber(extra?: string) { return cn(picoClasses.ember, extra) }
export function picoPlane(extra?: string) { return cn(picoClasses.plane, extra) }
export function picoNote(extra?: string) { return cn(picoClasses.note, extra) }
export function picoCodexFrame(extra?: string) { return cn(picoCodex.frame, extra) }
export function picoCodexSpread(extra?: string) { return cn(picoCodex.spread, extra) }
export function picoCodexSheet(extra?: string) { return cn(picoCodex.sheet, extra) }
export function picoCodexInset(extra?: string) { return cn(picoCodex.inset, extra) }
export function picoCodexNote(extra?: string) { return cn(picoCodex.note, extra) }
