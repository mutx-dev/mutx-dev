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

type MockRequestOptions = {
  body?: unknown
  jsonError?: Error
  url?: string
}

function createJsonRequest(options: MockRequestOptions = {}) {
  const { body = {}, jsonError, url = 'https://pico.mutx.dev/api/pico/approvals' } = options

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
      get: () => undefined,
    },
    nextUrl: new URL(url),
  } as unknown as NextRequest
}

describe('pico approvals auth routes', () => {
  beforeEach(() => {
    jest.resetModules()
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
    hasAuthSession.mockReset()
    hasAuthSession.mockReturnValue(true)
  })

  it('returns 401 for approval creation before parsing an invalid body', async () => {
    hasAuthSession.mockReturnValue(false)

    const { POST } = await import('../../app/api/pico/approvals/route')
    const syntaxError = Object.assign(new SyntaxError('Unexpected end of JSON input'), {
      status: 400,
    })

    const response = await POST(
      createJsonRequest({
        jsonError: syntaxError,
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    expect(authenticatedFetch).not.toHaveBeenCalled()
  })

  it('returns 401 for approval actions before parsing an invalid body', async () => {
    hasAuthSession.mockReturnValue(false)
    const syntaxError = Object.assign(new SyntaxError('Unexpected end of JSON input'), {
      status: 400,
    })

    const { POST: approvePost } = await import('../../app/api/pico/approvals/[requestId]/approve/route')
    const approveResponse = await approvePost(
      createJsonRequest({
        jsonError: syntaxError,
        url: 'https://pico.mutx.dev/api/pico/approvals/req_123/approve',
      }),
      { params: Promise.resolve({ requestId: 'req_123' }) },
    )

    expect(approveResponse.status).toBe(401)
    await expect(approveResponse.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })

    const { POST: rejectPost } = await import('../../app/api/pico/approvals/[requestId]/reject/route')
    const rejectResponse = await rejectPost(
      createJsonRequest({
        jsonError: syntaxError,
        url: 'https://pico.mutx.dev/api/pico/approvals/req_123/reject',
      }),
      { params: Promise.resolve({ requestId: 'req_123' }) },
    )

    expect(rejectResponse.status).toBe(401)
    await expect(rejectResponse.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    expect(authenticatedFetch).not.toHaveBeenCalled()
  })
})
