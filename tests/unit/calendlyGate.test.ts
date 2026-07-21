import { getCalendlyGateAction } from '../../lib/calendly'

describe('getCalendlyGateAction', () => {
  it('waits until the site-key request settles', () => {
    expect(getCalendlyGateAction({ loadingSiteKey: true, siteKey: '', captchaToken: null })).toBe('wait')
  })

  it('opens directly only after an empty site key is confirmed', () => {
    expect(getCalendlyGateAction({ loadingSiteKey: false, siteKey: '', captchaToken: null })).toBe('open')
  })

  it('requires a challenge when Turnstile is configured', () => {
    expect(getCalendlyGateAction({ loadingSiteKey: false, siteKey: 'configured', captchaToken: null })).toBe('challenge')
  })

  it('opens after a configured challenge has a token', () => {
    expect(getCalendlyGateAction({ loadingSiteKey: false, siteKey: 'configured', captchaToken: 'ok' })).toBe('open')
  })
})
