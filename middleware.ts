import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT = 100 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in ms
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIp(request)
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    const newResetTime = now + RATE_LIMIT_WINDOW
    rateLimitMap.set(ip, { count: 1, resetTime: newResetTime })
    return { allowed: true, remaining: RATE_LIMIT - 1, resetTime: newResetTime }
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetTime: record.resetTime }
}

export function generateRequestId(): string {
  return crypto.randomUUID()
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files
  if (pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Use existing request ID from client or generate a new one
  const requestId = request.headers.get('x-request-id') || generateRequestId()

  // Forward the request ID to route handlers via request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  // API routes: attach request ID only (no rate limiting)
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('X-Request-ID', requestId)
    return response
  }

  // Non-API routes: apply rate limiting as well
  const { allowed, remaining, resetTime } = checkRateLimit(request)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('X-Request-ID', requestId)
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(resetTime))

  if (!allowed) {
    return new NextResponse('Too Many Requests', { status: 429, headers: response.headers })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
