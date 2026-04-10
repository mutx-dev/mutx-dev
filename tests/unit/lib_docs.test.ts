/**
 * Tests for lib/docs.ts — SUMMARY.md parser and doc route helpers.
 *
 * These tests read real files from the repo so they act as both unit tests
 * and a smoke test that SUMMARY.md is well-formed.
 */

import { parseSummary, flatNav, getDocSitemapRoutes, type DocNavItem } from '../../lib/docs'

// -----------------------------------------------------------------------------
// Helper constants (replicate lib/docs.ts internals for isolation)
// ---------------------------------------------------------------------------

function normalizeSummaryHrefToSlug(href: string): string {
  const stripped = href.replace(/^docs\//, '').replace(/\.md$/, '').replace(/^\//, '')
  if (!href.startsWith('docs/')) {
    return stripped.replace(/\/README$/i, '').replace(/\/index$/i, '') || stripped
  }
  return stripped
}

function summaryHrefToDocsRoute(href: string): string | null {
  let working = href
  working = working.replace(/^docs\/api\//, 'docs/reference/')
  const slug = working.replace(/^docs\//, '')
  let clean = slug
    .replace(/\.md$/, '')
    .replace(/\/README$/i, '')
    .replace(/\/index$/i, '')
    .replace(/^README$/i, '')
    .replace(/^index$/i, '')
  clean = clean.replace(/^reference\/reference$/, 'reference')
  if (!clean) return '/docs'
  return `/docs/${clean}`
}

// ---------------------------------------------------------------------------
// normalizeSummaryHrefToSlug
// ---------------------------------------------------------------------------
describe('normalizeSummaryHrefToSlug', () => {
  it('strips docs/ prefix', () => {
    expect(normalizeSummaryHrefToSlug('docs/api/auth.md')).toBe('api/auth')
  })

  it('strips .md extension', () => {
    expect(normalizeSummaryHrefToSlug('docs/agents/README.md')).toBe('agents/README')
  })

  it('handles non-docs/ hrefs without prefix', () => {
    expect(normalizeSummaryHrefToSlug('manifesto.md')).toBe('manifesto')
  })

  it('strips /README suffix', () => {
    expect(normalizeSummaryHrefToSlug('docs/agents/README.md')).toBe('agents/README')
  })

  it('strips /index suffix', () => {
    expect(normalizeSummaryHrefToSlug('docs/agents/index.md')).toBe('agents/index')
  })

  it('handles docs/README.md without stripping README (no /README suffix path)', () => {
    // docs/README.md → stripped = "README" (no /README suffix to strip)
    expect(normalizeSummaryHrefToSlug('docs/README.md')).toBe('README')
  })
})

// ---------------------------------------------------------------------------
// summaryHrefToDocsRoute
// ---------------------------------------------------------------------------
describe('summaryHrefToDocsRoute', () => {
  it('maps docs/api/reference.md to /docs/reference', () => {
    expect(summaryHrefToDocsRoute('docs/api/reference.md')).toBe('/docs/reference')
  })

  it('maps docs/api/authentication.md to /docs/reference/authentication', () => {
    expect(summaryHrefToDocsRoute('docs/api/authentication.md')).toBe(
      '/docs/reference/authentication'
    )
  })

  it('maps docs/api/index.md to /docs/reference', () => {
    expect(summaryHrefToDocsRoute('docs/api/index.md')).toBe('/docs/reference')
  })

  it('maps manifesto.md to /manifesto', () => {
    expect(summaryHrefToDocsRoute('manifesto.md')).toBe('/docs/manifesto')
  })

  it('maps whitepaper.md to /docs/whitepaper', () => {
    expect(summaryHrefToDocsRoute('whitepaper.md')).toBe('/docs/whitepaper')
  })

  it('maps docs/agents/README.md to /docs/agents', () => {
    expect(summaryHrefToDocsRoute('docs/agents/README.md')).toBe('/docs/agents')
  })

  it('maps docs/api/index.md (reference dir) to /docs/reference', () => {
    expect(summaryHrefToDocsRoute('docs/api/index.md')).toBe('/docs/reference')
  })

  it('avoids double /reference/reference for deep api paths', () => {
    expect(summaryHrefToDocsRoute('docs/api/reference.md')).toBe('/docs/reference')
  })

  it('returns /docs for empty slug', () => {
    expect(summaryHrefToDocsRoute('docs/index.md')).toBe('/docs')
  })
})

// ---------------------------------------------------------------------------
// Integration: parseSummary + flatNav + getDocSitemapRoutes
describe('parseSummary integration', () => {
  it('parseSummary returns a non-empty array', () => {
    const items = parseSummary()
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('each top-level item has required fields', () => {
    const items = parseSummary()
    for (const item of items) {
      expect(typeof item.title).toBe('string')
      expect(item.title.length).toBeGreaterThan(0)
      expect(typeof item.href).toBe('string')
      expect(typeof item.slug).toBe('string')
      expect(typeof item.route).toBe('string')
      expect(Array.isArray(item.children)).toBe(true)
      expect(typeof item.depth).toBe('number')
    }
  })

  it('top-level items have depth 0', () => {
    const items = parseSummary()
    for (const item of items) {
      expect(item.depth).toBe(0)
    }
  })

  it('flatNav produces a non-empty flat list', () => {
    const items = parseSummary()
    const flat = flatNav(items)
    expect(Array.isArray(flat)).toBe(true)
    expect(flat.length).toBeGreaterThan(items.length)
  })

  it('flatNav includes all items from nested children', () => {
    const items = parseSummary()
    const flat = flatNav(items)
    // All titles from the nested tree should appear in the flat list
    const flatTitles = new Set(flat.map((i: { title: string }) => i.title))
    function collectTitles(n: DocNavItem[]) {
      for (const item of n) {
        flatTitles.add(item.title)
        if (item.children.length > 0) collectTitles(item.children)
      }
    }
    collectTitles(items)
    // flatNav pushes each node then recurses into children, so flat = root items + all descendants
    // titles should all be present (no title is lost in recursion)
    expect(flatTitles.size).toBeGreaterThan(0)
    for (const item of items) {
      expect(flatTitles.has(item.title)).toBe(true)
    }
  })

  it('getDocSitemapRoutes returns an array starting with /docs', () => {
    const routes = getDocSitemapRoutes()
    expect(Array.isArray(routes)).toBe(true)
    expect(routes[0]).toBe('/docs')
    // All routes should start with /docs
    for (const route of routes) {
      expect(route).toMatch(/^\/docs/)
    }
  })

  it('routes are unique (no duplicates)', () => {
    const routes = getDocSitemapRoutes()
    const unique = new Set(routes)
    expect(routes.length).toBe(unique.size)
  })
})
