import { NextRequest, NextResponse } from 'next/server'
import { renderOgImage } from '@/lib/og'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple in-memory cache (per-process, survives across requests in the same instance)
const cache = new Map<string, { png: Buffer; ts: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const title = searchParams.get('title')
  if (!title) {
    return NextResponse.json(
      { error: 'Missing required parameter: title' },
      { status: 400 },
    )
  }

  const description = searchParams.get('description') || undefined
  const tag = searchParams.get('tag') || undefined
  const domain = searchParams.get('domain') || undefined

  // Build cache key from all params
  const cacheKey = `${title}::${description}::${tag}::${domain}`

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new NextResponse(new Uint8Array(cached.png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=3600',
      },
    })
  }

  try {
    const png = await renderOgImage({
      title,
      description,
      tag,
      domain,
    })

    // Store in cache (evict old entries if cache grows too large)
    if (cache.size > 500) {
      const oldest = Array.from(cache.entries()).sort((a, b) => a[1].ts - b[1].ts)
      for (let i = 0; i < 100; i++) cache.delete(oldest[i][0])
    }
    cache.set(cacheKey, { png, ts: Date.now() })

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('OG image render failed:', err)
    return NextResponse.json(
      { error: 'Failed to render OG image' },
      { status: 500 },
    )
  }
}
