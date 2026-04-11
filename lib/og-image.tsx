import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'
import { readFile } from 'fs/promises'
import { join } from 'path'

type OgImageOptions = {
  title: string
  description?: string
  badge?: string
  host?: string
}

const WIDTH = 1200
const HEIGHT = 630
const BG = '#060810'
const BG_GRADIENT_END = '#0c1220'
const TEXT_WHITE = '#ffffff'
const TEXT_MUTED = '#94a3b8'
const ACCENT = '#68e1ff'
const LOGO_RED = '#FF4E4E'
const DEFAULT_HOST = 'mutx.dev'

let geistRegular: ArrayBuffer | undefined
let geistBold: ArrayBuffer | undefined

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

export async function buildOgImage({ title, description, badge, host = DEFAULT_HOST }: OgImageOptions) {
  const [regularFontData, boldFontData] = await Promise.all([
    loadFont('regular'),
    loadFont('bold'),
  ])

  const displayTitle = trimCopy(title.trim(), 96)
  const displayDescription = description?.trim() ? trimCopy(description.trim(), 180) : undefined
  const displayBadge = badge?.trim() ? trimCopy(badge.trim().toUpperCase(), 36) : undefined
  const displayHost = trimCopy(host.replace(/^https?:\/\//, '').replace(/\/$/, ''), 36)

  const markup = (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${BG} 0%, ${BG_GRADIENT_END} 100%)`,
          color: TEXT_WHITE,
          padding: '64px 72px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Geist',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(104,225,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(104,225,255,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${LOGO_RED} 0%, ${ACCENT} 50%, ${LOGO_RED} 100%)`,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 930, zIndex: 1 }}>
          {displayBadge ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                borderRadius: 999,
                border: `1px solid rgba(104,225,255,0.28)`,
                background: 'rgba(104,225,255,0.1)',
                color: ACCENT,
                padding: '8px 18px',
                fontSize: 18,
                letterSpacing: '0.08em',
              }}
            >
              {displayBadge}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              fontSize: 62,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              fontWeight: 700,
            }}
          >
            {displayTitle}
          </div>

          {displayDescription ? (
            <div
              style={{
                display: 'flex',
                maxWidth: 800,
                fontSize: 28,
                lineHeight: 1.35,
                color: TEXT_MUTED,
              }}
            >
              {displayDescription}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${LOGO_RED} 0%, #C92D2D 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(255,78,78,0.28)',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: '#19E0DA',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: '0.12em' }}>
                MUTX
              </div>
              <div style={{ display: 'flex', fontSize: 14, color: TEXT_MUTED, letterSpacing: '0.06em' }}>
                OPEN CONTROL FOR DEPLOYED AGENTS
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 18, color: TEXT_MUTED, letterSpacing: '0.05em' }}>
            {displayHost}
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
