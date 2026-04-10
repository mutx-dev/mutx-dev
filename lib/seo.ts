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

/**
 * Legacy static OG image (the robot victory pose).
 * Kept as fallback for pages that haven't migrated.
 */
export function getOgImageUrl() {
  return toAbsoluteSiteUrl(DEFAULT_OG_IMAGE)
}

// ---------------------------------------------------------------------------
// Dynamic OG image generation
// ---------------------------------------------------------------------------

export interface DynamicOgImageOptions {
  /** Page headline */
  title: string
  /** One-line description */
  description?: string
  /** Optional pill label – e.g. "Docs", "PicoMUTX", "Security" */
  tag?: string
  /** Domain override (default: "mutx.dev") */
  domain?: string
}

/**
 * Build the URL for a dynamically rendered OG image.
 * Points to /api/og-image which renders a branded PNG on the fly.
 *
 * @example
 * ```ts
 * getDynamicOgImageUrl({
 *   title: 'AI Agent Approvals — Human-in-the-Loop Workflows',
 *   description: 'Define approval gates for high-stakes agent operations.',
 *   tag: 'Approvals',
 * })
 * ```
 */
export function getDynamicOgImageUrl(opts: DynamicOgImageOptions): string {
  const params = new URLSearchParams()
  params.set('title', opts.title)
  if (opts.description) params.set('description', opts.description)
  if (opts.tag) params.set('tag', opts.tag)
  if (opts.domain) params.set('domain', opts.domain)

  // Use the site URL as base so crawlers resolve it absolutely
  return `${getSiteUrl()}/api/og-image?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Page-type tag auto-detection from path
// ---------------------------------------------------------------------------

const PATH_TAG_MAP: Record<string, string> = {
  '/docs': 'Docs',
  '/security': 'Security',
  '/releases': 'Releases',
  '/roadmap': 'Roadmap',
  '/contact': 'Contact',
  '/support': 'Support',
  '/whitepaper': 'Whitepaper',
  '/privacy-policy': 'Privacy',
  '/pico': 'PicoMUTX',
  '/manifesto': 'Manifesto',
  '/infrastructure': 'Infrastructure',
  '/sdk': 'SDK',
  '/download': 'Download',
  '/download/macos': 'macOS',
  '/ai-agent-governance': 'Governance',
  '/ai-agent-approvals': 'Approvals',
  '/ai-agent-audit-logs': 'Audit Logs',
  '/ai-agent-control-plane': 'Control Plane',
  '/ai-agent-cost': 'Cost',
  '/ai-agent-deployment': 'Deployment',
  '/ai-agent-guardrails': 'Guardrails',
  '/ai-agent-infrastructure': 'Infrastructure',
  '/ai-agent-monitoring': 'Monitoring',
  '/ai-agent-reliability': 'Reliability',
}

/**
 * Auto-detect a tag label from the page path.
 * Returns undefined for the homepage and unknown paths.
 */
export function getTagForPath(path: string): string | undefined {
  return PATH_TAG_MAP[path]
}
