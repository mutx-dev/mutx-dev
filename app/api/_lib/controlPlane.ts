import { NextRequest, NextResponse } from 'next/server'

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://${value}`
}

export function getApiBaseUrl() {
  return (
    normalizeBaseUrl(process.env.INTERNAL_API_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeBaseUrl(process.env.RAILWAY_SERVICE_ZOOMING_YOUTH_URL) ||
    normalizeBaseUrl(process.env.API_BASE_URL) ||
    'http://localhost:8000'
  )
}

export function shouldUseSecureCookies(request: NextRequest) {
  void request
  return true
}

export function getCookieDomain(request: NextRequest) {
  // Keep auth cookies host-only to avoid exposing tokens across subdomains.
  void request
  return undefined
}

export async function getAuthToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('access_token')?.value
  if (token) return token

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

export function getRefreshToken(request: NextRequest): string | null {
  return request.cookies.get('refresh_token')?.value ?? null
}

export async function refreshAuthToken(
  request: NextRequest,
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number } | null> {
  const apiBaseUrl = getApiBaseUrl()
  
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

/**
 * Authenticated fetch with automatic token refresh on 401.
 * Returns the response and a NextResponse with updated cookies if token was refreshed.
 */
export async function authenticatedFetch(
  request: NextRequest,
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response; tokenRefreshed: boolean; cookieHeader?: string }> {
  let token = await getAuthToken(request)
  let refreshToken = getRefreshToken(request)
  
  // Initial fetch with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  })

  // If unauthorized, try to refresh the token
  if (response.status === 401 && token && refreshToken) {
    const newTokens = await refreshAuthToken(request, refreshToken)
    if (newTokens) {
      // Retry with new token
      token = newTokens.access_token
      refreshToken = newTokens.refresh_token || refreshToken
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      
      // Build cookie header for updated tokens
      const cookieParts = [`access_token=${newTokens.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${newTokens.expires_in}`]
      if (newTokens.refresh_token) {
        cookieParts.push(`refresh_token=${newTokens.refresh_token}; Path=/; HttpOnly; SameSite=Lax`)
      }
      
      return { response, tokenRefreshed: true, cookieHeader: cookieParts.join('; ') }
    }
  }

  return { response, tokenRefreshed: false }
}
