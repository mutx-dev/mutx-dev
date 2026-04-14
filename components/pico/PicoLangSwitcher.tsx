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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          minHeight: '2.5rem',
          padding: '0 0.95rem',
          borderRadius: '999px',
          background: 'var(--pico-bg-surface)',
          border: '1px solid var(--pico-border)',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 600,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          color: 'var(--pico-text)',
          boxSizing: 'border-box',
          transition: 'transform 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
          boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
        }}
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="sr-only">{current.label}</span>
        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'rgba(9, 16, 8, 0.98)',
            border: '1px solid var(--pico-border)',
            borderRadius: '10px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '120px',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === locale}
              onClick={() => handleSelect(l.code)}
              style={{
                background: l.code === locale ? 'rgba(var(--pico-accent-rgb),0.14)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '7px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: l.code === locale ? 'var(--pico-accent)' : 'var(--pico-text-secondary)',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (l.code !== locale) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--pico-accent-rgb),0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (l.code !== locale) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }
              }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
