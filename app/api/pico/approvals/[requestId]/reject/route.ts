import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'
import { validateRequest } from '@/app/api/_lib/validation'

import { approvalResolveSchema, validateApprovalRequestId } from '@/app/api/pico/approvals/_validation'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  return withErrorHandling(async () => {
    const { requestId } = await context.params
    const requestIdValidation = validateApprovalRequestId(requestId)
    if (!requestIdValidation.success) {
      return requestIdValidation.response
    }

    const payloadValidation = await validateRequest(approvalResolveSchema, request)
    if (!payloadValidation.success) {
      return payloadValidation.response
    }

    return proxyJson(request, `${getApiBaseUrl()}/v1/approvals/${requestIdValidation.requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadValidation.data),
      fallbackMessage: 'Failed to reject request',
    })
  })(request)
}
