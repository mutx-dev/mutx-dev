import {
  DEFAULT_SITE_URL,
  DEFAULT_APP_URL,
  DEFAULT_X_HANDLE,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  PUBLIC_MARKETING_ROUTES,
  BLOCKED_CRAWL_PREFIXES,
  getSiteUrl,
  getAppUrl,
  toAbsoluteSiteUrl,
  toAbsoluteAppUrl,
  getCanonicalUrl,
  getOgImageUrl,
} from '../../lib/seo'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

describe('seo defaults', () => {
  it('exports a valid default site URL', () => {
    expect(DEFAULT_SITE_URL).toBe('https://mutx.dev')
  })

  it('exports a valid default app URL', () => {
    expect(DEFAULT_APP_URL).toBe('https://app.mutx.dev')
  })

  it('exports a non-empty X handle', () => {
    expect(DEFAULT_X_HANDLE).toMatch(/^@/)
  })

  it('exports a default OG image path', () => {
    expect(DEFAULT_OG_IMAGE).toMatch(/^\//)
  })

  it('exports a non-empty OG image alt text', () => {
    expect(DEFAULT_OG_IMAGE_ALT).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// PUBLIC_MARKETING_ROUTES
// ---------------------------------------------------------------------------

describe('PUBLIC_MARKETING_ROUTES', () => {
  it('includes the homepage', () => {
    expect(PUBLIC_MARKETING_ROUTES).toContain('/')
  })

  it('includes key marketing pages', () => {
    const expected = ['/download', '/docs', '/security', '/contact', '/whitepaper']
    for (const route of expected) {
      expect(PUBLIC_MARKETING_ROUTES).toContain(route)
    }
  })

  it('all routes start with /', () => {
    for (const route of PUBLIC_MARKETING_ROUTES) {
      expect(route).toMatch(/^\//)
    }
  })

  it('excludes internal routes like /dashboard and /login', () => {
    expect(PUBLIC_MARKETING_ROUTES).not.toContain('/dashboard')
    expect(PUBLIC_MARKETING_ROUTES).not.toContain('/login')
    expect(PUBLIC_MARKETING_ROUTES).not.toContain('/onboarding')
  })
})

// ---------------------------------------------------------------------------
// BLOCKED_CRAWL_PREFIXES
// ---------------------------------------------------------------------------

describe('BLOCKED_CRAWL_PREFIXES', () => {
  it('blocks /api/ prefix', () => {
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/api/')
  })

  it('blocks /dashboard prefix', () => {
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/dashboard')
  })

  it('blocks auth-related prefixes', () => {
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/login')
    expect(BLOCKED_CRAWL_PREFIXES).toContain('/register')
  })

  it('all prefixes start with /', () => {
    for (const prefix of BLOCKED_CRAWL_PREFIXES) {
      expect(prefix).toMatch(/^\//)
    }
  })
})

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

describe('getSiteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('returns the default when env var is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL)
  })

  it('returns the env var value when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.mutx.dev'
    expect(getSiteUrl()).toBe('https://custom.mutx.dev')
  })

  it('strips trailing slash from env var', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mutx.dev/'
    expect(getSiteUrl()).toBe('https://mutx.dev')
  })
})

describe('getAppUrl', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }
  })

  it('returns the default when env var is unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(getAppUrl()).toBe(DEFAULT_APP_URL)
  })

  it('returns the env var value when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.staging.mutx.dev'
    expect(getAppUrl()).toBe('https://app.staging.mutx.dev')
  })
})

describe('toAbsoluteSiteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('builds absolute URL for a path', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(toAbsoluteSiteUrl('/docs')).toBe('https://mutx.dev/docs')
  })

  it('returns just the site URL for root path', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(toAbsoluteSiteUrl('/')).toBe('https://mutx.dev')
  })

  it('returns just the site URL when called with no args', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(toAbsoluteSiteUrl()).toBe('https://mutx.dev')
  })

  it('respects custom site URL from env', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.mutx.dev'
    expect(toAbsoluteSiteUrl('/about')).toBe('https://staging.mutx.dev/about')
  })
})

describe('toAbsoluteAppUrl', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }
  })

  it('builds absolute app URL for a path', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(toAbsoluteAppUrl('/dashboard')).toBe('https://app.mutx.dev/dashboard')
  })

  it('returns just the app URL for root path', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(toAbsoluteAppUrl('/')).toBe('https://app.mutx.dev')
  })
})

// ---------------------------------------------------------------------------
// Canonical and OG image helpers
// ---------------------------------------------------------------------------

describe('getCanonicalUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('delegates to toAbsoluteSiteUrl', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getCanonicalUrl('/pricing')).toBe('https://mutx.dev/pricing')
  })
})

describe('getOgImageUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = original
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('returns an absolute URL to the default OG image', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getOgImageUrl()).toBe(`https://mutx.dev${DEFAULT_OG_IMAGE}`)
  })
})
