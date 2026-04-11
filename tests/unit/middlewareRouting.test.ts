import type { NextRequest } from 'next/server'

import { proxy } from '../../proxy'

function mockRequest(
  url: string,
  headers: Record<string, string> = {},
  method = 'GET',
) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )
  const cookieEntries = (normalizedHeaders.cookie ?? '')
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [name, ...rest] = chunk.split('=')
      return [name, rest.join('=')] as const
    })
  const cookieMap = new Map(cookieEntries)

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
        const value = cookieMap.get(name)
        return value ? { name, value } : undefined
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

  it('allows direct /control routes on the app host to pass through unchanged', () => {
    const response = proxy(
      mockRequest('https://app.mutx.dev/control/agents', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('location')).toBeNull()
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


  it('maps pico geo country codes onto the expected locale cookie', () => {
    const japanResponse = proxy(
      mockRequest('https://pico.mutx.dev/', { host: 'pico.mutx.dev', 'cf-ipcountry': 'JP' }),
    )
    expect(japanResponse.headers.get('x-middleware-rewrite')).toBe('https://pico.mutx.dev/pico')
    expect(japanResponse.cookies.get('NEXT_LOCALE')?.value).toBe('ja')

    const koreaResponse = proxy(
      mockRequest('https://pico.mutx.dev/', { host: 'pico.mutx.dev', 'cf-ipcountry': 'KR' }),
    )
    expect(koreaResponse.cookies.get('NEXT_LOCALE')?.value).toBe('ko')

    const chinaResponse = proxy(
      mockRequest('https://pico.mutx.dev/', { host: 'pico.mutx.dev', 'cf-ipcountry': 'CN' }),
    )
    expect(chinaResponse.cookies.get('NEXT_LOCALE')?.value).toBe('zh')
  })

  it('prefers an explicit NEXT_LOCALE cookie over geo detection on pico hosts', () => {
    const response = proxy(
      mockRequest('https://pico.mutx.dev/', {
        host: 'pico.mutx.dev',
        cookie: 'NEXT_LOCALE=fr',
        'cf-ipcountry': 'IT',
      }),
    )

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('fr')
  })

  it('falls back to Accept-Language when pico geo headers are missing', () => {
    const response = proxy(
      mockRequest('https://pico.mutx.dev/', {
        host: 'pico.mutx.dev',
        'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
      }),
    )

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('es')
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
