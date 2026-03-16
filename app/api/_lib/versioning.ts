import { NextResponse } from 'next/server'

/** All known API versions. */
export const API_VERSIONS = {
  v1: 'v1',
} as const

/** A valid API version string (e.g. `'v1'`). */
export type ApiVersion = keyof typeof API_VERSIONS

/** The version that all unversioned requests are implicitly treated as. */
export const CURRENT_API_VERSION: ApiVersion = 'v1'

/** Versions that the server actively supports. */
export const SUPPORTED_API_VERSIONS: ApiVersion[] = ['v1']

/** Versions that are still accepted but will be removed in a future release. */
export const DEPRECATED_API_VERSIONS: ApiVersion[] = []

/**
 * Extracts the requested API version from an incoming request.
 *
 * Resolution order:
 * 1. URL path segment — `/api/(v\d+)/`
 * 2. `Accept-Version` request header
 * 3. Falls back to `CURRENT_API_VERSION`
 */
export function getRequestedVersion(request: Pick<Request, 'url' | 'headers'>): ApiVersion {
  // 1. Try URL path, e.g. /api/v1/agents
  const urlMatch = request.url.match(/\/api\/(v\d+)\//)
  if (urlMatch) {
    const candidate = urlMatch[1] as string
    if (candidate in API_VERSIONS) {
      return candidate as ApiVersion
    }
  }

  // 2. Try Accept-Version header
  const headerVersion = request.headers.get('Accept-Version')
  if (headerVersion && headerVersion in API_VERSIONS) {
    return headerVersion as ApiVersion
  }

  // 3. Default
  return CURRENT_API_VERSION
}

/**
 * Mutates (and returns) a `NextResponse` by adding API versioning headers.
 *
 * Headers set:
 * - `X-API-Version` — the resolved version for this response
 * - `X-API-Supported-Versions` — comma-separated list of all supported versions
 * - `Deprecation: true` — only when `version` is in `DEPRECATED_API_VERSIONS`
 */
export function addVersionHeaders(
  response: NextResponse,
  version: ApiVersion = CURRENT_API_VERSION
): NextResponse {
  response.headers.set('X-API-Version', version)
  response.headers.set('X-API-Supported-Versions', SUPPORTED_API_VERSIONS.join(', '))

  if ((DEPRECATED_API_VERSIONS as ApiVersion[]).includes(version)) {
    response.headers.set('Deprecation', 'true')
  }

  return response
}

/**
 * Higher-order function that wraps a route handler and automatically adds
 * API version headers to every response — including error responses.
 *
 * This is complementary to `withErrorHandling` in `errors.ts`; compose them
 * as needed rather than replacing one with the other.
 *
 * @example
 * export const GET = withVersionedHandler(async (request) => {
 *   return NextResponse.json({ ok: true })
 * })
 */
export function withVersionedHandler(
  handler: (request: Request) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse> {
  return async function (request: Request): Promise<NextResponse> {
    const version = getRequestedVersion(request)
    try {
      const response = await handler(request)
      return addVersionHeaders(response, version)
    } catch (error) {
      console.error('Versioned handler error:', error)
      const errorResponse = NextResponse.json(
        { status: 'error', error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
        { status: 500 }
      )
      return addVersionHeaders(errorResponse, version)
    }
  }
}
