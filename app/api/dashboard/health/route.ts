import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({ status: 'unknown' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard health proxy error:', error)
    return NextResponse.json({ status: 'unknown', error: 'Failed to connect to API' }, { status: 500 })
  }
}
