import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const secureCookies =
      request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https'

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Registration failed' }))

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    const nextResponse = NextResponse.json(payload)
    nextResponse.cookies.set('access_token', payload.access_token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: secureCookies,
      path: '/',
      maxAge: payload.expires_in || 1800,
    })
    nextResponse.cookies.set('refresh_token', payload.refresh_token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: secureCookies,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return nextResponse
  } catch (error) {
    console.error('Auth register proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}
