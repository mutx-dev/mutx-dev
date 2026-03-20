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
const APP_HOSTS = new Set([APP_HOST, 'app.localhost'])
const MARKETING_HOSTS = new Set(['mutx.dev', 'www.mutx.dev'])
const UI_CACHE_CONTROL = 'private, no-cache, no-store, max-age=0, must-revalidate'
const APP_PUBLIC_PATHS = new Set([
  '/',
  '/overview',
  '/agents',
  '/deployments',
  '/runs',
  '/environments',
  '/access',
  '/connectors',
  '/audit',
  '/usage',
  '/settings',
])

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

function dashboardPathToAppPath(pathname: string): string {
  const normalized = normalizePathname(pathname)

  if (normalized === '/dashboard' || normalized === '/app' || normalized === '/overview') {
    return '/'
  }

  const directMap: Record<string, string> = {
    '/dashboard/agents': '/agents',
    '/dashboard/deployments': '/deployments',
    '/dashboard/runs': '/runs',
    '/dashboard/monitoring': '/environments',
    '/dashboard/api-keys': '/access',
    '/dashboard/webhooks': '/connectors',
    '/dashboard/history': '/audit',
    '/dashboard/budgets': '/usage',
    '/dashboard/control': '/settings',
    '/dashboard/logs': '/logs',
    '/dashboard/traces': '/traces',
    '/dashboard/memory': '/memory',
    '/dashboard/orchestration': '/orchestration',
  }

  if (directMap[normalized]) {
    return directMap[normalized]
  }

  if (normalized.startsWith('/app/')) {
    return dashboardPathToAppPath(mapLegacyAppPathToDashboard(normalized))
  }

  if (normalized.startsWith('/dashboard/')) {
    return normalized.slice('/dashboard'.length) || '/'
  }

  return normalized
}

function internalDemoPathToPublicPath(pathname: string): string {
  const normalized = normalizePathname(pathname)

  if (normalized === '/control') {
    return '/'
  }

  if (normalized.startsWith('/control/')) {
    return normalized.slice('/control'.length) || '/'
  }

  return normalized
}

function appHostPathToInternalDemoPath(pathname: string): string {
  const normalized = normalizePathname(pathname)

  const directMap: Record<string, string> = {
    '/': '/control',
    '/overview': '/control',
    '/agents': '/control/agents',
    '/deployments': '/control/deployments',
    '/runs': '/control/runs',
    '/environments': '/control/environments',
    '/access': '/control/access',
    '/connectors': '/control/connectors',
    '/audit': '/control/audit',
    '/usage': '/control/usage',
    '/settings': '/control/settings',
  }

  if (directMap[normalized]) {
    return directMap[normalized]
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

function rewriteWithinHost(request: NextRequest, pathname: string) {
  const url = new URL(request.url)
  url.pathname = pathname
  url.search = request.nextUrl.search
  return NextResponse.rewrite(url)
}

function shouldDisableUiCaching(host: string, pathname: string): boolean {
  if (pathname.startsWith('/api')) {
    return false
  }

  return MARKETING_HOSTS.has(host) || APP_HOSTS.has(host)
}

function applyUiCacheHeaders(response: NextResponse, host: string, pathname: string) {
  if (shouldDisableUiCaching(host, pathname)) {
    response.headers.set('Cache-Control', UI_CACHE_CONTROL)
  }

  return response
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
    const publicDemoPath = internalDemoPathToPublicPath(normalizedPath)
    if (publicDemoPath !== normalizedPath) {
      return applyUiCacheHeaders(
        redirectToHost(request, APP_HOST, publicDemoPath),
        host,
        normalizedPath,
      )
    }

    if (normalizedPath === '/login' || normalizedPath === '/register') {
      return applyUiCacheHeaders(
        redirectToHost(request, APP_HOST, normalizedPath),
        host,
        normalizedPath,
      )
    }

    if (normalizedPath !== '/' && APP_PUBLIC_PATHS.has(normalizedPath)) {
      return applyUiCacheHeaders(
        redirectToHost(request, APP_HOST, normalizedPath === '/overview' ? '/' : normalizedPath),
        host,
        normalizedPath,
      )
    }

    if (
      normalizedPath === '/dashboard' ||
      normalizedPath.startsWith('/dashboard/') ||
      normalizedPath === '/app' ||
      normalizedPath.startsWith('/app/')
    ) {
      return applyUiCacheHeaders(
        redirectToHost(request, APP_HOST, dashboardPathToAppPath(normalizedPath)),
        host,
        normalizedPath,
      )
    }
  }

  if (APP_HOSTS.has(host)) {
    const publicDemoPath = internalDemoPathToPublicPath(normalizedPath)
    if (publicDemoPath !== normalizedPath) {
      return applyUiCacheHeaders(
        redirectWithinHost(request, publicDemoPath),
        host,
        normalizedPath,
      )
    }

    if (normalizedPath === '/dashboard' || normalizedPath.startsWith('/dashboard/')) {
      return applyUiCacheHeaders(
        redirectWithinHost(request, dashboardPathToAppPath(normalizedPath)),
        host,
        normalizedPath,
      )
    }

    if (normalizedPath === '/app' || normalizedPath.startsWith('/app/')) {
      return applyUiCacheHeaders(
        redirectWithinHost(request, dashboardPathToAppPath(normalizedPath)),
        host,
        normalizedPath,
      )
    }

    const internalPath = appHostPathToInternalDemoPath(normalizedPath)
    if (internalPath !== normalizedPath) {
      return applyUiCacheHeaders(
        rewriteWithinHost(request, internalPath),
        host,
        normalizedPath,
      )
    }
  }

  const policy = getPolicy(pathname)
  if (!policy) {
    return applyUiCacheHeaders(NextResponse.next(), host, normalizedPath)
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
