export const DEFAULT_SITE_URL = 'https://mutx.dev'
export const DEFAULT_APP_URL = 'https://app.mutx.dev'
export const DEFAULT_X_HANDLE = '@mutxdev'
export const DEFAULT_OG_IMAGE = '/opengraph-image'
export const DEFAULT_OG_IMAGE_ALT = 'MUTX branded social preview card'

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

/**
 * Legacy: static default OG image (the robot).
 * Use getPageOgImageUrl() for per-page unique images.
 */
export function getOgImageUrl() {
  return toAbsoluteSiteUrl(DEFAULT_OG_IMAGE)
}

export function getTwitterImageUrl() {
  return toAbsoluteSiteUrl('/twitter-image')
}

/**
 * Generate a unique per-page image route backed by Next metadata image routes.
 */
function getImageRouteBase(path = '/') {
  if (path === '/pico') return '/pico'
  return ''
}

export function getPageOgImageUrl(
  title: string,
  description?: string,
  options?: { path?: string; badge?: string; host?: string },
): string {
  const params = new URLSearchParams({ title })
  if (description) params.set('description', description)
  if (options?.path) params.set('path', options.path)
  if (options?.badge) params.set('badge', options.badge)
  const baseUrl = normalizeUrl(options?.host, toAbsoluteSiteUrl(getImageRouteBase(options?.path)))
  return `${baseUrl}/opengraph-image?${params.toString()}`
}

export function getPageTwitterImageUrl(
  title: string,
  description?: string,
  options?: { path?: string; badge?: string; host?: string },
): string {
  const params = new URLSearchParams({ title })
  if (description) params.set('description', description)
  if (options?.path) params.set('path', options.path)
  if (options?.badge) params.set('badge', options.badge)
  const baseUrl = normalizeUrl(options?.host, toAbsoluteSiteUrl(getImageRouteBase(options?.path)))
  return `${baseUrl}/twitter-image?${params.toString()}`
}

/**
 * Build a JSON-LD WebPage schema object for a given route.
 * Includes Organization and WebSite references.
 */
export function buildWebPageStructuredData(options: {
  name: string
  path: string
  description: string
}) {
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'MUTX',
        url: siteUrl,
        sameAs: [`https://x.com/${DEFAULT_X_HANDLE.replace('@', '')}`],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'MUTX',
        applicationCategory: 'DeveloperApplication',
        description:
          'Source-available control plane for AI agent governance, deployment, and observability.',
        downloadUrl: `${siteUrl}/download`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'WebPage',
        name: options.name,
        url: getCanonicalUrl(options.path),
        description: options.description,
        isPartOf: { '@type': 'WebSite', name: 'MUTX', url: siteUrl },
      },
    ],
  }
}
