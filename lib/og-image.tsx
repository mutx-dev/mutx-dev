import { readFile } from 'fs/promises'
import { join } from 'path'

import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'

import type { SeoSurface, SocialSection } from '@/lib/seo'

type OgImageOptions = {
  title: string
  description?: string
  badge?: string
  host?: string
  surface?: SeoSurface
  section?: SocialSection
}

type CachedImageEntry = {
  png: Uint8Array
  expiresAt: number
}

type Theme = {
  background: string
  haloA: string
  haloB: string
  panel: string
  panelSoft: string
  stroke: string
  grid: string
  text: string
  muted: string
  accent: string
  accentSoft: string
  signal: string
  signalSoft: string
  band: string
  brandLabel: string
}

const WIDTH = 1200
const HEIGHT = 630
const DEFAULT_HOST = 'mutx.dev'
const IMAGE_CACHE_TTL_MS = 60 * 60 * 1000
const IMAGE_CACHE_MAX_ENTRIES = 200
const RENDER_RATE_LIMIT_WINDOW_MS = 60 * 1000
const RENDER_RATE_LIMIT_MAX = 120

const SURFACE_THEMES: Record<SeoSurface, Theme> = {
  marketing: {
    background: 'linear-gradient(135deg, #040912 0%, #0a1323 48%, #110d19 100%)',
    haloA: 'rgba(109, 225, 255, 0.22)',
    haloB: 'rgba(255, 93, 93, 0.18)',
    panel: 'rgba(9, 16, 28, 0.88)',
    panelSoft: 'rgba(10, 18, 32, 0.64)',
    stroke: 'rgba(109, 225, 255, 0.18)',
    grid: 'rgba(109, 225, 255, 0.08)',
    text: '#f7fbff',
    muted: '#96a8bf',
    accent: '#6de1ff',
    accentSoft: 'rgba(109, 225, 255, 0.14)',
    signal: '#ff5d5d',
    signalSoft: 'rgba(255, 93, 93, 0.18)',
    band: 'linear-gradient(90deg, #ff5d5d 0%, #6de1ff 52%, #ff5d5d 100%)',
    brandLabel: 'OPEN CONTROL FOR DEPLOYED AGENTS',
  },
  app: {
    background: 'linear-gradient(135deg, #0b1118 0%, #121a26 38%, #17141f 100%)',
    haloA: 'rgba(125, 211, 252, 0.18)',
    haloB: 'rgba(251, 191, 36, 0.14)',
    panel: 'rgba(17, 24, 36, 0.9)',
    panelSoft: 'rgba(19, 26, 39, 0.7)',
    stroke: 'rgba(125, 211, 252, 0.16)',
    grid: 'rgba(148, 163, 184, 0.1)',
    text: '#f8fafc',
    muted: '#a4b3c3',
    accent: '#7dd3fc',
    accentSoft: 'rgba(125, 211, 252, 0.14)',
    signal: '#fbbf24',
    signalSoft: 'rgba(251, 191, 36, 0.2)',
    band: 'linear-gradient(90deg, #fbbf24 0%, #7dd3fc 50%, #fbbf24 100%)',
    brandLabel: 'OPERATOR SURFACE FOR RUNTIME CONTROL',
  },
  pico: {
    background: 'linear-gradient(135deg, #fff7eb 0%, #ffe8da 38%, #edfdf5 100%)',
    haloA: 'rgba(249, 115, 22, 0.18)',
    haloB: 'rgba(16, 185, 129, 0.16)',
    panel: 'rgba(255, 255, 255, 0.76)',
    panelSoft: 'rgba(255, 255, 255, 0.46)',
    stroke: 'rgba(20, 51, 58, 0.12)',
    grid: 'rgba(20, 51, 58, 0.08)',
    text: '#14333a',
    muted: '#596f75',
    accent: '#f97316',
    accentSoft: 'rgba(249, 115, 22, 0.14)',
    signal: '#10b981',
    signalSoft: 'rgba(16, 185, 129, 0.16)',
    band: 'linear-gradient(90deg, #10b981 0%, #f97316 52%, #10b981 100%)',
    brandLabel: 'GUIDED BUILDER FOR SHIPPABLE STACKS',
  },
}

let geistRegular: ArrayBuffer | undefined
let geistBold: ArrayBuffer | undefined
const imageCache = new Map<string, CachedImageEntry>()
const inflightImageRenders = new Map<string, Promise<Uint8Array>>()
const renderTimestamps: number[] = []

