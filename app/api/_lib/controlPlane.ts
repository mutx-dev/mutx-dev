import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'node:fs'

export type AuthTokens = {
  access_token: string
  refresh_token?: string
  expires_in: number
}

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://${value}`
}

export function getApiBaseUrl() {
  const runtimeContextPath = process.env.MUTX_DESKTOP_RUNTIME_CONTEXT_PATH
  if (runtimeContextPath) {
    try {
      const raw = readFileSync(runtimeContextPath, 'utf8')
      const parsed = JSON.parse(raw) as { apiUrl?: string }
      const runtimeUrl = normalizeBaseUrl(parsed.apiUrl)
      if (runtimeUrl) {
        return runtimeUrl
      }
    } catch {
      // fall through to env-based resolution
    }
  }

  return (
    normalizeBaseUrl(process.env.INTERNAL_API_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeBaseUrl(process.env.RAILWAY_SERVICE_ZOOMING_YOUTH_URL) ||
    normalizeBaseUrl(process.env.API_BASE_URL) ||
    'http://localhost:8000'
  )
}

export function shouldUseSecureCookies(request: NextRequest) {
  // Auth cookies stay secure-only even when desktop/browser flows are mediated
  // through localhost or forwarded HTTPS headers. The release contract and unit
  // tests both assume the stricter posture.
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

export function hasAuthSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get('access_token')?.value || getRefreshToken(request) || request.headers.get('authorization'))
}

export function applyAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: AuthTokens
) {
  const secureCookies = shouldUseSecureCookies(request)
  const cookieDomain = getCookieDomain(request)

  response.cookies.set('access_token', tokens.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    domain: cookieDomain,
    path: '/',
    maxAge: tokens.expires_in || 1800,
  })

  if (tokens.refresh_token) {
    response.cookies.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      domain: cookieDomain,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }
}

export function clearAuthCookies(response: NextResponse, request: NextRequest) {
  const secureCookies = shouldUseSecureCookies(request)
  const cookieDomain = getCookieDomain(request)

  response.cookies.set('access_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    domain: cookieDomain,
    path: '/',
    maxAge: 0,
  })
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    domain: cookieDomain,
    path: '/',
    maxAge: 0,
  })
}

export async function refreshAuthToken(
  request: NextRequest,
  refreshToken: string
): Promise<AuthTokens | null> {
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
): Promise<{ response: Response; tokenRefreshed: boolean; refreshedTokens?: AuthTokens }> {
  let token = await getAuthToken(request)
  const refreshToken = getRefreshToken(request)

  // Initial fetch with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  })

  // If unauthorized, try to refresh the token
  if (response.status === 401 && refreshToken) {
    const newTokens = await refreshAuthToken(request, refreshToken)
    if (newTokens) {
      // Retry with new token
      token = newTokens.access_token
      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      return { response, tokenRefreshed: true, refreshedTokens: newTokens }
    }
  }

  return { response, tokenRefreshed: false }
}
