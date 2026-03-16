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

export function middleware(request: NextRequest) {
  // Skip static files and API routes for rate limiting
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/static') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check rate limit
  const { allowed, remaining, resetTime } = checkRateLimit(request)

  // Add rate limit headers
  const response = NextResponse.next()
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
