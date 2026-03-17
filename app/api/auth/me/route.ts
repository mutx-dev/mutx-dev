import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, getRefreshToken, refreshAuthToken, getCookieDomain, shouldUseSecureCookies } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    // If unauthorized, try to refresh the token
    if (response.status === 401) {
      const refreshToken = getRefreshToken(request)
      if (refreshToken) {
        const refreshResult = await refreshAuthToken(request, refreshToken)
        
        if (refreshResult) {
          // Token refreshed, set new cookies and retry
          const secureCookies = shouldUseSecureCookies(request)
          const cookieDomain = getCookieDomain(request)
          
          const newResponse = await fetch(`${API_BASE_URL}/v1/auth/me`, {
            headers: { Authorization: `Bearer ${refreshResult.access_token}` },
            cache: 'no-store',
          })
          
          const payload = await newResponse.json().catch(() => ({ detail: 'Failed to fetch user' }))
          
          const nextResponse = NextResponse.json(payload, { status: newResponse.status })
          
          // Update access token cookie
          nextResponse.cookies.set('access_token', refreshResult.access_token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: secureCookies,
            domain: cookieDomain,
            path: '/',
            maxAge: refreshResult.expires_in || 1800,
          })
          
          // Update refresh token if provided
          if (refreshResult.refresh_token) {
            nextResponse.cookies.set('refresh_token', refreshResult.refresh_token, {
              httpOnly: true,
              sameSite: 'lax',
              secure: secureCookies,
              domain: cookieDomain,
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 7 days
            })
          }
          
          return nextResponse
        }
      }
    }

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch user' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Auth me proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}
