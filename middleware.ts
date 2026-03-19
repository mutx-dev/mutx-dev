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
  const policy = getPolicy(request.nextUrl.pathname)
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
  matcher: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/leads',
    '/api/newsletter',
  ],
}
