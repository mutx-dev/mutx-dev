'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'

const LOCALES = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
]

export function PicoLangSwitcher() {
  const router = useRouter()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleSelect = useCallback((code: string) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setOpen(false)
    router.refresh()
  }, [router])

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-[2.45rem] items-center justify-center gap-2 rounded-full border border-[color:var(--pico-border)] bg-[rgba(7,14,9,0.82)] px-3 py-2 text-sm font-semibold text-[color:var(--pico-text)] shadow-[0_12px_30px_rgba(0,0,0,0.24)] backdrop-blur transition duration-200 hover:border-[color:var(--pico-border-hover)] hover:bg-[rgba(var(--pico-accent-rgb),0.08)]"
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="hidden text-[11px] uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)] sm:inline">
          {current.code}
        </span>
        <span className="sr-only">{current.label}</span>
        <span className="text-[0.68rem] text-[color:var(--pico-text-muted)]">▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.45rem)] z-[100] flex max-h-80 min-w-[14rem] flex-col gap-1 overflow-y-auto rounded-[20px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(8,15,10,0.96),rgba(4,9,6,0.98))] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === locale}
              onClick={() => handleSelect(l.code)}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition duration-150 ${
                l.code === locale
                  ? 'border-[color:var(--pico-border-hover)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-[color:var(--pico-text)]'
                  : 'border-transparent bg-transparent text-[color:var(--pico-text-secondary)] hover:border-[color:rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[color:var(--pico-text)]'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{l.label}</span>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[color:var(--pico-text-muted)]">
                  {l.code.toUpperCase()}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
