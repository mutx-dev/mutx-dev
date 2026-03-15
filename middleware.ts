import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT = 100 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in ms
const MAX_RATE_LIMIT_ENTRIES = 10_000
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  return request.ip || 'unknown'
}

function pruneRateLimitMap(now: number) {
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }

  if (rateLimitMap.size < MAX_RATE_LIMIT_ENTRIES) {
    return
  }

  const overflow = rateLimitMap.size - MAX_RATE_LIMIT_ENTRIES + 1
  let removed = 0

  for (const ip of rateLimitMap.keys()) {
    rateLimitMap.delete(ip)
    removed++

    if (removed >= overflow) {
      break
    }
  }
}

function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIp(request)
  const now = Date.now()
  pruneRateLimitMap(now)
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

function getHostname(request: NextRequest) {
  return request.headers.get('host')?.split(':')[0]?.toLowerCase() || ''
}

function isAppHost(hostname: string) {
  return hostname === 'app.mutx.dev' || hostname === 'app.localhost'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHostname(request)

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(request)
    
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT))
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)))
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: Object.fromEntries(response.headers.entries()) }
      )
    }
    
    return response
  }

  if (!isAppHost(hostname)) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/android-chrome') ||
    pathname.startsWith('/site.webmanifest')
  ) {
    return NextResponse.next()
  }

  const rewriteUrl = request.nextUrl.clone()
  
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    return NextResponse.next()
  }
  
  rewriteUrl.pathname = pathname === '/' ? '/app' : `/app${pathname}`

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/', '/favicon.ico', '/robots.txt', '/sitemap.xml'],
}
