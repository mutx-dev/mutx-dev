import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; skillId: string }> },
) {
  return withErrorHandling(async () => {
    const { agentId, skillId } = await params
    return proxyJson(request, `${getApiBaseUrl()}/v1/assistant/${agentId}/skills/${skillId}`, {
      method: 'POST',
      fallbackMessage: 'Failed to install assistant skill',
    })
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; skillId: string }> },
) {
  return withErrorHandling(async () => {
    const { agentId, skillId } = await params
    return proxyJson(request, `${getApiBaseUrl()}/v1/assistant/${agentId}/skills/${skillId}`, {
      method: 'DELETE',
      fallbackMessage: 'Failed to uninstall assistant skill',
    })
  })(request)
}
