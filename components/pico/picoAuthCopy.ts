export type PicoAuthMode = 'login' | 'register'

type PicoAuthCopyEntry = {
  title: string
  subtitle: string
  submit: string
  loading: string
  toggleQ: string
  toggleA: string
  toggleMode: PicoAuthMode
}

export const picoAuthEyebrow = 'PicoMUTX account'

export const picoAuthCopy: Record<PicoAuthMode, PicoAuthCopyEntry> = {
  login: {
    title: 'Sign in to PicoMUTX',
    subtitle: 'Use a provider or email to sign in and continue where you left off.',
    submit: 'Sign in',
    loading: 'Signing in…',
    toggleQ: 'Need an account?',
    toggleA: 'Create one',
    toggleMode: 'register',
  },
  register: {
    title: 'Create your PicoMUTX account',
    subtitle: 'Create an account to save your progress and come back to Pico anytime.',
    submit: 'Create account',
    loading: 'Creating…',
    toggleQ: 'Already have an account?',
    toggleA: 'Sign in',
    toggleMode: 'login',
  },
}
