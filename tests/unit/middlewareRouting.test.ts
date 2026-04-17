import type { NextRequest } from 'next/server'

import { proxy } from '../../proxy'

const authCookies = { access_token: 'token-123' }

function mockRequest(
  url: string,
  headers: Record<string, string> = {},
  method = 'GET',
  cookies: Record<string, string> = {},
) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    url,
    method,
    nextUrl: new URL(url),
    headers: {
      get(name: string) {
        return normalizedHeaders[name.toLowerCase()] ?? null
      },
    },
    cookies: {
      get(name: string) {
        const value = cookies[name]
        return value ? { value } : undefined
      },
    },
  } as unknown as NextRequest
}

describe('host-aware UI routing proxy', () => {
  it('redirects marketing-host legacy /app traffic to canonical dashboard paths on app.mutx.dev', () => {
    const response = proxy(
      mockRequest('https://mutx.dev/app/agents?tab=live', { host: 'mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/dashboard/agents?tab=live')
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, max-age=0, must-revalidate',
    )
  })

  it('redirects marketing-host auth pages to the app host', () => {
    const response = proxy(
      mockRequest('https://mutx.dev/login?next=%2Fdashboard', { host: 'mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/login?next=%2Fdashboard')
  })

  it('rewrites app host root into the canonical dashboard shell without caching the HTML', () => {
    const response = proxy(
      mockRequest('https://app.mutx.dev/', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://app.mutx.dev/dashboard')
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, max-age=0, must-revalidate',
    )
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('keeps /control paths on the app host so the public control demo stays indexable', () => {
    const response = proxy(
      mockRequest('https://app.mutx.dev/control/agents', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('redirects app host legacy /app pages to canonical dashboard routes', () => {
    const response = proxy(
      mockRequest('https://app.mutx.dev/app/health', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/dashboard/monitoring')
  })

  it('maps stale legacy workflow routes onto canonical dashboard destinations', () => {
    const activityResponse = proxy(
      mockRequest('https://app.mutx.dev/app/activity', { host: 'app.mutx.dev' }),
    )

    expect(activityResponse.status).toBe(307)
    expect(activityResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/observability')

    const apiKeysResponse = proxy(
      mockRequest('https://app.mutx.dev/app/api-keys', { host: 'app.mutx.dev' }),
    )

    expect(apiKeysResponse.status).toBe(307)
    expect(apiKeysResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/api-keys')

    const observabilityResponse = proxy(
      mockRequest('https://app.mutx.dev/app/observability', { host: 'app.mutx.dev' }),
    )

    expect(observabilityResponse.status).toBe(307)
    expect(observabilityResponse.headers.get('location')).toBe(
      'https://app.mutx.dev/dashboard/observability',
    )

    const cronResponse = proxy(
      mockRequest('https://app.mutx.dev/app/cron', { host: 'app.mutx.dev' }),
    )

    expect(cronResponse.status).toBe(307)
    expect(cronResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/orchestration')

    const settingsResponse = proxy(
      mockRequest('https://app.mutx.dev/app/settings', { host: 'app.mutx.dev' }),
    )

    expect(settingsResponse.status).toBe(307)
    expect(settingsResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/control')
  })

  it('allows canonical app-host dashboard routes to pass through unchanged', () => {
    const response = proxy(
      mockRequest('https://app.mutx.dev/dashboard/agents', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, max-age=0, must-revalidate',
    )
  })

  it('passes through unrelated marketing routes without injecting auth-form rate-limit headers', () => {
    const response = proxy(
      mockRequest('https://mutx.dev/contact', { host: 'mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBeNull()
    expect(response.headers.get('X-RateLimit-Remaining')).toBeNull()
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, max-age=0, must-revalidate',
    )
  })

  it('serves the pico landing page to anonymous visitors without redirecting to login', () => {
    const response = proxy(
      mockRequest('https://pico.mutx.dev/', { host: 'pico.mutx.dev', 'CF-IPCountry': 'JP' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://pico.mutx.dev/pico')
    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=ja')
  })

  it('rewrites pico /start into the public route guard', () => {
    const response = proxy(
      mockRequest('https://pico.mutx.dev/start?ref=hero', { host: 'pico.mutx.dev', 'CF-IPCountry': 'JP' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://pico.mutx.dev/pico/wip?ref=hero',
    )
    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=ja')
  })

  it('maps pico geolocation headers to supported locales on first authenticated visit', () => {
    const jpResponse = proxy(
      mockRequest(
        'https://pico.mutx.dev/',
        { host: 'pico.mutx.dev', 'CF-IPCountry': 'JP' },
        'GET',
        authCookies,
      ),
    )
    const krResponse = proxy(
      mockRequest(
        'https://pico.mutx.dev/',
        { host: 'pico.mutx.dev', 'CF-IPCountry': 'KR' },
        'GET',
        authCookies,
      ),
    )
    const cnResponse = proxy(
      mockRequest(
        'https://pico.mutx.dev/',
        { host: 'pico.mutx.dev', 'CF-IPCountry': 'CN' },
        'GET',
        authCookies,
      ),
    )

    expect(jpResponse.headers.get('set-cookie')).toContain('NEXT_LOCALE=ja')
    expect(jpResponse.headers.get('x-middleware-rewrite')).toBe('https://pico.mutx.dev/pico')
    expect(krResponse.headers.get('set-cookie')).toContain('NEXT_LOCALE=ko')
    expect(krResponse.headers.get('x-middleware-rewrite')).toBe('https://pico.mutx.dev/pico')
    expect(cnResponse.headers.get('set-cookie')).toContain('NEXT_LOCALE=zh')
  })

  it('keeps cookie precedence over pico geolocation', () => {
    const response = proxy(
      mockRequest(
        'https://pico.mutx.dev/',
        { host: 'pico.mutx.dev', 'CF-IPCountry': 'JP' },
        'GET',
        { ...authCookies, NEXT_LOCALE: 'es' },
      ),
    )

    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=es')
  })

  it('prefers an explicit locale query over saved cookies while rewriting blocked pico routes to the guard', () => {
    const response = proxy(
      mockRequest(
        'https://pico.mutx.dev/pricing?locale=fr',
        { host: 'pico.mutx.dev', 'CF-IPCountry': 'JP' },
        'GET',
        { ...authCookies, NEXT_LOCALE: 'es', mutx_user_locale: 'de' },
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://pico.mutx.dev/pico/wip?locale=fr',
    )
    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=fr')
  })

  it('rewrites direct pico product routes into the public route guard', () => {
    const response = proxy(
      mockRequest(
        'https://pico.mutx.dev/academy/install-hermes-locally',
        { host: 'pico.mutx.dev', 'CF-IPCountry': 'JP' },
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://pico.mutx.dev/pico/wip',
    )
    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=ja')
  })

  it('prefers the saved authenticated locale over the guest locale cookie', () => {
    const response = proxy(
      mockRequest(
        'https://pico.mutx.dev/',
        { host: 'pico.mutx.dev' },
        'GET',
        { ...authCookies, NEXT_LOCALE: 'es', mutx_user_locale: 'de' },
      ),
    )

    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=de')
  })

  it('falls back to accept-language for pico when geo headers are missing', () => {
    const response = proxy(
      mockRequest(
        'https://pico.mutx.dev/',
        { host: 'pico.mutx.dev', 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
        'GET',
        authCookies,
      ),
    )

    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=es')
  })

  it('rewrites pico auth entry pages into the public route guard', () => {
    const loginResponse = proxy(
      mockRequest('https://pico.mutx.dev/login?next=%2Fonboarding', { host: 'pico.mutx.dev' }),
    )

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.headers.get('x-middleware-rewrite')).toBe(
      'https://pico.mutx.dev/pico/wip?next=%2Fonboarding',
    )

    const registerResponse = proxy(
      mockRequest('https://pico.mutx.dev/register?next=%2Facademy', { host: 'pico.mutx.dev' }),
    )

    expect(registerResponse.status).toBe(200)
    expect(registerResponse.headers.get('x-middleware-rewrite')).toBe(
      'https://pico.mutx.dev/pico/wip?next=%2Facademy',
    )
  })

  it('rewrites verify-email on the pico host into the public route guard', () => {
    const response = proxy(
      mockRequest(
        'https://pico.mutx.dev/verify-email?token=test-token',
        { host: 'pico.mutx.dev' },
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://pico.mutx.dev/pico/wip?token=test-token',
    )
  })

  it('rewrites explicit /pico paths on the pico host into the public route guard', () => {
    const response = proxy(
      mockRequest('https://pico.mutx.dev/pico/pricing', { host: 'pico.mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://pico.mutx.dev/pico/wip')
  })

  it('still applies rate-limit headers on protected auth endpoints', () => {
    const response = proxy(
      mockRequest('https://app.mutx.dev/api/auth/login', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('8')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('7')
    expect(response.headers.get('X-RateLimit-Reset')).not.toBeNull()
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('rejects cross-origin browser writes to api routes', async () => {
    const response = proxy(
      mockRequest(
        'https://app.mutx.dev/api/auth/logout',
        {
          host: 'app.mutx.dev',
          origin: 'https://evil.example',
        },
        'POST',
      ),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      detail: 'CSRF validation failed: origin is not allowed',
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('allows same-origin browser writes to api routes when x-forwarded-proto indicates https', () => {
    const response = proxy(
      mockRequest(
        'http://app.mutx.dev/api/auth/logout',
        {
          host: 'app.mutx.dev',
          origin: 'https://app.mutx.dev',
          'x-forwarded-proto': 'https',
        },
        'POST',
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
