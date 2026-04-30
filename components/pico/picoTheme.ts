import { cn } from '@/lib/utils'

export const picoClasses = {
  label:
    'text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--pico-text-muted)]',
  body: 'text-sm leading-6 text-[color:var(--pico-text-secondary)]',
  subdued: 'text-sm leading-6 text-[color:var(--pico-text-muted)]',
  title:
    'font-[family:var(--font-site-display)] tracking-[-0.035em] text-[color:var(--pico-text)]',
  panel:
    'rounded-[18px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(8,13,10,0.94),rgba(3,7,5,0.98))] shadow-[var(--pico-shadow-panel)] backdrop-blur-xl',
  inset:
    'rounded-[14px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
  soft:
    'rounded-[14px] border border-[color:rgba(255,255,255,0.055)] bg-[rgba(7,12,10,0.72)] shadow-[0_14px_34px_rgba(0,0,0,0.2)] backdrop-blur-xl',
  ember:
    'rounded-[16px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.12),rgba(9,15,11,0.28))] text-[color:var(--pico-text)] shadow-[0_16px_44px_rgba(var(--pico-accent-rgb),0.07)]',
  primaryButton:
    'inline-flex w-full max-w-full items-center justify-center gap-2 rounded-[12px] border border-[color:rgba(var(--pico-accent-rgb),0.28)] bg-[linear-gradient(135deg,var(--pico-accent-bright)_0%,var(--pico-accent)_48%,var(--pico-accent-deep)_100%)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--pico-accent-contrast)] shadow-[0_12px_30px_rgba(var(--pico-accent-rgb),0.18)] transition duration-200 whitespace-normal sm:w-auto sm:whitespace-nowrap hover:translate-y-[-1px] hover:shadow-[0_16px_38px_rgba(var(--pico-accent-rgb),0.24)]',
  secondaryButton:
    'inline-flex w-full max-w-full items-center justify-center gap-2 rounded-[12px] border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.025)] px-4 py-2.5 text-center text-sm font-medium text-[color:var(--pico-text)] transition duration-200 whitespace-normal sm:w-auto sm:whitespace-nowrap hover:border-[color:var(--pico-border-hover)] hover:bg-[color:var(--pico-bg-surface)]',
  tertiaryButton:
    'inline-flex w-full max-w-full items-center justify-center gap-2 rounded-[11px] border border-[color:rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.012)] px-3.5 py-2 text-center text-sm font-medium text-[color:var(--pico-text-secondary)] transition duration-200 whitespace-normal sm:w-auto sm:whitespace-nowrap hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[color:var(--pico-text)]',
  metric:
    'rounded-[14px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.016),rgba(255,255,255,0.008))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]',
  metricValue:
    'mt-2 font-[family:var(--font-site-display)] text-3xl leading-none tracking-[-0.045em] text-[color:var(--pico-text)]',
  chip:
    'inline-flex items-center rounded-[9px] border border-[color:rgba(var(--pico-accent-rgb),0.2)] bg-[rgba(var(--pico-accent-rgb),0.075)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--pico-accent-bright)]',
  link:
    'text-sm font-medium text-[color:var(--pico-accent-bright)] transition duration-200 hover:text-[color:var(--pico-accent)]',
  plane:
    'rounded-[20px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(8,13,10,0.96),rgba(4,8,6,0.99))] shadow-[var(--pico-shadow-frame)] backdrop-blur-xl',
  note:
    'rounded-[14px] border border-[color:rgba(var(--pico-accent-rgb),0.2)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.09),rgba(7,12,9,0.16))] px-4 py-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]',
  monoLabel:
    'font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]',
  ledger:
    'rounded-[12px] border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.018)] px-4 py-3 text-sm text-[color:var(--pico-text-secondary)]',
} as const

export const picoCodex = {
  frame:
    'rounded-[20px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(8,13,10,0.96),rgba(4,8,6,0.985))] shadow-[var(--pico-shadow-frame)] backdrop-blur-xl',
  spread:
    'rounded-[20px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(9,15,12,0.97),rgba(4,8,6,0.99))] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl',
  sheet:
    'rounded-[16px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.07),rgba(115,239,190,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_52px_rgba(0,0,0,0.18)]',
  inset:
    'rounded-[14px] border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.018)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  note:
    'rounded-[14px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.11),rgba(8,13,10,0.18))] text-[color:var(--pico-text)] shadow-[0_16px_48px_rgba(var(--pico-accent-rgb),0.07)]',
  stamp:
    'inline-flex items-center rounded-[9px] border border-[color:rgba(var(--pico-accent-rgb),0.22)] bg-[rgba(var(--pico-accent-rgb),0.075)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-[color:var(--pico-accent-bright)]',
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
