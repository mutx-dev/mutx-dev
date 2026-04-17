import { headers } from 'next/headers'

import { buildOgImageResponseWithCache } from '@/lib/og-image'
import {
  getDefaultSocialBadge,
  getSurfaceUrl,
  resolveSeoSurfaceForPath,
  resolveSocialSection,
} from '@/lib/seo'

export const runtime = 'nodejs'
export const revalidate = 3600
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

function trim(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3).trimEnd()}...`
}

export default async function Image({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const requestHeaders = await headers()
  const query = (await searchParams) ?? {}
  const requestHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const path = typeof query.path === 'string' ? query.path : '/'
  const surface = resolveSeoSurfaceForPath(path, requestHost)
  const section = resolveSocialSection(path, requestHost)
  const title = trim(
    typeof query.title === 'string' ? query.title : 'MUTX | Open Control Plane for AI Agents',
    96,
  )
  const description = trim(
    typeof query.description === 'string'
      ? query.description
      : 'Operate deployed agents with real auth, deployments, traces, webhooks, runtime posture, and operator tooling across web, API, CLI, and docs.',
    180,
  )
  const badge = trim(
    typeof query.badge === 'string' ? query.badge.toUpperCase() : getDefaultSocialBadge(path, requestHost),
    24,
  )

  return buildOgImageResponseWithCache({
    title,
    description,
    badge,
    host: getSurfaceUrl(surface),
    surface,
    section,
  })
}
