import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    return proxyJson(request, `${getApiBaseUrl()}/v1/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${new URL(request.url).origin}/onboarding?checkout=success`,
        cancel_url: `${new URL(request.url).origin}/pricing?checkout=canceled`,
        trial_days: 7,
      }),
      fallbackMessage: 'Failed to create checkout session',
    })
  })(request)
}
