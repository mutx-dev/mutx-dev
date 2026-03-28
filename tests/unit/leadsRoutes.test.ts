const mockSql = jest.fn()

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/leads', {
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

  return import('../../app/api/leads/route')
}

describe('lead route handlers', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetModules()
    mockSql.mockReset()
    fetchSpy = jest.spyOn(global as typeof globalThis, 'fetch').mockImplementation(jest.fn())
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('POST /api/leads', () => {
    it('proxies successful lead captures to the control plane', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'lead_123',
          email: 'lead@example.com',
          source: 'contact-page',
        }),
      })

      const { POST } = await loadRoute()
      const response = await POST(
        makeRequest({
          email: 'lead@example.com',
          message: 'Need help shipping agents',
          source: 'contact-page',
        }),
      )

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lead@example.com',
          name: undefined,
          company: undefined,
          message: 'Need help shipping agents',
          source: 'contact-page',
        }),
        cache: 'no-store',
      })
      expect(response.status).toBe(201)
      await expect(response.json()).resolves.toEqual({
        id: 'lead_123',
        email: 'lead@example.com',
        source: 'contact-page',
      })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it('falls back to local database capture when the control plane is unavailable', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'backend unavailable' }),
      })
      mockSql
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'lead@example.com',
            name: 'Lead',
            company: 'MUTX',
            message: 'Need a hosted evaluation',
            source: 'contact-page:demo-hosted-access',
            created_at: '2026-03-27T22:10:00.000Z',
          },
        ])

      const { POST } = await loadRoute()
      const response = await POST(
        makeRequest({
          email: 'lead@example.com',
          name: 'Lead',
          company: 'MUTX',
          message: 'Need a hosted evaluation',
          source: 'contact-page:demo-hosted-access',
        }),
      )

      expect(response.status).toBe(201)
      await expect(response.json()).resolves.toMatchObject({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'lead@example.com',
        fallback: 'local-db',
        message: 'Lead captured locally while the control plane is temporarily unavailable.',
      })
      expect(mockSql).toHaveBeenCalledTimes(4)
    })

    it('preserves upstream client errors without attempting local fallback', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Message is too long' }),
      })

      const { POST } = await loadRoute()
      const response = await POST(
        makeRequest({
          email: 'lead@example.com',
          message: 'Need help shipping agents',
          source: 'contact-page',
        }),
      )

      expect(response.status).toBe(422)
      await expect(response.json()).resolves.toEqual({ detail: 'Message is too long' })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it('returns a clear service-unavailable message when no fallback store is configured', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('connect ECONNREFUSED'))

      const { POST } = await loadRoute(null)
      const response = await POST(
        makeRequest({
          email: 'lead@example.com',
          message: 'Need help shipping agents',
          source: 'contact-page',
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
