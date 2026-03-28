import {
  buildDesktopArtifactName,
  buildReleaseNotesUrl,
  fetchLatestStableDesktopRelease,
  findLatestStableAppRelease,
  normalizeDesktopRelease,
} from '../../lib/desktopRelease'

describe('desktop release resolver', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('selects the latest stable app release and ignores prereleases, drafts, and cli tags', () => {
    const release = findLatestStableAppRelease([
      {
        tag_name: 'cli-v1.3.0',
        draft: false,
        prerelease: false,
        html_url: 'https://github.com/mutx-dev/mutx-dev/releases/tag/cli-v1.3.0',
        assets: [],
      },
      {
        tag_name: 'v1.3.0-beta.1',
        draft: false,
        prerelease: true,
        html_url: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0-beta.1',
        assets: [],
      },
      {
        tag_name: 'v1.2.9',
        draft: false,
        prerelease: false,
        html_url: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.2.9',
        assets: [],
      },
      {
        tag_name: 'v1.3.0',
        draft: false,
        prerelease: false,
        html_url: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
        assets: [],
      },
      {
        tag_name: 'v1.4.0',
        draft: true,
        prerelease: false,
        html_url: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.4.0',
        assets: [],
      },
    ])

    expect(release?.tag_name).toBe('v1.3.0')
  })

  it('normalizes the expected desktop asset names for a stable release', () => {
    const release = normalizeDesktopRelease({
      tag_name: 'v1.3.0',
      draft: false,
      prerelease: false,
      html_url: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
      assets: [
        {
          name: buildDesktopArtifactName('1.3.0', 'arm64-dmg'),
          browser_download_url: 'https://downloads.example.com/mutx-arm64.dmg',
        },
        {
          name: buildDesktopArtifactName('1.3.0', 'x64-dmg'),
          browser_download_url: 'https://downloads.example.com/mutx-x64.dmg',
        },
        {
          name: buildDesktopArtifactName('1.3.0', 'arm64-zip'),
          browser_download_url: 'https://downloads.example.com/mutx-arm64.zip',
        },
        {
          name: buildDesktopArtifactName('1.3.0', 'x64-zip'),
          browser_download_url: 'https://downloads.example.com/mutx-x64.zip',
        },
        {
          name: buildDesktopArtifactName('1.3.0', 'checksums'),
          browser_download_url: 'https://downloads.example.com/MUTX-1.3.0-SHA256SUMS.txt',
        },
      ],
    })

    expect(release).toEqual({
      tagName: 'v1.3.0',
      version: '1.3.0',
      htmlUrl: 'https://github.com/mutx-dev/mutx-dev/releases/tag/v1.3.0',
      assets: {
        arm64Dmg: 'https://downloads.example.com/mutx-arm64.dmg',
        x64Dmg: 'https://downloads.example.com/mutx-x64.dmg',
        arm64Zip: 'https://downloads.example.com/mutx-arm64.zip',
        x64Zip: 'https://downloads.example.com/mutx-x64.zip',
        checksums: 'https://downloads.example.com/MUTX-1.3.0-SHA256SUMS.txt',
      },
    })
  })

  it('maps stable app releases to the GitBook-backed major.minor release notes page', () => {
    expect(buildReleaseNotesUrl('1.3.0')).toBe('https://docs.mutx.dev/docs/v1.3')
  })

  it('returns null when the GitHub releases lookup fails', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'upstream unavailable' }), { status: 503 }),
    )

    await expect(fetchLatestStableDesktopRelease()).resolves.toBeNull()
    expect(fetchSpy).toHaveBeenCalled()
  })
})
