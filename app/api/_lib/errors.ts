import { NextResponse } from 'next/server'

export type ApiError = {
  status: 'error'
  error: {
    code: string
    message: string
    details?: unknown
  }
}

// Factory functions for common errors
export function badRequest(message: string, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'BAD_REQUEST', message, details },
    },
    { status: 400 }
  )
}

export function unauthorized(message = 'Unauthorized'): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'UNAUTHORIZED', message },
    },
    { status: 401 }
  )
}

export function forbidden(message = 'Forbidden'): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'FORBIDDEN', message },
    },
    { status: 403 }
  )
}

export function notFound(resource = 'Resource'): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'NOT_FOUND', message: `${resource} not found` },
    },
    { status: 404 }
  )
}

export function methodNotAllowed(method: string): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${method} not allowed` },
    },
    { status: 405 }
  )
}

export function internalError(message = 'Internal server error', details?: unknown): NextResponse<ApiError> {
  console.error('API Error:', message, details)
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'INTERNAL_ERROR', message, details: process.env.NODE_ENV === 'development' ? details : undefined },
    },
    { status: 500 }
  )
}

export function serviceUnavailable(message = 'Service temporarily unavailable'): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'SERVICE_UNAVAILABLE', message },
    },
    { status: 503 }
  )
}

export function tooManyRequests(message = 'Rate limit exceeded'): NextResponse<ApiError> {
  return NextResponse.json(
    {
      status: 'error',
      error: { code: 'RATE_LIMITED', message },
    },
    { status: 429 }
  )
}

// Async handler wrapper with error handling
export function withErrorHandling(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async function (request: Request): Promise<NextResponse> {
    try {
      return await handler(request)
    } catch (error) {
      console.error('Route handler error:', error)

      if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
        return badRequest('Invalid JSON in request body')
      }

      return internalError('An unexpected error occurred')
    }
  }
}
