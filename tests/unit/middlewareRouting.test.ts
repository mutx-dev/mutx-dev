import type { NextRequest } from 'next/server'

import { middleware } from '../../middleware'

function mockRequest(url: string, headers: Record<string, string> = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    url,
    nextUrl: new URL(url),
    headers: {
      get(name: string) {
        return normalizedHeaders[name.toLowerCase()] ?? null
      },
    },
  } as unknown as NextRequest
}

describe('host-aware UI routing middleware', () => {
  it('redirects marketing-host legacy /app traffic to app.mutx.dev dashboard paths', () => {
    const response = middleware(
      mockRequest('https://mutx.dev/app/agents?tab=live', { host: 'mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/dashboard/agents?tab=live')
  })

  it('redirects marketing-host auth pages to the app host', () => {
    const response = middleware(
      mockRequest('https://mutx.dev/login?next=%2Fdashboard', { host: 'mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/login?next=%2Fdashboard')
  })

  it('redirects app host root to the canonical dashboard surface', () => {
    const response = middleware(
      mockRequest('https://app.mutx.dev/', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/dashboard')
  })

  it('redirects app host legacy /app pages to dashboard routes', () => {
    const response = middleware(
      mockRequest('https://app.mutx.dev/app/health', { host: 'app.mutx.dev' }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.mutx.dev/dashboard/monitoring')
  })

  it('maps stale legacy workflow routes onto canonical dashboard destinations', () => {
    const activityResponse = middleware(
      mockRequest('https://app.mutx.dev/app/activity', { host: 'app.mutx.dev' }),
    )

    expect(activityResponse.status).toBe(307)
    expect(activityResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/history')

    const cronResponse = middleware(
      mockRequest('https://app.mutx.dev/app/cron', { host: 'app.mutx.dev' }),
    )

    expect(cronResponse.status).toBe(307)
    expect(cronResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/orchestration')

    const settingsResponse = middleware(
      mockRequest('https://app.mutx.dev/app/settings', { host: 'app.mutx.dev' }),
    )

    expect(settingsResponse.status).toBe(307)
    expect(settingsResponse.headers.get('location')).toBe('https://app.mutx.dev/dashboard/control')
  })

  it('passes through unrelated routes and still applies rate-limit headers', () => {
    const response = middleware(
      mockRequest('https://mutx.dev/contact', { host: 'mutx.dev' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('100')
  })
})
