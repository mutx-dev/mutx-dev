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
    expect(typeof marketingHomepage.hero.chapterLabel).toBe('string')
    expect(marketingHomepage.hero.chapterLabel.length).toBeGreaterThan(0)
    expect(typeof marketingHomepage.hero.backgroundSrc).toBe('string')
    expect(typeof marketingHomepage.hero.backgroundAlt).toBe('string')
    expect(marketingHomepage.hero.backgroundAlt.length).toBeGreaterThan(0)
    expect(Array.isArray(marketingHomepage.hero.ledger)).toBe(true)
    expect(marketingHomepage.hero.ledger.length).toBeGreaterThan(0)
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

  it('has the rewritten narrative sections', () => {
    expect(marketingHomepage.chapters).toBeDefined()
    expect(marketingHomepage.incidents).toBeDefined()
    expect(marketingHomepage.controlRoom).toBeDefined()
    expect(marketingHomepage.entryPoints).toBeDefined()
    expect(marketingHomepage.cta).toBeDefined()
  })

  it('chapters have narrative content and media', () => {
    const items = marketingHomepage.chapters.items
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(typeof item.chapter).toBe('string')
      expect(typeof item.kicker).toBe('string')
      expect(typeof item.title).toBe('string')
      expect(typeof item.imageSrc).toBe('string')
      expect(Array.isArray(item.beats)).toBe(true)
      expect(item.beats.length).toBeGreaterThan(0)
    }
  })

  it('incident section has case files with trigger and log', () => {
    const items = marketingHomepage.incidents.items
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(typeof item.label).toBe('string')
      expect(typeof item.title).toBe('string')
      expect(typeof item.trigger).toBe('string')
      expect(Array.isArray(item.log)).toBe(true)
      expect(item.log.length).toBeGreaterThan(0)
      expect(typeof item.resolution).toBe('string')
    }
  })

  it('control room has pillars and media', () => {
    const controlRoom = marketingHomepage.controlRoom
    expect(typeof controlRoom.mediaSrc).toBe('string')
    expect(typeof controlRoom.mediaAlt).toBe('string')
    expect(Array.isArray(controlRoom.pillars)).toBe(true)
    expect(controlRoom.pillars.length).toBeGreaterThan(0)
    for (const pillar of controlRoom.pillars) {
      expect(typeof pillar.label).toBe('string')
      expect(typeof pillar.title).toBe('string')
      expect(typeof pillar.body).toBe('string')
    }
  })

  it('entry points expose navigable choices', () => {
    const items = marketingHomepage.entryPoints.items
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(typeof item.label).toBe('string')
      expect(typeof item.title).toBe('string')
      expect(typeof item.body).toBe('string')
      expect(typeof item.href).toBe('string')
    }
  })

  it('cta section has actions, quote, and media', () => {
    const cta = marketingHomepage.cta
    expect(Array.isArray(cta.actions)).toBe(true)
    expect(typeof cta.quote).toBe('string')
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
