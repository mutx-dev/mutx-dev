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

jest.mock('../../app/api/_lib/errors', () => ({
  unauthorized: () =>
    new Response(JSON.stringify({ detail: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  withErrorHandling:
    (handler: (request: NextRequest) => Promise<Response>) => async (request: NextRequest) =>
      handler(request),
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
          response: {
            ok: true,
            status: 200,
            json: async () => ({ email: 'test@mutx.dev', name: 'Test', plan: 'pro' }),
          },
          tokenRefreshed: false,
        }
      }

      return {
        response: {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, items: [] }),
        },
        tokenRefreshed: false,
      }
    })

    const { GET } = await import('../../app/api/dashboard/overview/route')
    const response = await GET(mockRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    const requestedUrls = authenticatedFetch.mock.calls.map((call) => call[1])
    expect(requestedUrls).toEqual(
      expect.arrayContaining([
        'http://localhost:8000/v1/governance/credentials/backends',
        'http://localhost:8000/v1/governance/trust',
        'http://localhost:8000/v1/governance/lifecycle',
        'http://localhost:8000/v1/governance/discovery',
        'http://localhost:8000/v1/governance/attestations',
        'http://localhost:8000/v1/runtime/governance/status',
        'http://localhost:8000/v1/runtime/governance/supervised/',
        'http://localhost:8000/v1/runtime/governance/supervised/profiles',
      ]),
    )
    expect(requestedUrls).not.toEqual(
      expect.arrayContaining([
        'http://localhost:8000/v1/runtime/governance/credentials/backends',
        'http://localhost:8000/v1/runtime/governance/trust',
        'http://localhost:8000/v1/runtime/governance/lifecycle',
        'http://localhost:8000/v1/runtime/governance/discovery',
        'http://localhost:8000/v1/runtime/governance/attestation',
      ]),
    )
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
