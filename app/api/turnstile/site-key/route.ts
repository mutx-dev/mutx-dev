import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''

  return NextResponse.json(
    { siteKey },
    {
      // An empty key is a valid local/development state. Returning the
      // payload normally lets the client render its disabled fallback without
      // turning an optional integration into a browser console error.
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
