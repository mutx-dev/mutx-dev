import type { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()
const hasAuthSession = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
  hasAuthSession,
}))

type MockRequestOptions = {
  body?: unknown
  jsonError?: Error
}

function mockRequest(options: MockRequestOptions = {}) {
  const { body = {}, jsonError } = options

  return {
    json: async () => {
      if (jsonError) {
        throw jsonError
      }
      return body
    },
    headers: {
      get: () => null,
    },
    cookies: {
      get: () => ({ value: 'token' }),
    },
  } as unknown as NextRequest
}

describe('pico package route', () => {
  beforeEach(() => {
    jest.resetModules()
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
    hasAuthSession.mockReset()
  })

  it('rejects package generation when no auth session exists', async () => {
    hasAuthSession.mockReturnValue(false)

    const { POST } = await import('../../app/api/pico/package/route')
    const request = mockRequest({ body: { session_id: 'sess_123' } })

    const response = await POST(request)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    })
    expect(authenticatedFetch).not.toHaveBeenCalled()
  })

  it('passes the package payload through and preserves upstream download headers', async () => {
    hasAuthSession.mockReturnValue(true)
    const zipBytes = Uint8Array.from([80, 75, 3, 4])
    authenticatedFetch.mockResolvedValue({
      response: new Response(zipBytes, {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-disposition': 'attachment; filename="starter-agent.zip"',
        },
      }),
      tokenRefreshed: false,
    })

    const { POST } = await import('../../app/api/pico/package/route')
    const request = mockRequest({ body: { session_id: 'sess_123', include_readme: true } })

    const response = await POST(request)

    expect(authenticatedFetch).toHaveBeenCalledWith(
      request,
      'http://localhost:8000/v1/pico/generate-package',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'sess_123', include_readme: true }),
        cache: 'no-store',
      },
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/octet-stream')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="starter-agent.zip"')
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual(Array.from(zipBytes))
    expect(applyAuthCookies).not.toHaveBeenCalled()
  })

  it('falls back to an empty payload and zip defaults when request JSON or upstream headers are missing', async () => {
    hasAuthSession.mockReturnValue(true)
    const refreshedTokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 1800,
    }
    authenticatedFetch.mockResolvedValue({
      response: new Response(Uint8Array.from([1, 2, 3]), {
        status: 202,
      }),
      tokenRefreshed: true,
      refreshedTokens,
    })

    const { POST } = await import('../../app/api/pico/package/route')
    const request = mockRequest({ jsonError: new SyntaxError('Unexpected end of JSON input') })

    const response = await POST(request)

    expect(authenticatedFetch).toHaveBeenCalledWith(
      request,
      'http://localhost:8000/v1/pico/generate-package',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      },
    )
    expect(response.status).toBe(202)
    expect(response.headers.get('content-type')).toBe('application/zip')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="agent-config.zip"')
    expect(applyAuthCookies).toHaveBeenCalledWith(expect.anything(), request, refreshedTokens)
  })
})
