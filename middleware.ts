import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const APP_HOST = 'app.mutx.dev'
const MARKETING_HOSTS = new Set(['mutx.dev', 'www.mutx.dev'])

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

function getRequestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = request.headers.get('host')?.split(',')[0]?.trim()
  return (forwardedHost || host || request.nextUrl.hostname).split(':')[0]
}

function normalizePathname(pathname: string): string {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function mapLegacyAppPathToDashboard(pathname: string): string {
  const normalized = normalizePathname(pathname)

  const directMap: Record<string, string> = {
    '/app': '/dashboard',
    '/app/agents': '/dashboard/agents',
    '/app/deployments': '/dashboard/deployments',
    '/app/api-keys': '/dashboard/api-keys',
    '/app/webhooks': '/dashboard/webhooks',
    '/app/logs': '/dashboard/logs',
    '/app/history': '/dashboard/history',
    '/app/activity': '/dashboard/history',
    '/app/budgets': '/dashboard/budgets',
    '/app/traces': '/dashboard/traces',
    '/app/runs': '/dashboard/runs',
    '/app/memory': '/dashboard/memory',
    '/app/spawn': '/dashboard/spawn',
    '/app/control': '/dashboard/control',
    '/app/settings': '/dashboard/control',
    '/app/orchestration': '/dashboard/orchestration',
    '/app/cron': '/dashboard/orchestration',
    '/app/health': '/dashboard/monitoring',
    '/app/observability': '/dashboard/monitoring',
  }

  if (directMap[normalized]) {
    return directMap[normalized]
  }

  if (normalized.startsWith('/app/')) {
    return `/dashboard${normalized.slice('/app'.length)}`
  }

  return normalized
}

function canonicalizeAppPath(pathname: string): string {
  const normalized = normalizePathname(pathname)

  if (normalized === '/dashboard' || normalized.startsWith('/dashboard/')) {
    return normalized
  }

  if (normalized === '/app' || normalized.startsWith('/app/')) {
    return mapLegacyAppPathToDashboard(normalized)
  }

  return normalized
}

function redirectToHost(request: NextRequest, host: string, pathname: string) {
  const url = new URL(request.url)
  url.hostname = host
  url.port = ''
  url.pathname = pathname
  url.search = request.nextUrl.search
  return NextResponse.redirect(url)
}

function redirectWithinHost(request: NextRequest, pathname: string) {
  const url = new URL(request.url)
  url.pathname = pathname
  url.search = request.nextUrl.search
  return NextResponse.redirect(url)
}

function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
  void getClientIp(request)
  return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files
  if (pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  const normalizedPath = normalizePathname(pathname)
  const host = getRequestHost(request)

  // Public marketing host should forward auth/app traffic to the app host.
  if (MARKETING_HOSTS.has(host)) {
    if (normalizedPath === '/login' || normalizedPath === '/register') {
      return redirectToHost(request, APP_HOST, normalizedPath)
    }

    if (
      normalizedPath === '/dashboard' ||
      normalizedPath.startsWith('/dashboard/') ||
      normalizedPath === '/app' ||
      normalizedPath.startsWith('/app/')
    ) {
      return redirectToHost(request, APP_HOST, canonicalizeAppPath(normalizedPath))
    }
  }

  // App host should land on the richer control-plane dashboard, not the old /app surface.
  if (host === APP_HOST) {
    if (normalizedPath === '/') {
      return redirectWithinHost(request, '/dashboard')
    }

    if (normalizedPath === '/app' || normalizedPath.startsWith('/app/')) {
      return redirectWithinHost(request, canonicalizeAppPath(normalizedPath))
    }
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
    // Match all paths except static files, images, and favicon
    '/:path*',
  ],
}
