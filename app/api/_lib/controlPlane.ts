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

export async function getAuthToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('access_token')?.value
  if (token) return token

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}
