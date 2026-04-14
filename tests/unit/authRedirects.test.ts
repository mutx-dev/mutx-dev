import { getDefaultRedirectPathForHost, resolveRedirectPath } from '../../lib/auth/redirects'

describe('auth redirect helpers', () => {
  it('defaults pico hosts to the pico root', () => {
    expect(getDefaultRedirectPathForHost('pico.mutx.dev')).toBe('/')
    expect(getDefaultRedirectPathForHost('pico.localhost')).toBe('/')
  })

  it('keeps non-pico hosts on the dashboard fallback', () => {
    expect(getDefaultRedirectPathForHost('app.mutx.dev')).toBe('/dashboard')
    expect(getDefaultRedirectPathForHost(undefined)).toBe('/dashboard')
  })

  it('resolves explicit next paths over the host fallback', () => {
    expect(resolveRedirectPath('/onboarding', getDefaultRedirectPathForHost('pico.mutx.dev'))).toBe('/onboarding')
  })

  it('falls back to the host-specific default when next is missing', () => {
    expect(resolveRedirectPath(undefined, getDefaultRedirectPathForHost('pico.mutx.dev'))).toBe('/')
  })
})
