import { buildPicoContactPayload } from '../../components/pico/picoContactPayload'

describe('pico contact payload', () => {
  it('maps the selected interest into the backend tier field', () => {
    const payload = buildPicoContactPayload({
      email: 'operator@mutx.dev',
      name: 'Operator',
      company: 'MUTX',
      message: 'Need early access.',
      interest: 'building-first',
      locale: 'en',
      source: 'pico-landing',
      honeypot: '',
    })

    expect(payload).toEqual({
      email: 'operator@mutx.dev',
      name: 'Operator',
      company: 'MUTX',
      message: 'Need early access.',
      tier: 'building-first',
      locale: 'en',
      source: 'pico-landing',
      honeypot: '',
    })
  })
})
