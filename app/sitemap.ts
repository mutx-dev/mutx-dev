import type { MetadataRoute } from 'next'

import { getDocSitemapRoutes } from '@/lib/docs'
import { PUBLIC_MARKETING_ROUTES, toAbsoluteSiteUrl } from '@/lib/seo'

const routePriorities: Record<string, number> = {
  '/': 1,
  '/download': 0.95,
  '/releases': 0.9,
  '/docs': 0.85,
  '/contact': 0.8,
}

const monthlyRoutes = new Set<string>([
  '/privacy-policy',
  '/roadmap',
  '/manifesto',
  '/whitepaper',
  '/security',
  '/support',
  '/sdk',
  '/infrastructure',
])

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [...PUBLIC_MARKETING_ROUTES, ...getDocSitemapRoutes()].filter(
    (route, index, allRoutes) => allRoutes.indexOf(route) === index,
  )

  return routes.map((route) => ({
    url: toAbsoluteSiteUrl(route),
    lastModified: now,
    changeFrequency: route.startsWith('/docs/') || route === '/docs'
      ? 'weekly'
      : monthlyRoutes.has(route)
        ? 'monthly'
        : 'weekly',
    priority:
      routePriorities[route] ?? (route.startsWith('/docs/') ? 0.65 : 0.7),
  }))
}
