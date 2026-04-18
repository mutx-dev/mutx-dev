import { getPicoDefaultMessages } from '@/lib/pico/defaultMessages'
import { picoEntryHref, picoHref } from '@/lib/pico/navigation'
import en from '@/messages/en.json'

describe('pico landing truth', () => {
  const preregPattern = /pre-register|early access|waitlist|preregistrati|accesso anticipato/i

  it('keeps root landing copy pointed at the live product flow', () => {
    const truthMessages = getPicoDefaultMessages().pico

    expect(truthMessages.nav.cta).not.toMatch(preregPattern)
    expect(truthMessages.hero.cta).not.toMatch(preregPattern)
    expect(truthMessages.earlyAccess.title).not.toMatch(preregPattern)
    expect(truthMessages.finalCta.formSubline).not.toMatch(preregPattern)
    expect(truthMessages.finalCta.ctaButton).toMatch(/onboarding|start/i)
    expect(truthMessages.pricingPage.accessPlans.body).not.toMatch(preregPattern)
    expect(JSON.stringify(en.pico.pricing)).not.toMatch(preregPattern)
  })

  it('keeps onboarding hrefs host-aware for landing CTAs', () => {
    expect(picoHref('/pico', '/onboarding')).toBe('/pico/onboarding')
    expect(picoHref('/', '/onboarding')).toBe('/onboarding')
    expect(picoEntryHref('/pico')).toBe('/pico/onboarding')
    expect(picoEntryHref('/')).toBe('/start')
  })
})
