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

  it('keeps the commercial ladder aligned with build, fix, and control', () => {
    const truthMessages = en.pico
    const livePlans = truthMessages.pricingPage.livePlans

    expect(truthMessages.platform.title).toMatch(/build, fix, or control/i)
    expect(livePlans.tiers.free.price).toBe('$0')
    expect(livePlans.tiers.starter.price).toBe('$9')
    expect(livePlans.tiers.pro.price).toBe('$29')
    expect(livePlans.tiers.enterprise.price).toBe('Custom')
    expect(livePlans.tiers.starter.features).toContain('1,000 monthly credits')
    expect(livePlans.tiers.pro.features).toContain('10,000 monthly credits')
  })

  it('keeps onboarding href helpers host-aware for protected Pico routes', () => {
    expect(picoHref('/pico', '/onboarding')).toBe('/pico/onboarding')
    expect(picoHref('/', '/onboarding')).toBe('/onboarding')
    expect(picoEntryHref('/pico')).toBe('/pico/onboarding')
    expect(picoEntryHref('/')).toBe('/start')
  })
})
