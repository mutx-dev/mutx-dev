export const DEFAULT_SITE_URL = 'https://mutx.dev'
export const DEFAULT_APP_URL = 'https://app.mutx.dev'
export const DEFAULT_X_HANDLE = '@mutxdev'
export const DEFAULT_OG_IMAGE = '/landing/webp/victory-core.webp'
export const DEFAULT_OG_IMAGE_ALT = 'MUTX robot holding the MUTX mark aloft'

export const PUBLIC_MARKETING_ROUTES = [
  '/',
  '/download',
  '/download/macos',
  '/releases',
  '/contact',
  '/docs',
  '/manifesto',
  '/infrastructure',
  '/sdk',
  '/whitepaper',
  '/security',
  '/support',
  '/roadmap',
  '/privacy-policy',
  '/ai-agent-governance',
  '/ai-agent-approvals',
  '/ai-agent-audit-logs',
  '/ai-agent-control-plane',
  '/ai-agent-cost',
  '/ai-agent-deployment',
  '/ai-agent-guardrails',
  '/ai-agent-infrastructure',
  '/ai-agent-monitoring',
  '/ai-agent-reliability',
] as const

export const BLOCKED_CRAWL_PREFIXES = [
  '/api/',
  '/dashboard',
  '/control',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
] as const

function normalizeUrl(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return value.replace(/\/$/, '')
}

export function getSiteUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL)
}

export function getAppUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL, DEFAULT_APP_URL)
}

export function toAbsoluteSiteUrl(path = '/') {
  const normalizedPath = path === '/' ? '' : path
  return `${getSiteUrl()}${normalizedPath}`
}

export function toAbsoluteAppUrl(path = '/') {
  const normalizedPath = path === '/' ? '' : path
  return `${getAppUrl()}${normalizedPath}`
}

export function getCanonicalUrl(path = '/') {
  return toAbsoluteSiteUrl(path)
}

export function getOgImageUrl() {
  return toAbsoluteSiteUrl(DEFAULT_OG_IMAGE)
}
