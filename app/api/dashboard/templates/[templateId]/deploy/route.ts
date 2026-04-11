import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withErrorHandling(async () => {
    const { templateId } = await params
    const body = await request.text()

    return proxyJson(request, `${getApiBaseUrl()}/v1/templates/${templateId}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      fallbackMessage: 'Failed to deploy starter template',
    })
  })(request)
}
