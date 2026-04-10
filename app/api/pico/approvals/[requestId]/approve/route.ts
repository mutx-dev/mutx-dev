import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  return withErrorHandling(async () => {
    const { requestId } = await context.params
    const payload = await request.json().catch(() => ({}))

    return proxyJson(request, `${getApiBaseUrl()}/v1/approvals/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      fallbackMessage: 'Failed to approve request',
    })
  })(request)
}
