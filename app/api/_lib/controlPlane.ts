import { NextRequest } from 'next/server'

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

/**
 * Get the current authenticated user from the API.
 * This is used for ownership validation in API routes.
 */
export async function getCurrentUser(request: NextRequest): Promise<{ id: string; email: string } | null> {
  const token = await getAuthToken(request)
  if (!token) return null

  const API_BASE_URL = getApiBaseUrl()
  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const user = await response.json()
    return { id: user.id, email: user.email }
  } catch {
    return null
  }
}
