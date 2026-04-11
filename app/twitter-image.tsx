import { getSiteUrl } from '@/lib/seo'
import { buildOgImage } from '@/lib/og-image'

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
  const query = (await searchParams) ?? {}
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
  const badge = trim(typeof query.badge === 'string' ? query.badge.toUpperCase() : 'MUTX', 24)

  return buildOgImage({
    title,
    description,
    badge,
    host: getSiteUrl(),
  })
}
