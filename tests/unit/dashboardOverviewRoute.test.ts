import { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()
const hasAuthSession = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
  hasAuthSession,
}))

function mockRequest(url = 'http://localhost:3000/api/dashboard/overview') {
  return {
    url,
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn(),
    },
  } as unknown as NextRequest
}

describe('dashboard overview route', () => {
  beforeEach(() => {
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
    hasAuthSession.mockReset()
    hasAuthSession.mockReturnValue(true)
  })

  it('includes governance resources in the aggregated payload', async () => {
    authenticatedFetch.mockImplementation(async (_request: NextRequest, url: string) => {
      if (url.endsWith('/v1/auth/me')) {
        return {
          response: new Response(JSON.stringify({ email: 'test@mutx.dev', name: 'Test', plan: 'pro' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
          tokenRefreshed: false,
        }
      }

      return {
        response: new Response(JSON.stringify({ ok: true, items: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
        tokenRefreshed: false,
      }
    })

    const { GET } = await import('../../app/api/dashboard/overview/route')
    const response = await GET(mockRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.resources).toEqual(
      expect.objectContaining({
        securityMetrics: expect.any(Object),
        securityCompliance: expect.any(Object),
        securityApprovals: expect.any(Object),
        governanceCredentialBackends: expect.any(Object),
        governanceTrust: expect.any(Object),
        governanceLifecycle: expect.any(Object),
        governanceDiscovery: expect.any(Object),
        governanceAttestation: expect.any(Object),
        governanceRuntimeStatus: expect.any(Object),
        governedSupervision: expect.any(Object),
        governedProfiles: expect.any(Object),
      }),
    )
  })
})
