import { metadata as picoRootMetadata } from '../../app/pico/page'

jest.mock('@/components/pico/PicoLandingSurface', () => ({
  PicoLandingSurface: () => null,
}))

describe('pico root metadata', () => {
  it('keeps social image URLs on the reachable root host', () => {
    const openGraphImages = picoRootMetadata.openGraph?.images
    const twitterImages = picoRootMetadata.twitter?.images

    expect(openGraphImages).toEqual([
      expect.stringContaining('https://mutx.dev/opengraph-image?'),
    ])
    expect(openGraphImages).toEqual([expect.stringContaining('path=%2Fpico')])

    expect(twitterImages).toEqual([
      expect.stringContaining('https://mutx.dev/twitter-image?'),
    ])
    expect(twitterImages).toEqual([expect.stringContaining('path=%2Fpico')])
  })
})
