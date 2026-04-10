import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const BG_FROM = '#030307'
const BG_TO = '#0a0a12'
const ACCENT_FROM = '#3b82f6'
const ACCENT_TO = '#06b6d4'
const TEXT_PRIMARY = '#f8fafc'
const TEXT_SECONDARY = '#94a3b8'
const TEXT_MUTED = '#64748b'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') || 'MUTX'
  const description =
    searchParams.get('description') ||
    'Open control plane for AI agents'
  const path = searchParams.get('path') || ''
  const badge = searchParams.get('badge') || ''

  // Clamp title length so it doesn't overflow
  const displayTitle = title.length > 80 ? title.slice(0, 77) + '...' : title
  const displayDesc =
    description.length > 140
      ? description.slice(0, 137) + '...'
      : description

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: `linear-gradient(135deg, ${BG_FROM} 0%, ${BG_TO} 100%)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: `2px solid rgba(59,130,246,0.25)`,
            borderRadius: '0px',
          }}
        />

        {/* Top bar: logo + badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Logo mark */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              M
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: TEXT_PRIMARY,
                letterSpacing: '-0.02em',
              }}
            >
              mutx.dev
            </span>
          </div>
          {badge ? (
            <div
              style={{
                padding: '4px 14px',
                borderRadius: '999px',
                background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>

        {/* Center: title + description */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            flex: 1,
            justifyContent: 'center',
            maxWidth: '900px',
          }}
        >
          <div
            style={{
              fontSize: displayTitle.length > 50 ? '48px' : '56px',
              fontWeight: 700,
              color: TEXT_PRIMARY,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              fontSize: '26px',
              color: TEXT_SECONDARY,
              lineHeight: 1.4,
              maxWidth: '800px',
            }}
          >
            {displayDesc}
          </div>
        </div>

        {/* Bottom: path breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {path ? (
            <span
              style={{
                fontSize: '16px',
                color: TEXT_MUTED,
                fontFamily: 'monospace',
              }}
            >
              {path}
            </span>
          ) : null}
          <div
            style={{
              marginLeft: 'auto',
              fontSize: '16px',
              color: TEXT_MUTED,
            }}
          >
            Deploy agents like services. Operate them like systems.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
