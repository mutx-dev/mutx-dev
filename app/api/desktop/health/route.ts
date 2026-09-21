import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Local UI readiness must not depend on the remote control plane or its database.
// Remote health remains available at /api/dashboard/health for operator status.
export async function GET() {
  return NextResponse.json({
    component: 'desktop-ui',
    status: 'healthy',
    readiness: 'ready',
    timestamp: new Date().toISOString(),
  })
}
