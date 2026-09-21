import { cn } from '@/lib/utils'

export const picoClasses = {
  label: 'font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.16em] text-(--pico-text-muted)',
  body: 'text-sm leading-6 text-(--pico-text-secondary)',
  subdued: 'text-sm leading-6 text-(--pico-text-muted)',
  title: 'font-(--font-site-body) font-semibold tracking-[-0.055em] text-(--pico-text)',
  panel: 'border border-(--pico-border) bg-(--pico-bg-panel)',
  inset: 'border border-(--pico-border) bg-transparent',
  soft: 'border border-(--pico-border) bg-(--pico-bg-raised)',
  ember: 'border border-(--pico-accent) bg-(--pico-bg-raised) text-(--pico-text)',
  primaryButton: 'inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 border border-(--pico-accent) bg-(--pico-accent) px-4 py-3 text-center font-(--font-mono) text-[11px] font-semibold uppercase tracking-[.08em] text-(--pico-accent-contrast) transition sm:w-auto hover:bg-(--pico-text)',
  secondaryButton: 'inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 border border-(--pico-border) bg-transparent px-4 py-3 text-center font-(--font-mono) text-[11px] font-semibold uppercase tracking-[.08em] text-(--pico-text) transition sm:w-auto hover:border-(--pico-accent) hover:text-(--pico-accent)',
  tertiaryButton: 'inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 border border-(--pico-border) bg-transparent px-3.5 py-2.5 text-center text-sm text-(--pico-text-secondary) transition sm:w-auto hover:text-(--pico-accent)',
  metric: 'border border-(--pico-border) bg-transparent p-4',
  metricValue: 'mt-2 font-(--font-site-body) text-3xl font-semibold leading-none tracking-[-0.055em] text-(--pico-text)',
  chip: 'inline-flex items-center border border-(--pico-accent) bg-transparent px-2.5 py-1 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--pico-accent)',
  chipNeutral: 'inline-flex items-center border border-(--pico-border) bg-transparent px-2.5 py-1 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--pico-text-secondary)',
  chipSuccess: 'inline-flex items-center border border-(--pico-accent) bg-transparent px-2.5 py-1 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--pico-accent)',
  chipWarning: 'inline-flex items-center border border-(--pico-yellow) bg-transparent px-2.5 py-1 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--pico-yellow)',
  chipDanger: 'inline-flex items-center border border-(--pico-red) bg-transparent px-2.5 py-1 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--pico-red)',
  link: 'inline-flex min-h-11 min-w-11 items-center text-sm font-medium text-(--pico-accent) transition hover:text-(--pico-text)',
  plane: 'border border-(--pico-border) bg-(--pico-bg-panel)',
  note: 'border border-(--pico-accent) bg-transparent px-4 py-4 text-sm leading-6 text-(--pico-text-secondary)',
  monoLabel: 'font-(--font-mono) text-[10px] uppercase tracking-[0.2em] text-(--pico-text-muted)',
  ledger: 'border border-(--pico-border) bg-transparent px-4 py-3 text-sm text-(--pico-text-secondary)',
} as const

export const picoCodex = {
  frame: 'border border-(--pico-border) bg-(--pico-bg)',
  spread: 'border border-(--pico-accent) bg-(--pico-bg)',
  sheet: 'border border-(--pico-accent) bg-(--pico-bg-raised)',
  inset: 'border border-(--pico-border) bg-transparent',
  note: 'border border-(--pico-accent) bg-(--pico-bg-raised) text-(--pico-text)',
  stamp: 'inline-flex items-center border border-(--pico-accent) bg-transparent px-2.5 py-1 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.13em] text-(--pico-accent)',
  rule: 'border-t border-(--pico-border)',
  ink: 'text-(--pico-text)',
  parchment: 'text-(--pico-text-secondary)',
  muted: 'text-(--pico-text-muted)',
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
