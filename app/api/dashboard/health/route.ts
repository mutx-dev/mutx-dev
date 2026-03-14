import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()
const HEALTH_TIMEOUT_MS = Number(process.env.DASHBOARD_HEALTH_TIMEOUT_MS ?? '2500')

export const dynamic = 'force-dynamic'

export async function GET() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, Math.max(50, HEALTH_TIMEOUT_MS))

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const payload = await response.json().catch(() => ({ status: 'unknown' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard health proxy error:', error)
    return NextResponse.json({ status: 'unknown', error: 'Failed to connect to API' }, { status: 500 })
  } finally {
    clearTimeout(timeoutId)
  }
}
