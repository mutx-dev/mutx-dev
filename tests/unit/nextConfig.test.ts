import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getDocsPublicationManifest } from '../../lib/docs'

const repoRoot = path.resolve(__dirname, '../..')
const nextConfigUrl = pathToFileURL(path.join(repoRoot, 'next.config.mjs')).href
const configProbe = `
  import { createRequire } from 'node:module'
  import config from ${JSON.stringify(nextConfigUrl)}
  const require = createRequire(import.meta.url)
  const picomatch = require('next/dist/compiled/picomatch')
  const { normalizeAppPath } = require('next/dist/shared/lib/router/utils/app-paths')
  const docsRoute = normalizeAppPath('app/docs/[[...slug]]/page')
  const rewrites = await config.rewrites()
  const docsRouteIncludes = Object.entries(config.outputFileTracingIncludes)
    .filter(([glob]) => picomatch(glob, { dot: true, contains: true })(docsRoute))
    .flatMap(([, files]) => files)
  process.stdout.write(JSON.stringify({ rewrites, includes: config.outputFileTracingIncludes, docsRouteIncludes }))
`

function loadConfig(overrides: Record<string, string> = {}) {
  const env = { ...process.env }
  delete env.INTERNAL_API_URL
  delete env.NEXT_PUBLIC_API_URL
  Object.assign(env, overrides)

  return JSON.parse(execFileSync(
    process.execPath,
    ['--input-type=module', '-e', configProbe],
    { cwd: repoRoot, env, encoding: 'utf8' },
  )) as {
    rewrites: {
      beforeFiles: Array<{ source: string; destination: string }>
      afterFiles: Array<{ source: string; destination: string }>
      fallback: Array<{ source: string; destination: string }>
    }
    includes: Record<string, string[]>
    docsRouteIncludes: string[]
  }
}

describe('public Next.js deployment config', () => {
  it('keeps local API routes reachable when no upstream is configured and preserves configured proxying', () => {
    const localConfig = loadConfig()

    expect(localConfig.rewrites.beforeFiles).toEqual([
      { source: '/api/v1/:path*', destination: '/api/:path*' },
    ])
    expect(localConfig.rewrites.fallback).toEqual([])

    for (const key of ['INTERNAL_API_URL', 'NEXT_PUBLIC_API_URL']) {
      const upstreamConfig = loadConfig({ [key]: 'https://api.example.test' })

      expect(upstreamConfig.rewrites.beforeFiles).toEqual(localConfig.rewrites.beforeFiles)
      expect(upstreamConfig.rewrites.fallback).toEqual([
        { source: '/api/:path*', destination: 'https://api.example.test/:path*' },
      ])
    }

    const privateUpstream = loadConfig({
      INTERNAL_API_URL: 'http://api.internal:8000',
      NEXT_PUBLIC_API_URL: 'https://api.example.test',
    })
    expect(privateUpstream.rewrites.fallback).toEqual([
      { source: '/api/:path*', destination: 'http://api.internal:8000/:path*' },
    ])
  })

  it('includes published docs and the runtime fonts and assets needed by their routes', () => {
    const { includes, docsRouteIncludes } = loadConfig()
    const publicMarkdown = Array.from(new Set([
      './SUMMARY.md',
      ...getDocsPublicationManifest().docs.map((doc) => `./${doc.sourcePath}`),
    ])).sort()

    expect(includes['/docs/\\[\\[\\.\\.\\.slug\\]\\]']).toEqual(publicMarkdown)
    expect(docsRouteIncludes).toEqual(publicMarkdown)
    expect(includes['/sitemap.xml']).toEqual(publicMarkdown)
    expect(includes['/sdk']).toEqual(['./docs/sdk.md'])
    expect(includes['/support']).toEqual(['./support.md'])

    const socialFonts = ['./app/fonts/Geist-Bold.ttf', './app/fonts/Geist-Regular.ttf']
    expect(includes['/opengraph-image']).toEqual(socialFonts)
    expect(includes['/twitter-image']).toEqual(socialFonts)
    expect(includes['/api/og-image']).toEqual([
      ...socialFonts,
      './node_modules/harfbuzzjs/hb.wasm',
    ])
  })
})
