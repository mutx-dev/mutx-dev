import { NextResponse } from 'next/server'

jest.spyOn(console, "error").mockImplementation(() => {})

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return actual
})

import {
  getRequestedVersion,
  addVersionHeaders,
  withVersionedHandler,
  CURRENT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  _setDeprecatedApiVersionsForTesting,
  _resetDeprecatedApiVersionsForTesting,
} from '../../app/api/_lib/versioning'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, headers: Record<string, string> = {}): Pick<Request, 'url' | 'headers'> {
  return {
    url,
    headers: {
      get(name: string) {
        return headers[name] ?? null
      },
    } as unknown as Headers,
  }
}

// ---------------------------------------------------------------------------
// getRequestedVersion
// ---------------------------------------------------------------------------

describe('getRequestedVersion', () => {
  it('returns v1 when the URL path contains /api/v1/', () => {
    const request = makeRequest('http://localhost:3000/api/v1/agents')
    expect(getRequestedVersion(request)).toBe('v1')
  })

  it('returns CURRENT_API_VERSION for an unversioned URL', () => {
    const request = makeRequest('http://localhost:3000/api/agents')
    expect(getRequestedVersion(request)).toBe(CURRENT_API_VERSION)
  })

  it('returns version from Accept-Version header when no path version is present', () => {
    const request = makeRequest('http://localhost:3000/api/agents', {
      'Accept-Version': 'v1',
    })
    expect(getRequestedVersion(request)).toBe('v1')
  })

  it('prefers URL path version over Accept-Version header', () => {
    const request = makeRequest('http://localhost:3000/api/v1/agents', {
      'Accept-Version': 'v1',
    })
    expect(getRequestedVersion(request)).toBe('v1')
  })

  it('falls back to CURRENT_API_VERSION when Accept-Version header is unknown', () => {
    const request = makeRequest('http://localhost:3000/api/agents', {
      'Accept-Version': 'v99',
    })
    expect(getRequestedVersion(request)).toBe(CURRENT_API_VERSION)
  })
})

// ---------------------------------------------------------------------------
// addVersionHeaders
// ---------------------------------------------------------------------------

describe('addVersionHeaders', () => {
  it('adds X-API-Version header set to the provided version', () => {
    const response = NextResponse.json({ ok: true })
    addVersionHeaders(response, 'v1')
    expect(response.headers.get('X-API-Version')).toBe('v1')
  })

  it('adds X-API-Supported-Versions header containing supported versions', () => {
    const response = NextResponse.json({ ok: true })
    addVersionHeaders(response, 'v1')
    const header = response.headers.get('X-API-Supported-Versions')
    expect(header).not.toBeNull()
    for (const version of SUPPORTED_API_VERSIONS) {
      expect(header).toContain(version)
    }
  })

  it('defaults to CURRENT_API_VERSION when no version argument is given', () => {
    const response = NextResponse.json({ ok: true })
    addVersionHeaders(response)
    expect(response.headers.get('X-API-Version')).toBe(CURRENT_API_VERSION)
  })

  it('does NOT add Deprecation header for non-deprecated versions', () => {
    const response = NextResponse.json({ ok: true })
    addVersionHeaders(response, 'v1')
    // v1 is not in DEPRECATED_API_VERSIONS, so the header should be absent
    expect(response.headers.get('Deprecation')).toBeNull()
  })

  it('adds Deprecation: true for a deprecated version', () => {
    _setDeprecatedApiVersionsForTesting(['v1'])

    try {
      const response = NextResponse.json({ ok: true })
      addVersionHeaders(response, 'v1')
      expect(response.headers.get('Deprecation')).toBe('true')
    } finally {
      _resetDeprecatedApiVersionsForTesting()
    }
  })
})

// ---------------------------------------------------------------------------
// withVersionedHandler
// ---------------------------------------------------------------------------

describe('withVersionedHandler', () => {
  it('adds X-API-Version header to a successful response', async () => {
    const handler = async (_request: Request) => NextResponse.json({ ok: true })
    const wrapped = withVersionedHandler(handler)

    const request = makeRequest('http://localhost:3000/api/v1/agents') as Request
    const response = await wrapped(request)

    expect(response.headers.get('X-API-Version')).toBe('v1')
  })

  it('adds X-API-Supported-Versions to a successful response', async () => {
    const handler = async (_request: Request) => NextResponse.json({ data: [] })
    const wrapped = withVersionedHandler(handler)

    const request = makeRequest('http://localhost:3000/api/v1/agents') as Request
    const response = await wrapped(request)

    expect(response.headers.get('X-API-Supported-Versions')).not.toBeNull()
  })

  it('adds version headers even when the handler throws', async () => {
    const handler = async (_request: Request): Promise<NextResponse> => {
      throw new Error('something went wrong')
    }
    const wrapped = withVersionedHandler(handler)

    const request = makeRequest('http://localhost:3000/api/v1/agents') as Request
    const response = await wrapped(request)

    expect(response.status).toBe(500)
    expect(response.headers.get('X-API-Version')).toBe('v1')
  })

  it('returns a 500 JSON error body when the handler throws', async () => {
    const handler = async (_request: Request): Promise<NextResponse> => {
      throw new Error('boom')
    }
    const wrapped = withVersionedHandler(handler)

    const request = makeRequest('http://localhost:3000/api/agents') as Request
    const response = await wrapped(request)
    const body = await response.json()

    expect(body.status).toBe('error')
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
