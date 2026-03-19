import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type RateLimitPolicy = {
  limit: number
  windowMs: number
}

type RateLimitState = {
  count: number
  resetTime: number
}

const APP_HOST = 'app.mutx.dev'
const MARKETING_HOSTS = new Set(['mutx.dev', 'www.mutx.dev'])

const DEFAULT_POLICY: RateLimitPolicy = {
  limit: 10,
  windowMs: 10 * 60 * 1000,
}

const AUTH_POLICY: RateLimitPolicy = {
  limit: 8,
  windowMs: 5 * 60 * 1000,
}

const LIMIT_STORE = new Map<string, RateLimitState>()

const POLICY_BY_PATH: Array<[string, RateLimitPolicy]> = [
  ['/api/auth/login', AUTH_POLICY],
  ['/api/auth/register', AUTH_POLICY],
  ['/api/auth/forgot-password', AUTH_POLICY],
  ['/api/auth/reset-password', AUTH_POLICY],
  ['/api/leads', DEFAULT_POLICY],
  ['/api/newsletter', DEFAULT_POLICY],
]

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

function getPolicy(pathname: string): RateLimitPolicy | null {
  for (const [prefix, policy] of POLICY_BY_PATH) {
    if (pathname.startsWith(prefix)) {
      return policy
    }
  }

  return null
}

function checkRateLimit(
  request: NextRequest,
  policy: RateLimitPolicy
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${request.nextUrl.pathname}:${getClientIp(request)}`
  const current = LIMIT_STORE.get(key)

  if (!current || current.resetTime <= now) {
    LIMIT_STORE.set(key, { count: 1, resetTime: now + policy.windowMs })
    return { allowed: true, remaining: policy.limit - 1, resetTime: now + policy.windowMs }
  }

  if (current.count >= policy.limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }

  current.count += 1
  LIMIT_STORE.set(key, current)
  return { allowed: true, remaining: Math.max(0, policy.limit - current.count), resetTime: current.resetTime }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const normalizedPath = normalizePathname(pathname)
  const host = getRequestHost(request)

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

  if (host === APP_HOST) {
    if (normalizedPath === '/') {
      return redirectWithinHost(request, '/dashboard')
    }

    if (normalizedPath === '/app' || normalizedPath.startsWith('/app/')) {
      return redirectWithinHost(request, canonicalizeAppPath(normalizedPath))
    }
  }

  const policy = getPolicy(pathname)
  if (!policy) {
    return NextResponse.next()
  }

  const { allowed, remaining, resetTime } = checkRateLimit(request, policy)
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(policy.limit))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(resetTime))

  if (!allowed) {
    const headers = new Headers(response.headers)
    headers.set('Retry-After', String(Math.ceil((resetTime - Date.now()) / 1000)))
    return new NextResponse('Too Many Requests', { status: 429, headers })
  }

  return response
}

export const config = {
  matcher: ['/:path*'],
}
