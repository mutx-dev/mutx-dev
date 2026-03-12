import type { NextRequest } from 'next/server'

import { getCookieDomain, shouldUseSecureCookies } from '../../app/api/_lib/controlPlane'

function mockRequest(url: string, forwardedProto?: string) {
  return {
    nextUrl: new URL(url),
    headers: {
      get(name: string) {
        return name === 'x-forwarded-proto' ? forwardedProto ?? null : null
      },
    },
  } as unknown as NextRequest
}

describe('dashboard auth cookie policy helpers', () => {
  it('shares auth cookies across mutx.dev subdomains', () => {
    expect(getCookieDomain(mockRequest('https://app.mutx.dev/api/auth/login'))).toBe('.mutx.dev')
    expect(getCookieDomain(mockRequest('https://mutx.dev/api/auth/login'))).toBe('.mutx.dev')
  })

  it('does not force a domain on localhost-style environments', () => {
    expect(getCookieDomain(mockRequest('http://app.localhost:3000/api/auth/login'))).toBeUndefined()
    expect(getCookieDomain(mockRequest('http://localhost:3000/api/auth/login'))).toBeUndefined()
  })

  it('marks cookies secure for direct https and forwarded https requests', () => {
    expect(shouldUseSecureCookies(mockRequest('https://app.mutx.dev/api/auth/login'))).toBe(true)
    expect(shouldUseSecureCookies(mockRequest('http://app.mutx.dev/api/auth/login', 'https'))).toBe(true)
    expect(shouldUseSecureCookies(mockRequest('http://localhost:3000/api/auth/login'))).toBe(false)
  })
})
