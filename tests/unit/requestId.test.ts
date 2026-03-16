import { NextRequest, NextResponse } from 'next/server'

import { generateRequestId, middleware } from '../../middleware'

function mockApiRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers })
}

describe('generateRequestId', () => {
  it('returns a UUID v4 string', () => {
    const id = generateRequestId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('returns a unique ID on each call', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateRequestId()))
    expect(ids.size).toBe(20)
  })
})

describe('middleware request ID tracking', () => {
  it('adds X-Request-ID header to API route responses', () => {
    const request = mockApiRequest('http://localhost:3000/api/agents')
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-Request-ID')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('propagates an incoming X-Request-ID on API routes', () => {
    const existingId = 'a1b2c3d4-e5f6-4789-8abc-def012345678'
    const request = mockApiRequest('http://localhost:3000/api/agents', {
      'x-request-id': existingId,
    })
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-Request-ID')).toBe(existingId)
  })

  it('adds X-Request-ID header to page route responses', () => {
    const request = mockApiRequest('http://localhost:3000/dashboard')
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-Request-ID')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('propagates an incoming X-Request-ID on page routes', () => {
    const existingId = 'b2c3d4e5-f6a7-4890-9bcd-ef0123456789'
    const request = mockApiRequest('http://localhost:3000/dashboard', {
      'x-request-id': existingId,
    })
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-Request-ID')).toBe(existingId)
  })

  it('generates different IDs for different requests', () => {
    const req1 = mockApiRequest('http://localhost:3000/api/agents')
    const req2 = mockApiRequest('http://localhost:3000/api/agents')

    const res1 = middleware(req1) as NextResponse
    const res2 = middleware(req2) as NextResponse

    const id1 = res1.headers.get('X-Request-ID')
    const id2 = res2.headers.get('X-Request-ID')

    expect(id1).not.toBe(id2)
  })

  it('passes through static file requests without adding X-Request-ID', () => {
    const request = mockApiRequest('http://localhost:3000/_next/static/chunk.js')
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-Request-ID')).toBeNull()
  })

  it('still applies rate-limit headers on non-API page routes', () => {
    const request = mockApiRequest('http://localhost:3000/dashboard')
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    expect(response.headers.get('X-RateLimit-Remaining')).not.toBeNull()
    expect(response.headers.get('X-RateLimit-Reset')).not.toBeNull()
  })

  it('does not add rate-limit headers on API routes', () => {
    const request = mockApiRequest('http://localhost:3000/api/agents')
    const response = middleware(request) as NextResponse

    expect(response.headers.get('X-RateLimit-Limit')).toBeNull()
    expect(response.headers.get('X-RateLimit-Remaining')).toBeNull()
    expect(response.headers.get('X-RateLimit-Reset')).toBeNull()
  })
})

describe('withErrorHandling request ID logging', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('logs the request ID when an error is thrown', async () => {
    const { withErrorHandling } = await import('../../app/api/_lib/errors')
    const requestId = 'deadbeef-dead-4eef-8ead-deadbeef0001'

    const handler = withErrorHandling(async () => {
      throw new Error('boom')
    })

    await handler(
      new Request('http://localhost/api/test', {
        headers: { 'x-request-id': requestId },
      })
    )

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(requestId),
      expect.any(Error)
    )
  })

  it('logs without a prefix when no request ID is present', async () => {
    const { withErrorHandling } = await import('../../app/api/_lib/errors')

    const handler = withErrorHandling(async () => {
      throw new Error('no-id')
    })

    await handler(new Request('http://localhost/api/test'))

    expect(console.error).toHaveBeenCalledWith(
      'Route handler error:',
      expect.any(Error)
    )
  })
})
