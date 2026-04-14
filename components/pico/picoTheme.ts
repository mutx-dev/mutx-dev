import { cn } from '@/lib/utils'

export const picoClasses = {
  label:
    'text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--pico-text-muted)]',
  body: 'text-sm leading-6 text-[color:var(--pico-text-secondary)]',
  subdued: 'text-sm leading-6 text-[color:var(--pico-text-muted)]',
  title:
    'font-[family:var(--font-site-display)] tracking-[-0.05em] text-[color:var(--pico-text)]',
  panel:
    'rounded-[30px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(9,17,11,0.94),rgba(4,9,6,0.98))] shadow-[var(--pico-shadow-panel)] backdrop-blur-xl',
  inset:
    'rounded-[24px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  soft:
    'rounded-[24px] border border-[color:rgba(255,255,255,0.05)] bg-[rgba(6,11,8,0.74)] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl',
  ember:
    'rounded-[24px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.18),rgba(10,19,11,0.3))] text-[color:var(--pico-text)] shadow-[0_22px_60px_rgba(var(--pico-accent-rgb),0.08)]',
  primaryButton:
    'inline-flex w-full max-w-full items-center justify-center gap-2 rounded-full border border-[color:rgba(var(--pico-accent-rgb),0.28)] bg-[linear-gradient(135deg,var(--pico-accent-bright)_0%,var(--pico-accent)_42%,var(--pico-accent-deep)_100%)] px-5 py-3 text-center text-sm font-semibold text-[color:var(--pico-accent-contrast)] shadow-[0_16px_44px_rgba(var(--pico-accent-rgb),0.22)] transition duration-200 whitespace-normal sm:w-auto sm:whitespace-nowrap hover:translate-y-[-1px] hover:shadow-[0_20px_52px_rgba(var(--pico-accent-rgb),0.28)]',
  secondaryButton:
    'inline-flex w-full max-w-full items-center justify-center gap-2 rounded-full border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.02)] px-5 py-3 text-center text-sm font-medium text-[color:var(--pico-text)] transition duration-200 whitespace-normal sm:w-auto sm:whitespace-nowrap hover:border-[color:var(--pico-border-hover)] hover:bg-[color:var(--pico-bg-surface)]',
  tertiaryButton:
    'inline-flex w-full max-w-full items-center justify-center gap-2 rounded-full border border-[color:rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] px-4 py-2 text-center text-sm font-medium text-[color:var(--pico-text-secondary)] transition duration-200 whitespace-normal sm:w-auto sm:whitespace-nowrap hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[color:var(--pico-text)]',
  metric:
    'rounded-[24px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.016),rgba(255,255,255,0.008))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]',
  metricValue:
    'mt-3 font-[family:var(--font-site-display)] text-4xl leading-none tracking-[-0.06em] text-[color:var(--pico-text)]',
  chip:
    'inline-flex items-center rounded-full border border-[color:rgba(var(--pico-accent-rgb),0.22)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent-bright)]',
  link:
    'text-sm font-medium text-[color:var(--pico-accent-bright)] transition duration-200 hover:text-[color:var(--pico-accent)]',
  plane:
    'rounded-[32px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(8,15,10,0.96),rgba(4,8,5,0.99))] shadow-[var(--pico-shadow-frame)] backdrop-blur-xl',
  note:
    'rounded-[22px] border border-[color:rgba(var(--pico-accent-rgb),0.24)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.12),rgba(7,14,8,0.18))] px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]',
  monoLabel:
    'font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]',
  ledger:
    'rounded-[20px] border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.018)] px-4 py-3 text-sm text-[color:var(--pico-text-secondary)]',
} as const

export const picoCodex = {
  frame:
    'rounded-[36px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(9,18,11,0.96),rgba(5,10,7,0.985))] shadow-[var(--pico-shadow-frame)] backdrop-blur-xl',
  spread:
    'rounded-[34px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(10,19,12,0.97),rgba(4,8,5,0.99))] shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-xl',
  sheet:
    'rounded-[30px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.08),rgba(115,239,190,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)]',
  inset:
    'rounded-[24px] border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.018)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  note:
    'rounded-[22px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.16),rgba(8,15,9,0.22))] text-[color:var(--pico-text)] shadow-[0_20px_60px_rgba(var(--pico-accent-rgb),0.08)]',
  stamp:
    'inline-flex items-center rounded-full border border-[color:rgba(var(--pico-accent-rgb),0.24)] bg-[rgba(var(--pico-accent-rgb),0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--pico-accent-bright)]',
  rule: 'border-t border-[color:var(--pico-border)]',
  ink: 'text-[color:var(--pico-text)]',
  parchment: 'text-[color:var(--pico-text-secondary)]',
  muted: 'text-[color:var(--pico-text-muted)]',
} as const

export function picoPanel(extra?: string) {
  return cn(picoClasses.panel, extra)
}

export function picoInset(extra?: string) {
  return cn(picoClasses.inset, extra)
}

export function picoSoft(extra?: string) {
  return cn(picoClasses.soft, extra)
}

export function picoEmber(extra?: string) {
  return cn(picoClasses.ember, extra)
}

export function picoPlane(extra?: string) {
  return cn(picoClasses.plane, extra)
}

export function picoNote(extra?: string) {
  return cn(picoClasses.note, extra)
}

export function picoCodexFrame(extra?: string) {
  return cn(picoCodex.frame, extra)
}

export function picoCodexSpread(extra?: string) {
  return cn(picoCodex.spread, extra)
}

export function picoCodexSheet(extra?: string) {
  return cn(picoCodex.sheet, extra)
}

export function picoCodexInset(extra?: string) {
  return cn(picoCodex.inset, extra)
}

export function picoCodexNote(extra?: string) {
  return cn(picoCodex.note, extra)
}
