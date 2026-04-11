import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { badRequest, withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withErrorHandling(async () => {
    const { templateId } = await params
    let payload: unknown

    try {
      payload = await request.json()
    } catch (error) {
      if (error instanceof SyntaxError) {
        return badRequest('Invalid JSON in request body')
      }
      throw error
    }

    return proxyJson(request, `${getApiBaseUrl()}/v1/templates/${templateId}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      fallbackMessage: 'Failed to deploy starter template',
    })
  })(request)
}
