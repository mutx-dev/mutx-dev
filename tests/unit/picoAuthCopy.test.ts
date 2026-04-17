import { picoAuthCopy, picoAuthEyebrow } from '../../components/pico/picoAuthCopy'

describe('pico auth copy', () => {
  it('uses live account language on the pico auth entry', () => {
    expect(picoAuthEyebrow).toBe('PicoMUTX account')
    expect(picoAuthCopy.login).toEqual({
      title: 'Sign in to PicoMUTX',
      subtitle: 'Use a provider or email to sign in and continue where you left off.',
      submit: 'Sign in',
      loading: 'Signing in…',
      toggleQ: 'Need an account?',
      toggleA: 'Create one',
      toggleMode: 'register',
    })
    expect(picoAuthCopy.register).toEqual({
      title: 'Create your PicoMUTX account',
      subtitle: 'Create an account to save your progress and come back to Pico anytime.',
      submit: 'Create account',
      loading: 'Creating…',
      toggleQ: 'Already have an account?',
      toggleA: 'Sign in',
      toggleMode: 'login',
    })
  })

  it('keeps preview and waitlist language out of pico auth copy', () => {
    const allCopy = [
      picoAuthEyebrow,
      ...Object.values(picoAuthCopy).flatMap((entry) => Object.values(entry)),
    ].join(' ')

    expect(allCopy).not.toMatch(/preview/i)
    expect(allCopy).not.toMatch(/save your place/i)
    expect(allCopy).not.toMatch(/waitlist/i)
  })
})
