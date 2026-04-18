import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, hasAuthSession } from '@/app/api/_lib/controlPlane'
import { unauthorized, withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'
import { isPicoHost } from '@/lib/auth/redirects'

export const dynamic = 'force-dynamic'

const supportedPlanIds = new Set(['starter', 'pro'])
const supportedPriceIdsByPlanId = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
} as const

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized()
    }

    const body = await request.json()
    const { planId, priceId } = body

    const resolvedPlanId = typeof planId === 'string' && supportedPlanIds.has(planId)
      ? planId
      : Object.entries(supportedPriceIdsByPlanId).find(([, configuredPriceId]) =>
          typeof priceId === 'string' && configuredPriceId === priceId,
        )?.[0]

    if (!resolvedPlanId) {
      return NextResponse.json(
        { error: 'A supported planId or priceId is required' },
        { status: 400 },
      )
    }

    const origin = new URL(request.url).origin
    const returnBasePath = isPicoHost(request.nextUrl.hostname) ? '' : '/pico'

    return proxyJson(request, `${getApiBaseUrl()}/v1/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: resolvedPlanId,
        success_url: `${origin}${returnBasePath}/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${returnBasePath}/pricing?checkout=canceled`,
        trial_days: 7,
      }),
      fallbackMessage: 'Failed to create checkout session',
    })
  })(request)
}
