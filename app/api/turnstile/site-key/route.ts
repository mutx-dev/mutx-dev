import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''

  return NextResponse.json(
    { siteKey },
    {
      status: siteKey ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
