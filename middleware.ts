import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function getHostname(request: NextRequest) {
  return request.headers.get('host')?.split(':')[0]?.toLowerCase() || ''
}

function isAppHost(hostname: string) {
  return hostname === 'app.mutx.dev' || hostname === 'app.localhost'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHostname(request)

  if (!isAppHost(hostname)) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/android-chrome') ||
    pathname.startsWith('/site.webmanifest')
  ) {
    return NextResponse.next()
  }

  const rewriteUrl = request.nextUrl.clone()
  
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    return NextResponse.next()
  }
  
  rewriteUrl.pathname = pathname === '/' ? '/app' : `/app${pathname}`

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/', '/favicon.ico', '/robots.txt', '/sitemap.xml'],
}
