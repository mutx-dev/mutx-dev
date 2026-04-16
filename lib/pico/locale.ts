export const PICO_LOCALES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar'] as const

export type PicoLocale = (typeof PICO_LOCALES)[number]

export const PICO_DEFAULT_LOCALE: PicoLocale = 'en'
export const PICO_LOCALE_COOKIE = 'NEXT_LOCALE'
export const PICO_AUTH_LOCALE_COOKIE = 'mutx_user_locale'
export const PICO_LOCALE_QUERY_PARAM = 'locale'

const RTL_LOCALES = new Set<PicoLocale>(['ar'])
const PICO_LOCALE_SET = new Set<string>(PICO_LOCALES)

export const PICO_LANGUAGE_OPTIONS: ReadonlyArray<{
  code: PicoLocale
  flag: string
  label: string
}> = [
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

export function isPicoLocale(value: string | null | undefined): value is PicoLocale {
  if (!value) {
    return false
  }

  return PICO_LOCALE_SET.has(value.toLowerCase())
}

export function normalizePicoLocale(value: string | null | undefined): PicoLocale | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (isPicoLocale(normalized)) {
    return normalized
  }

  const base = normalized.split('-')[0]
  return isPicoLocale(base) ? base : null
}

export function resolvePicoLocale(...candidates: Array<string | null | undefined>): PicoLocale {
  for (const candidate of candidates) {
    const locale = normalizePicoLocale(candidate)
    if (locale) {
      return locale
    }
  }

  return PICO_DEFAULT_LOCALE
}

export function getPicoDirection(locale: string) {
  return RTL_LOCALES.has(resolvePicoLocale(locale)) ? 'rtl' : 'ltr'
}

export function formatPicoDateTime(
  value: string | number | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(resolvePicoLocale(locale), options).format(parsed)
}

export function formatPicoRelativeTime(
  value: string | number | Date,
  locale: string,
  now = new Date(),
) {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const diffMs = parsed.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  const formatter = new Intl.RelativeTimeFormat(resolvePicoLocale(locale), {
    numeric: 'auto',
  })

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 48) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}

export function formatPicoNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(resolvePicoLocale(locale), options).format(value)
}
