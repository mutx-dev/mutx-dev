import { picoEntryHref, picoHref } from '@/lib/pico/navigation'
import en from '@/messages/en.json'

describe('pico landing truth', () => {
  const preregPattern = /pre-register|preregistr/i

  it('keeps root landing copy waitlist-first without slipping back into prereg theater', () => {
    const truthMessages = en.pico

    expect(truthMessages.nav.cta).toMatch(/request access/i)
    expect(truthMessages.hero.meta).toMatch(/waitlist open/i)
    expect(truthMessages.finalCta.ctaButton).toMatch(/request access/i)
    expect(truthMessages.contactForm.title).toMatch(/request pico access/i)
    expect(JSON.stringify(truthMessages)).not.toMatch(preregPattern)
  })

  it('keeps the commercial ladder aligned with build, fix, and control', () => {
    const truthMessages = en.pico

    expect(truthMessages.platform.title).toMatch(/build, fix, or control/i)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/90%/i)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/€29/)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/€290/)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/€79/)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/€790/)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/€1,000\+/)
    expect(JSON.stringify(truthMessages.pricing)).toMatch(/€10,000\+/)
  })

  it('keeps onboarding href helpers host-aware for protected Pico routes', () => {
    expect(picoHref('/pico', '/onboarding')).toBe('/pico/onboarding')
    expect(picoHref('/', '/onboarding')).toBe('/onboarding')
    expect(picoEntryHref('/pico')).toBe('/pico/onboarding')
    expect(picoEntryHref('/')).toBe('/start')
  })
})
