import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { getDocSitemapRoutes } from '@/lib/docs'
import { PICO_LESSONS } from '@/lib/pico/academy'
import {
  PUBLIC_MARKETING_ROUTES,
  getAppUrl,
  getPicoUrl,
  resolveSeoSurface,
  toAbsoluteSiteUrl,
  toAbsoluteUrl,
} from '@/lib/seo'

const routePriorities: Record<string, number> = {
  '/': 1,
  '/download': 0.95,
  '/releases': 0.9,
  '/docs': 0.85,
  '/docs/deployment/quickstart': 0.82,
  '/docs/quickstart': 0.8,
  '/ai-agent-cost': 0.8,
  '/ai-agent-approvals': 0.8,
  '/docs/architecture/overview': 0.76,
  '/docs/agents': 0.74,
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const requestHeaders = await headers()
  const requestHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const surface = resolveSeoSurface(requestHost)

  if (surface === 'app') {
    return [
      {
        url: toAbsoluteUrl(getAppUrl(), '/control'),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
    ]
  }

  if (surface === 'pico') {
    const picoRoutes = [
      '/',
      '/academy',
      '/autopilot',
      '/onboarding',
      '/pricing',
      '/support',
      '/tutor',
      ...PICO_LESSONS.map((lesson) => `/academy/${lesson.slug}`),
    ]

    return picoRoutes.map((route) => ({
      url: toAbsoluteUrl(getPicoUrl(), route),
      lastModified: now,
      changeFrequency: route.startsWith('/academy/') ? 'weekly' : 'monthly',
      priority: route === '/' ? 1 : route === '/academy' ? 0.9 : 0.72,
    }))
  }

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
