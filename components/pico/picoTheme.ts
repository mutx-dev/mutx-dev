import { cn } from '@/lib/utils'

export const picoClasses = {
  label: 'text-[11px] font-semibold uppercase tracking-[0.26em] text-[#b9976d]',
  body: 'text-sm leading-6 text-[#d7c9b6]',
  subdued: 'text-sm leading-6 text-[#bca990]',
  title: 'font-[family:var(--font-site-display)] tracking-[-0.05em] text-[#fff4e6]',
  panel:
    'rounded-[30px] border border-[rgba(255,233,204,0.12)] bg-[radial-gradient(circle_at_top_right,rgba(212,171,115,0.1),transparent_24%),linear-gradient(180deg,rgba(24,22,29,0.96),rgba(10,10,13,0.98))] shadow-[0_28px_90px_rgba(2,2,5,0.34)]',
  inset:
    'rounded-[24px] border border-[rgba(255,233,204,0.1)] bg-[rgba(255,248,236,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  soft:
    'rounded-[24px] border border-[rgba(255,233,204,0.08)] bg-[rgba(14,13,18,0.78)] shadow-[0_18px_44px_rgba(2,2,5,0.24)]',
  ember:
    'rounded-[24px] border border-[rgba(212,171,115,0.26)] bg-[linear-gradient(180deg,rgba(212,171,115,0.16),rgba(41,32,25,0.28))] text-[#f4dfc6]',
  primaryButton:
    'inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(212,171,115,0.28)] bg-[linear-gradient(135deg,#f2dfc4_0%,#c89b62_100%)] px-5 py-3 text-sm font-semibold text-[#0f0d11] transition hover:translate-y-[-1px] hover:bg-[linear-gradient(135deg,#f6e5ca_0%,#d2a469_100%)]',
  secondaryButton:
    'inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(255,233,204,0.12)] bg-[rgba(255,248,239,0.04)] px-5 py-3 text-sm font-medium text-[#f4e3cf] transition hover:border-[rgba(212,171,115,0.26)] hover:bg-[rgba(255,248,239,0.08)]',
  tertiaryButton:
    'inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(255,233,204,0.12)] px-4 py-2 text-sm font-medium text-[#d9c1a4] transition hover:border-[rgba(212,171,115,0.26)] hover:text-[#fff4e6]',
  metric:
    'rounded-[24px] border border-[rgba(255,233,204,0.1)] bg-[rgba(255,248,236,0.03)] p-5 shadow-[0_18px_44px_rgba(2,2,5,0.22)]',
  metricValue: 'mt-3 font-[family:var(--font-site-display)] text-4xl leading-none tracking-[-0.06em] text-[#fff5e8]',
  chip:
    'inline-flex items-center rounded-full border border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b387]',
  link: 'text-sm font-medium text-[#f0bb83] transition hover:text-[#ffd8ae]',
  plane:
    'rounded-[32px] border border-[rgba(255,233,204,0.12)] bg-[radial-gradient(circle_at_top_right,rgba(212,171,115,0.08),transparent_24%),linear-gradient(180deg,rgba(24,21,28,0.96),rgba(10,10,13,0.98))] shadow-[0_34px_110px_rgba(2,2,5,0.3)]',
  note:
    'rounded-[22px] border border-[rgba(212,171,115,0.24)] bg-[linear-gradient(180deg,rgba(212,171,115,0.12),rgba(27,21,18,0.14))] px-4 py-4 text-sm leading-6 text-[#ebd7c1]',
  monoLabel:
    'font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.24em] text-[#c89a67]',
  ledger:
    'rounded-[20px] border border-[rgba(255,233,204,0.1)] bg-[rgba(255,248,236,0.025)] px-4 py-3 text-sm text-[#ddc4a8]',
} as const

export const picoCodex = {
  frame:
    'rounded-[36px] border border-[rgba(255,233,204,0.12)] bg-[radial-gradient(circle_at_top_right,rgba(212,171,115,0.14),transparent_24%),linear-gradient(180deg,rgba(26,22,30,0.96),rgba(11,10,14,0.985))] shadow-[0_32px_90px_rgba(2,2,5,0.38)]',
  spread:
    'rounded-[34px] border border-[rgba(212,171,115,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(212,171,115,0.14),transparent_24%),linear-gradient(180deg,rgba(30,24,31,0.97),rgba(12,11,15,0.99))] shadow-[0_30px_100px_rgba(2,2,5,0.32)]',
  sheet:
    'rounded-[30px] border border-[rgba(212,171,115,0.18)] bg-[linear-gradient(180deg,rgba(255,241,223,0.08),rgba(142,121,196,0.05))] shadow-[inset_0_1px_0_rgba(255,247,235,0.08),0_24px_70px_rgba(2,2,5,0.2)]',
  inset:
    'rounded-[24px] border border-[rgba(255,233,204,0.1)] bg-[rgba(255,245,231,0.03)] shadow-[inset_0_1px_0_rgba(255,247,235,0.05)]',
  note:
    'rounded-[22px] border border-[rgba(212,171,115,0.24)] bg-[linear-gradient(180deg,rgba(212,171,115,0.16),rgba(33,25,21,0.18))] text-[#f2e1ce] shadow-[0_20px_60px_rgba(2,2,5,0.16)]',
  stamp:
    'inline-flex items-center rounded-full border border-[rgba(212,171,115,0.24)] bg-[rgba(212,171,115,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f1bf86]',
  rule: 'border-t border-[rgba(255,233,204,0.1)]',
  ink: 'text-[#fff1e1]',
  parchment: 'text-[#dbc6ae]',
  muted: 'text-[#b99879]',
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