async function loadFont(weight: 'regular' | 'bold' = 'regular'): Promise<ArrayBuffer> {
  if (weight === 'bold' && geistBold) return geistBold
  if (weight === 'regular' && geistRegular) return geistRegular

  const fileName = weight === 'bold' ? 'Geist-Bold.ttf' : 'Geist-Regular.ttf'
  const fontPath = join(process.cwd(), 'app/fonts', fileName)
  const buf = await readFile(fontPath)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer

  if (weight === 'bold') {
    geistBold = ab
  } else {
    geistRegular = ab
  }

  return ab
}

function trimCopy(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3).trimEnd()}...`
}

function getTheme(surface: SeoSurface = 'marketing') {
  return SURFACE_THEMES[surface]
}

function getSectionLabel(section: SocialSection, surface: SeoSurface) {
  const labels: Record<SocialSection, string> = {
    home: surface === 'pico' ? 'Guided Builder' : surface === 'app' ? 'Operator Surface' : 'Control Plane',
    docs: 'Docs Surface',
    download: 'Release Channel',
    releases: 'Ship Ledger',
    contact: 'Operator Contact',
    legal: 'Policy Layer',
    security: 'Security Posture',
    support: 'Support Lane',
    governance: 'Governance Controls',
    approvals: 'Human Gate',
    audit: 'Decision Ledger',
    control: surface === 'app' ? 'Control Deck' : 'Control Plane',
    cost: 'Budget Signal',
    deployment: 'Deploy Lane',
    guardrails: 'Runtime Guard',
    infrastructure: 'Stack Topology',
    monitoring: 'Runtime Signal',
    reliability: 'Failure Envelope',
    academy: 'Learning Track',
    tutor: 'Guided Tutor',
    autopilot: 'Assisted Autopilot',
    pricing: 'Plan Matrix',
    onboarding: 'First Run',
    manifesto: 'Manifest',
    roadmap: 'Roadmap',
    whitepaper: 'Briefing',
    sdk: 'SDK Surface',
    generic: surface === 'pico' ? 'PicoMUTX' : surface === 'app' ? 'App Surface' : 'MUTX Surface',
  }

  return labels[section]
}

function renderStackMotif(theme: Theme) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginLeft: index * 18,
            padding: '18px 20px',
            borderRadius: 24,
            background: theme.panel,
            border: `1px solid ${theme.stroke}`,
            boxShadow: `0 20px 48px ${theme.accentSoft}`,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: theme.signal }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: theme.accent }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '76%', height: 10, borderRadius: 999, background: theme.accentSoft }} />
            <div style={{ width: '92%', height: 10, borderRadius: 999, background: theme.stroke }} />
            <div style={{ width: '61%', height: 10, borderRadius: 999, background: theme.stroke }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function renderLedgerMotif(theme: Theme) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
      }}
    >
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 18px',
            borderRadius: 22,
            background: theme.panel,
            border: `1px solid ${theme.stroke}`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: index % 2 === 0 ? theme.signalSoft : theme.accentSoft,
              border: `1px solid ${index % 2 === 0 ? theme.signal : theme.accent}`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <div style={{ width: `${72 - index * 6}%`, height: 10, borderRadius: 999, background: theme.text }} />
            <div style={{ width: `${92 - index * 8}%`, height: 9, borderRadius: 999, background: theme.stroke }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function renderPanelMotif(theme: Theme) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        width: '100%',
        padding: 24,
        borderRadius: 28,
        background: theme.panel,
        border: `1px solid ${theme.stroke}`,
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 999, background: theme.signal }} />
        <div style={{ width: 14, height: 14, borderRadius: 999, background: theme.accent }} />
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1.1,
            padding: 18,
            borderRadius: 22,
            background: theme.panelSoft,
            border: `1px solid ${theme.stroke}`,
          }}
        >
          <div style={{ width: '72%', height: 10, borderRadius: 999, background: theme.accentSoft }} />
          <div style={{ width: '100%', height: 86, borderRadius: 18, background: theme.signalSoft }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: '54%', height: 10, borderRadius: 999, background: theme.stroke }} />
            <div style={{ width: '28%', height: 10, borderRadius: 999, background: theme.accentSoft }} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 0.8,
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flex: 1,
                borderRadius: 20,
                background: theme.panelSoft,
                border: `1px solid ${theme.stroke}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function renderPathMotif(theme: Theme) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
      }}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: index === 1 ? theme.signalSoft : theme.accentSoft,
              border: `1px solid ${index === 1 ? theme.signal : theme.accent}`,
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flex: 1,
              padding: '16px 18px',
              borderRadius: 22,
              background: theme.panel,
              border: `1px solid ${theme.stroke}`,
            }}
          >
            <div style={{ width: `${82 - index * 12}%`, height: 10, borderRadius: 999, background: theme.text }} />
            <div style={{ width: `${100 - index * 10}%`, height: 9, borderRadius: 999, background: theme.stroke }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function renderPackageMotif(theme: Theme) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        width: '100%',
        padding: 24,
        borderRadius: 28,
        background: theme.panel,
        border: `1px solid ${theme.stroke}`,
        boxShadow: `0 20px 48px ${theme.signalSoft}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: theme.signal }} />
          <div style={{ width: 14, height: 14, borderRadius: 999, background: theme.accent }} />
        </div>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            background: theme.accentSoft,
            color: theme.accent,
            fontSize: 16,
          }}
        >
          release
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 18,
          borderRadius: 22,
          background: theme.panelSoft,
          border: `1px solid ${theme.stroke}`,
        }}
      >
        <div style={{ width: '78%', height: 10, borderRadius: 999, background: theme.text }} />
        <div style={{ width: '94%', height: 10, borderRadius: 999, background: theme.stroke }} />
        <div style={{ width: '62%', height: 10, borderRadius: 999, background: theme.stroke }} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flex: 1,
              minHeight: 86,
              borderRadius: 22,
              background: index === 1 ? theme.signalSoft : theme.accentSoft,
              border: `1px solid ${index === 1 ? theme.signal : theme.accent}`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function renderSectionMotif(section: SocialSection, theme: Theme) {
  switch (section) {
    case 'download':
    case 'releases':
      return renderPackageMotif(theme)
    case 'governance':
    case 'approvals':
    case 'audit':
    case 'security':
    case 'legal':
    case 'support':
      return renderLedgerMotif(theme)
    case 'control':
    case 'monitoring':
    case 'cost':
    case 'guardrails':
    case 'reliability':
      return renderPanelMotif(theme)
    case 'deployment':
    case 'roadmap':
    case 'manifesto':
    case 'whitepaper':
      return renderPathMotif(theme)
    case 'docs':
    case 'infrastructure':
    case 'sdk':
      return renderStackMotif(theme)
    case 'academy':
    case 'tutor':
    case 'autopilot':
    case 'pricing':
    case 'onboarding':
    case 'home':
    case 'contact':
    case 'generic':
    default:
      return renderPathMotif(theme)
  }
}

export async function buildOgImage({
  title,
  description,
  badge,
  host = DEFAULT_HOST,
  surface = 'marketing',
  section = 'generic',
}: OgImageOptions) {
  const [regularFontData, boldFontData] = await Promise.all([loadFont('regular'), loadFont('bold')])
  const theme = getTheme(surface)
  const displayTitle = trimCopy(title.trim(), 96)
  const displayDescription = description?.trim() ? trimCopy(description.trim(), 180) : undefined
  const displayBadge = trimCopy((badge?.trim() || getSectionLabel(section, surface)).toUpperCase(), 36)
  const displayHost = trimCopy(host.replace(/^https?:\/\//, '').replace(/\/$/, ''), 36)
  const brandMark = surface === 'pico' ? 'PICO' : 'MUTX'

  const markup = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: theme.background,
        color: theme.text,
        fontFamily: 'Geist',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
          backgroundSize: '54px 54px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: theme.haloA,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -110,
          bottom: -140,
          width: 340,
          height: 340,
          borderRadius: 999,
          background: theme.haloB,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: theme.band,
        }}
      />

      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '54px 58px 50px',
          gap: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1.15,
            padding: 34,
            borderRadius: 34,
            background: theme.panel,
            border: `1px solid ${theme.stroke}`,
            boxShadow: `0 30px 80px ${theme.accentSoft}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  border: `1px solid ${theme.stroke}`,
                  background: theme.accentSoft,
                  color: theme.accent,
                  padding: '8px 16px',
                  fontSize: 18,
                  letterSpacing: '0.08em',
                }}
              >
                {displayBadge}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: theme.signal }} />
                <div style={{ width: 12, height: 12, borderRadius: 999, background: theme.accent }} />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 62,
                lineHeight: 1.05,
                letterSpacing: '-0.035em',
                fontWeight: 700,
              }}
            >
              {displayTitle}
            </div>

            {displayDescription ? (
              <div
                style={{
                  display: 'flex',
                  maxWidth: 760,
                  fontSize: 28,
                  lineHeight: 1.32,
                  color: theme.muted,
                }}
              >
                {displayDescription}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {[
                getSectionLabel(section, surface),
                surface === 'app' ? 'Operator-grade' : surface === 'pico' ? 'Builder-first' : 'Public surface',
                displayHost,
              ].map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: 'flex',
                    padding: '10px 14px',
                    borderRadius: 999,
                    background: theme.panelSoft,
                    border: `1px solid ${theme.stroke}`,
                    color: theme.muted,
                    fontSize: 18,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${theme.signal} 0%, ${theme.accent} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: surface === 'pico' ? '#fff7eb' : '#ffffff',
                    fontWeight: 700,
                    fontSize: 16,
                    letterSpacing: '0.08em',
                  }}
                >
                  {brandMark}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: '0.12em' }}>
                    {surface === 'pico' ? 'PICOMUTX' : 'MUTX'}
                  </div>
                  <div style={{ display: 'flex', fontSize: 14, color: theme.muted, letterSpacing: '0.06em' }}>
                    {theme.brandLabel}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', fontSize: 18, color: theme.muted, letterSpacing: '0.05em' }}>
                {displayHost}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 0.85,
            padding: 30,
            borderRadius: 34,
            background: theme.panelSoft,
            border: `1px solid ${theme.stroke}`,
            boxShadow: `0 30px 80px ${theme.signalSoft}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', fontSize: 18, letterSpacing: '0.12em', color: theme.muted }}>
              SECTION
            </div>
            <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.1, fontWeight: 700 }}>
              {getSectionLabel(section, surface)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              width: '100%',
              flex: 1,
              paddingTop: 18,
              paddingBottom: 18,
            }}
          >
            {renderSectionMotif(section, theme)}
          </div>
        </div>
      </div>
    </div>
  ) satisfies ReactElement

  return new ImageResponse(markup, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Geist', data: regularFontData, style: 'normal', weight: 400 },
      { name: 'Geist', data: boldFontData, style: 'normal', weight: 700 },
    ],
  })
}

function cacheKey({
  title,
  description,
  badge,
  host = DEFAULT_HOST,
  surface = 'marketing',
  section = 'generic',
}: OgImageOptions) {
  return JSON.stringify({
    title: trimCopy(title.trim(), 96),
    description: description?.trim() ? trimCopy(description.trim(), 180) : '',
    badge: badge?.trim() ? trimCopy(badge.trim().toUpperCase(), 36) : '',
    host: trimCopy(host.replace(/^https?:\/\//, '').replace(/\/$/, ''), 36),
    surface,
    section,
  })
}

function getCachedPng(key: string) {
  const entry = imageCache.get(key)
  if (!entry) return undefined

  if (entry.expiresAt <= Date.now()) {
    imageCache.delete(key)
    return undefined
  }

  return entry.png
}

function putCachedPng(key: string, png: Uint8Array) {
  if (imageCache.size >= IMAGE_CACHE_MAX_ENTRIES) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }

  imageCache.set(key, {
    png,
    expiresAt: Date.now() + IMAGE_CACHE_TTL_MS,
  })
}

function canRenderNow() {
  const now = Date.now()
  while (renderTimestamps.length > 0 && renderTimestamps[0] <= now - RENDER_RATE_LIMIT_WINDOW_MS) {
    renderTimestamps.shift()
  }

  if (renderTimestamps.length >= RENDER_RATE_LIMIT_MAX) {
    return false
  }

  renderTimestamps.push(now)
  return true
}

export async function buildOgImageResponseWithCache(options: OgImageOptions): Promise<Response> {
  const key = cacheKey(options)
  const cached = getCachedPng(key)
  if (cached) {
    return new Response(cached.slice(), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  }

  if (!canRenderNow()) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    })
  }

  const renderPromise =
    inflightImageRenders.get(key) ??
    (async () => {
      const rendered = await buildOgImage(options)
      const pngBuffer = new Uint8Array(await rendered.arrayBuffer())
      putCachedPng(key, pngBuffer)
      return pngBuffer
    })()

  inflightImageRenders.set(key, renderPromise)

  try {
    const png = await renderPromise
    return new Response(png.slice(), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } finally {
    if (inflightImageRenders.get(key) === renderPromise) {
      inflightImageRenders.delete(key)
    }
  }
}
