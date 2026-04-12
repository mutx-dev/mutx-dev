import { resolveRedirectPath } from '@/lib/auth/redirects'

export const oauthProviders = [
  {
    id: 'google',
    label: 'Google',
    buttonLabel: 'Continue with Google',
  },
  {
    id: 'github',
    label: 'GitHub',
    buttonLabel: 'Continue with GitHub',
  },
  {
    id: 'discord',
    label: 'Discord',
    buttonLabel: 'Continue with Discord',
  },
] as const

export type OAuthProviderId = (typeof oauthProviders)[number]['id']
export type OAuthIntent = 'login' | 'register'

export function buildOAuthStartHref(
  provider: OAuthProviderId,
  intent: OAuthIntent,
  nextPath?: string | null,
) {
  const params = new URLSearchParams({
    intent,
    next: resolveRedirectPath(nextPath),
  })

  return `/api/auth/oauth/${provider}/start?${params.toString()}`
}
