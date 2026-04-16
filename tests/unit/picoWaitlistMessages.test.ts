import ar from '../../messages/ar.json'
import de from '../../messages/de.json'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import fr from '../../messages/fr.json'
import itMessages from '../../messages/it.json'
import ja from '../../messages/ja.json'
import ko from '../../messages/ko.json'
import pt from '../../messages/pt.json'
import zh from '../../messages/zh.json'

const LOCALE_MESSAGES = {
  en,
  es,
  fr,
  de,
  it: itMessages,
  pt,
  ja,
  ko,
  zh,
  ar,
} as const

const REQUIRED_PATHS = [
  'pico.waitlistLanding.badge',
  'pico.waitlistLanding.title',
  'pico.waitlistLanding.body',
  'pico.waitlistLanding.secondaryCta',
  'pico.waitlistLanding.statusWorkspace',
  'pico.waitlistLanding.statusAcademy',
  'pico.waitlistLanding.statusEntry',
  'waitlistForm.eyebrow',
  'waitlistForm.countFallback',
  'waitlistForm.countRegistered',
  'waitlistForm.title',
  'waitlistForm.body',
] as const

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (typeof value !== 'object' || value === null) {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, source)
}

describe('pico waitlist locale messages', () => {
  it.each(Object.entries(LOCALE_MESSAGES))('%s includes the waitlist landing copy', (_locale, messages) => {
    for (const path of REQUIRED_PATHS) {
      expect(getPathValue(messages, path)).toEqual(expect.any(String))
    }

    expect(getPathValue(messages, 'waitlistForm.countRegistered')).toEqual(
      expect.stringContaining('{count}')
    )
  })
})
