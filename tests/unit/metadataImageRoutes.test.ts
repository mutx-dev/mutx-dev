import * as opengraphImageRoute from '../../app/opengraph-image'
import * as twitterImageRoute from '../../app/twitter-image'

describe('metadata image route config', () => {
  it('keeps the OG image route cacheable and statically configured', () => {
    expect(opengraphImageRoute.runtime).toBe('nodejs')
    expect(opengraphImageRoute.revalidate).toBe(3600)
    expect(opengraphImageRoute.contentType).toBe('image/png')
    expect(opengraphImageRoute.size).toEqual({ width: 1200, height: 630 })
  })

  it('keeps the Twitter image route cacheable and statically configured', () => {
    expect(twitterImageRoute.runtime).toBe('nodejs')
    expect(twitterImageRoute.revalidate).toBe(3600)
    expect(twitterImageRoute.contentType).toBe('image/png')
    expect(twitterImageRoute.size).toEqual({ width: 1200, height: 630 })
  })
})
