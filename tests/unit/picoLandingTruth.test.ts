import { picoEntryHref, picoHref } from '@/lib/pico/navigation'
import en from '@/messages/en.json'

describe('pico landing copy', () => {
  const preregPattern = /pre-register|preregistr/i

  it('keeps root landing copy waitlist-first without slipping back into prereg wording', () => {
    const picoMessages = en.pico

    expect(picoMessages.nav.cta).toMatch(/request access/i)
    expect(picoMessages.hero.meta).toMatch(/waitlist open/i)
    expect(picoMessages.finalCta.ctaButton).toMatch(/request access/i)
    expect(picoMessages.contactForm.title).toMatch(/request pico access/i)
    expect(JSON.stringify(picoMessages)).not.toMatch(preregPattern)
  })

  it('keeps the commercial ladder aligned with setup and support', () => {
    const picoMessages = en.pico

    expect(picoMessages.platform.title).toMatch(/find the blocker/i)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/90%/i)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/€29/)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/€290/)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/€79/)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/€790/)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/€1,000\+/)
    expect(JSON.stringify(picoMessages.pricing)).toMatch(/€10,000\+/)
  })

  it('keeps onboarding href helpers host-aware for protected Pico routes', () => {
    expect(picoHref('/pico', '/onboarding')).toBe('/pico/onboarding')
    expect(picoHref('/', '/onboarding')).toBe('/onboarding')
    expect(picoEntryHref('/pico')).toBe('/pico/onboarding')
    expect(picoEntryHref('/')).toBe('/start')
  })
})
