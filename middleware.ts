import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// const CURRENT_API_VERSION = 'v1'

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 }
}

export function middleware(request: NextRequest) {
  // Skip static files
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/static') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check rate limit (applies to all matched routes)
  const { allowed, remaining, resetTime } = checkRateLimit(request)

  // Build base response with rate limit headers
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(resetTime))

  if (!allowed) {
    const headers = new Headers(response.headers)
    return new NextResponse('Too Many Requests', { status: 429, headers })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
