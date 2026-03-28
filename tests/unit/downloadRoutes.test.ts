const fetchLatestStableDesktopRelease = jest.fn()

jest.mock('../../lib/desktopRelease', () => ({
  MUTX_GITHUB_RELEASES_URL: 'https://github.com/mutx-dev/mutx-dev/releases',
  MUTX_RELEASE_NOTES_URL: 'https://docs.mutx.dev/docs/releases/v1.3',
  buildReleaseNotesUrl: (version: string) => `https://docs.mutx.dev/docs/releases/v${version.split('.').slice(0, 2).join('.')}`,
  fetchLatestStableDesktopRelease,
}))

describe('download routes', () => {
  beforeEach(() => {
    jest.resetModules()
    fetchLatestStableDesktopRelease.mockReset()
  })

  it('redirects the Apple Silicon route to the stable DMG asset', async () => {
    fetchLatestStableDesktopRelease.mockResolvedValue({
      tagName: 'v1.3.0',
      version: '1.3.0',
      htmlUrl: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
      assets: {
        arm64Dmg: 'https://downloads.example.com/MUTX-1.3.0-macos-arm64.dmg',
        x64Dmg: 'https://downloads.example.com/MUTX-1.3.0-macos-x64.dmg',
        arm64Zip: 'https://downloads.example.com/MUTX-1.3.0-macos-arm64.zip',
        x64Zip: 'https://downloads.example.com/MUTX-1.3.0-macos-x64.zip',
        checksums: 'https://downloads.example.com/MUTX-1.3.0-SHA256SUMS.txt',
      },
    })

    const { GET } = await import('../../app/download/macos/arm64/route')
    const response = await GET()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://downloads.example.com/MUTX-1.3.0-macos-arm64.dmg',
    )
  })

  it('falls back to the release page when the Intel asset is missing', async () => {
    fetchLatestStableDesktopRelease.mockResolvedValue({
      tagName: 'v1.3.0',
      version: '1.3.0',
      htmlUrl: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
      assets: {
        arm64Dmg: 'https://downloads.example.com/MUTX-1.3.0-macos-arm64.dmg',
        x64Dmg: null,
        arm64Zip: 'https://downloads.example.com/MUTX-1.3.0-macos-arm64.zip',
        x64Zip: null,
        checksums: 'https://downloads.example.com/MUTX-1.3.0-SHA256SUMS.txt',
      },
    })

    const { GET } = await import('../../app/download/macos/intel/route')
    const response = await GET()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
    )
  })

  it('falls back to the GitHub releases page when release lookup fails', async () => {
    fetchLatestStableDesktopRelease.mockResolvedValue({
      tagName: 'v1.3.0',
      version: '1.3.0',
      htmlUrl: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
      assets: {
        arm64Dmg: 'https://downloads.example.com/MUTX-1.3.0-macos-arm64.dmg',
        x64Dmg: 'https://downloads.example.com/MUTX-1.3.0-macos-x64.dmg',
        arm64Zip: 'https://downloads.example.com/MUTX-1.3.0-macos-arm64.zip',
        x64Zip: 'https://downloads.example.com/MUTX-1.3.0-macos-x64.zip',
        checksums: 'https://downloads.example.com/MUTX-1.3.0-SHA256SUMS.txt',
      },
    })

    const { GET } = await import('../../app/download/macos/release-notes/route')
    const response = await GET()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://docs.mutx.dev/docs/releases/v1.3')
  })

  it('falls back to the current GitBook release notes page when release lookup fails', async () => {
    fetchLatestStableDesktopRelease.mockResolvedValue(null)

    const { GET } = await import('../../app/download/macos/release-notes/route')
    const response = await GET()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://docs.mutx.dev/docs/releases/v1.3')
  })
})
