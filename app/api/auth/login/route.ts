import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getCookieDomain, shouldUseSecureCookies } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.login, req)
    if (!validation.success) {
      return validation.response
    }

    const { email, password } = validation.data
    const body = { email, password }
    
    const secureCookies = shouldUseSecureCookies(request)
    const cookieDomain = getCookieDomain(request)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Login failed' }))

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    const nextResponse = NextResponse.json(payload)
    nextResponse.cookies.set('access_token', payload.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      domain: cookieDomain,
      path: '/',
      maxAge: payload.expires_in || 1800,
    })
    nextResponse.cookies.set('refresh_token', payload.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      domain: cookieDomain,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return nextResponse
  })(request)
}
