import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT = 100 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in ms
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.ip ||
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

function getHostname(request: NextRequest) {
  return request.headers.get('host')?.split(':')[0]?.toLowerCase() || ''
}

function isAppHost(hostname: string) {
  return hostname === 'app.mutx.dev' || hostname === 'app.localhost'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHostname(request)

  // Handle /v1 -> /api redirects for CLI/SDK compatibility
  // CLI/SDK expect /v1/agents, /v1/deployments etc but API serves at /api/*
  if (pathname.startsWith('/v1/')) {
    const newPathname = '/api' + pathname.slice(3) // /v1/agents -> /api/agents
    const newUrl = request.nextUrl.clone()
    newUrl.pathname = newPathname
    return NextResponse.rewrite(newUrl)
  }

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
