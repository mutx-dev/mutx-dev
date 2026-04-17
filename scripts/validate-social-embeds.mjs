import http from 'node:http'
import https from 'node:https'

const DEFAULT_BASE_URL = process.env.SOCIAL_EMBED_BASE_URL ?? 'http://127.0.0.1:3000'

const BOT_USER_AGENTS = [
  ['twitter', 'Twitterbot/1.0'],
  ['slack', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'],
  ['linkedin', 'LinkedInBot/1.0'],
  ['discord', 'Discordbot/2.0'],
  ['facebook', 'facebookexternalhit/1.1'],
  [
    'webkit_preview',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ],
]

const TARGETS = [
  { label: 'mutx-home', host: 'mutx.dev', path: '/' },
  { label: 'mutx-download', host: 'mutx.dev', path: '/download' },
  { label: 'mutx-docs', host: 'mutx.dev', path: '/docs' },
  { label: 'mutx-releases', host: 'mutx.dev', path: '/releases' },
  { label: 'mutx-contact', host: 'mutx.dev', path: '/contact' },
  { label: 'mutx-control-plane', host: 'mutx.dev', path: '/ai-agent-control-plane' },
  { label: 'app-control', host: 'app.mutx.dev', path: '/control' },
  { label: 'pico-home', host: 'pico.mutx.dev', path: '/' },
  { label: 'pico-academy', host: 'pico.mutx.dev', path: '/academy' },
  { label: 'pico-pricing', host: 'pico.mutx.dev', path: '/pricing' },
]

const REQUIRED_META_KEYS = [
  'og:title',
  'og:description',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
]

function buildLocalUrl(baseUrl, path) {
  const url = new URL(baseUrl)
  url.pathname = path
  url.search = ''
  return url.toString()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requestBuffer(url, headers, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const transport = parsed.protocol === 'https:' ? https : http
    const request = transport.request(
      parsed,
      {
        method: 'GET',
        headers,
      },
      (response) => {
        const chunks = []

        response.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk))
        })
        response.on('end', () => {
          const status = response.statusCode ?? 0
          const location = response.headers.location

          if (
            location &&
            [301, 302, 303, 307, 308].includes(status) &&
            redirectCount < 5
          ) {
            const nextUrl = new URL(location, parsed).toString()
            resolve(requestBuffer(nextUrl, headers, redirectCount + 1))
            return
          }

          resolve({
            status,
            headers: response.headers,
            body: Buffer.concat(chunks),
          })
        })
      },
    )

    request.on('error', reject)
    request.end()
  })
}

function extractMeta(html) {
  const tags = {}
  const metaRegex = /<meta\s+[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi

  for (const match of html.matchAll(metaRegex)) {
    const [, key, value] = match
    tags[key] = value
  }

  return tags
}

function readPngSize(buffer) {
  const signature = buffer.subarray(0, 8)
  const expectedSignature = [137, 80, 78, 71, 13, 10, 26, 10]
  const matchesSignature = expectedSignature.every((byte, index) => signature[index] === byte)

  if (!matchesSignature) {
    throw new Error('image is not a PNG')
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

async function fetchHtml({ baseUrl, host, path, userAgent }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await requestBuffer(buildLocalUrl(baseUrl, path), {
      Host: host,
      'User-Agent': userAgent,
    })

    if (response.status >= 200 && response.status < 300) {
      return response.body.toString('utf8')
    }

    if (attempt === 2) {
      throw new Error(`unexpected ${response.status} for ${host}${path}`)
    }

    await sleep(300)
  }
}

async function validateImage({ baseUrl, imageUrl }) {
  const parsed = new URL(imageUrl)
  const localUrl = new URL(baseUrl)
  localUrl.pathname = parsed.pathname
  localUrl.search = parsed.search

  const response = await requestBuffer(localUrl, {
    Host: parsed.host,
    'User-Agent': 'Twitterbot/1.0',
  })

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`image fetch failed with ${response.status}`)
  }

  const contentType = response.headers['content-type']
  if (contentType !== 'image/png') {
    throw new Error(`expected image/png, received ${contentType ?? 'unknown'}`)
  }

  const { width, height } = readPngSize(response.body)

  if (width !== 1200 || height !== 630) {
    throw new Error(`expected 1200x630 PNG, received ${width}x${height}`)
  }
}

async function validateTarget(baseUrl, target) {
  const failures = []
  let referenceMeta = null

  for (const [botName, userAgent] of BOT_USER_AGENTS) {
    const html = await fetchHtml({
      baseUrl,
      host: target.host,
      path: target.path,
      userAgent,
    })
    const meta = extractMeta(html)

    for (const key of REQUIRED_META_KEYS) {
      if (!meta[key]) {
        failures.push(`${botName}: missing ${key}`)
      }
    }

    if (!referenceMeta) {
      referenceMeta = meta
      continue
    }

    for (const key of ['og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
      if (referenceMeta[key] !== meta[key]) {
        failures.push(`${botName}: ${key} differs from first bot response`)
      }
    }
  }

  if (referenceMeta?.['og:image']) {
    await validateImage({ baseUrl, imageUrl: referenceMeta['og:image'] }).catch((error) => {
      failures.push(`image: ${error.message}`)
    })
  }

  return failures
}

async function main() {
  const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL
  let failureCount = 0

  console.log(`Validating social embeds against ${baseUrl}`)

  for (const target of TARGETS) {
    const failures = await validateTarget(baseUrl, target)

    if (failures.length === 0) {
      console.log(`PASS ${target.label} (${target.host}${target.path})`)
      continue
    }

    failureCount += failures.length
    console.error(`FAIL ${target.label} (${target.host}${target.path})`)
    for (const failure of failures) {
      console.error(`  - ${failure}`)
    }
  }

  if (failureCount > 0) {
    process.exitCode = 1
  }
}

await main()
