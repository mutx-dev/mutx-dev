export {}

const mockSql = jest.fn()

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function loadRoute(sqlValue: unknown = mockSql) {
  jest.doMock('../../app/api/_lib/controlPlane', () => ({
    getApiBaseUrl: () => 'http://localhost:8000',
  }))
  jest.doMock('../../lib/db', () => ({
    __esModule: true,
    default: sqlValue,
  }))

  return import('../../app/api/contact/route')
}

describe('contact route handlers', () => {
  let fetchSpy: jest.SpyInstance
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.RESEND_API_KEY
    delete process.env.LEAD_DISCORD_WEBHOOK_URL
    delete process.env.DISCORD_LEAD_WEBHOOK_URL
    mockSql.mockReset()
    fetchSpy = jest.spyOn(global as typeof globalThis, 'fetch').mockImplementation(jest.fn())
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    process.env = originalEnv
  })

  describe('POST /api/contact', () => {
    it('captures Pico contact submissions through the shared lead pipeline before returning success', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'lead_123',
          email: 'lead@example.com',
          source: 'pico-landing',
        }),
      })

      const { POST } = await loadRoute()
      const response = await POST(
        makeRequest({
          email: 'lead@example.com',
          name: 'Lead',
          company: 'MUTX',
          message: 'Need help shipping agents',
          source: 'pico-landing',
        }),
      )

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lead@example.com',
          name: 'Lead',
          company: 'MUTX',
          message: 'Need help shipping agents',
          source: 'pico-landing',
        }),
        cache: 'no-store',
      })
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        success: true,
      })
    })

    it('returns lead pipeline failures instead of pretending the contact was captured', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('connect ECONNREFUSED'))

      const { POST } = await loadRoute(null)
      const response = await POST(
        makeRequest({
          email: 'lead@example.com',
          name: 'Lead',
          company: 'MUTX',
          message: 'Need help shipping agents',
          source: 'pico-landing',
        }),
      )

      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toMatchObject({
        status: 'error',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message:
            'Lead capture is temporarily unavailable. Please email hello@mutx.dev if you need an immediate response.',
        },
      })
    })
  })
})
