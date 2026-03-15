import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { agentId } = await params

    if (!agentId) {
      return NextResponse.json({ detail: 'Agent ID is required' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ detail: 'Failed to delete agent' }))
      return NextResponse.json(payload, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dashboard agents delete error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}
