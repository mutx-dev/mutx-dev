/**
 * Tests for lib/marketingContent.ts — structural validation of marketing constants.
 */

import {
  marketingHomepage,
  marketingPublicRailLinks,
  marketingFooterLinks,
  marketingFooterCallout,
} from '../../lib/marketingContent'

// ---------------------------------------------------------------------------
// marketingHomepage
// ---------------------------------------------------------------------------
describe('marketingHomepage', () => {
  it('has a hero section with required fields', () => {
    expect(marketingHomepage.hero).toBeDefined()
    expect(typeof marketingHomepage.hero.tagline).toBe('string')
    expect(marketingHomepage.hero.tagline.length).toBeGreaterThan(0)
    expect(typeof marketingHomepage.hero.title).toBe('string')
    expect(marketingHomepage.hero.title.length).toBeGreaterThan(0)
    expect(typeof marketingHomepage.hero.backgroundSrc).toBe('string')
    expect(typeof marketingHomepage.hero.backgroundAlt).toBe('string')
    expect(marketingHomepage.hero.backgroundAlt.length).toBeGreaterThan(0)
    expect(Array.isArray(marketingHomepage.hero.actions)).toBe(true)
    expect(marketingHomepage.hero.actions.length).toBeGreaterThan(0)
  })

  it('hero actions are valid MarketingActionLink objects', () => {
    for (const action of marketingHomepage.hero.actions) {
      expect(typeof action.label).toBe('string')
      expect(typeof action.href).toBe('string')
      expect(action.href.length).toBeGreaterThan(0)
    }
  })

  it('has salesSections with required sub-sections', () => {
    expect(marketingHomepage.salesSections).toBeDefined()
    expect(marketingHomepage.salesSections.demo).toBeDefined()
    expect(marketingHomepage.salesSections.examples).toBeDefined()
    expect(marketingHomepage.salesSections.proof).toBeDefined()
    expect(marketingHomepage.salesSections.cta).toBeDefined()
  })

  it('demo section uses real dashboard story media and supporting proof assets', () => {
    const tabs = marketingHomepage.salesSections.demo.tabs
    const story = marketingHomepage.salesSections.demo.story
    expect(Array.isArray(tabs)).toBe(true)
    expect(tabs.length).toBeGreaterThan(0)
    expect(new Set(tabs.map((tab) => tab.mediaSrc)).size).toBe(tabs.length)
    expect(story.mediaSrc.startsWith('/marketing/dashboard/')).toBe(true)
    expect(story.mediaSrc.endsWith('.mp4')).toBe(true)
    expect(story.mediaPosterSrc?.startsWith('/marketing/dashboard/')).toBe(true)
    for (const tab of tabs) {
      expect(['image', 'video']).toContain(tab.mediaType)
      expect(tab.mediaSrc.startsWith('/marketing/dashboard/')).toBe(true)
      if (tab.mediaType === 'image') {
        expect(tab.mediaSrc.endsWith('.jpg')).toBe(true)
        expect(tab.mediaPosterSrc).toBeUndefined()
      } else {
        expect(tab.mediaSrc.endsWith('.mp4')).toBe(true)
        expect(tab.mediaPosterSrc?.startsWith('/marketing/dashboard/')).toBe(true)
      }
      expect(typeof tab.label).toBe('string')
    }
  })

  it('examples section has items with required fields', () => {
    const items = marketingHomepage.salesSections.examples.items
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(typeof item.eyebrow).toBe('string')
      expect(typeof item.title).toBe('string')
      expect(Array.isArray(item.apology)).toBe(true)
      expect(typeof item.fallout).toBe('string')
    }
  })

  it('proof section has before/after items', () => {
    const items = marketingHomepage.salesSections.proof.items
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(typeof item.title).toBe('string')
      expect(typeof item.before).toBe('string')
      expect(typeof item.after).toBe('string')
    }
  })

  it('cta section has actions and media', () => {
    const cta = marketingHomepage.salesSections.cta
    expect(Array.isArray(cta.actions)).toBe(true)
    expect(typeof cta.mediaSrc).toBe('string')
    expect(typeof cta.mediaAlt).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// marketingPublicRailLinks
// ---------------------------------------------------------------------------
describe('marketingPublicRailLinks', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(marketingPublicRailLinks)).toBe(true)
    expect(marketingPublicRailLinks.length).toBeGreaterThan(0)
  })

  it('each link has label and href', () => {
    for (const link of marketingPublicRailLinks) {
      expect(typeof link.label).toBe('string')
      expect(typeof link.href).toBe('string')
      expect(link.label.length).toBeGreaterThan(0)
      expect(link.href.length).toBeGreaterThan(0)
    }
  })

  it('external flag is boolean when present', () => {
    for (const link of marketingPublicRailLinks) {
      if (link.external !== undefined) {
        expect(typeof link.external).toBe('boolean')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// marketingFooterLinks
// ---------------------------------------------------------------------------
describe('marketingFooterLinks', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(marketingFooterLinks)).toBe(true)
    expect(marketingFooterLinks.length).toBeGreaterThan(0)
  })

  it('each link has label and href', () => {
    for (const link of marketingFooterLinks) {
      expect(typeof link.label).toBe('string')
      expect(typeof link.href).toBe('string')
      expect(link.label.length).toBeGreaterThan(0)
      expect(link.href.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// marketingFooterCallout
// ---------------------------------------------------------------------------
describe('marketingFooterCallout', () => {
  it('has title, body, and action fields', () => {
    expect(typeof marketingFooterCallout.title).toBe('string')
    expect(marketingFooterCallout.title.length).toBeGreaterThan(0)
    expect(typeof marketingFooterCallout.body).toBe('string')
    expect(marketingFooterCallout.body.length).toBeGreaterThan(0)
    expect(typeof marketingFooterCallout.action).toBe('object')
  })

  it('action has label and href', () => {
    expect(typeof marketingFooterCallout.action.label).toBe('string')
    expect(typeof marketingFooterCallout.action.href).toBe('string')
  })
})
