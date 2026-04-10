import satori from 'satori'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OgImageProps {
  /** Page headline – rendered large */
  title: string
  /** One-line description – rendered smaller below the title */
  description?: string
  /** Optional pill label – e.g. "Docs", "PicoMUTX", "Security" */
  tag?: string
  /** Domain line shown at bottom-left */
  domain?: string
  /** Path to a page-type icon (SVG string) rendered top-right */
  iconSvg?: string
}

// ---------------------------------------------------------------------------
// Font loading (lazy, cached)
// ---------------------------------------------------------------------------

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

let _fonts: Array<{ name: string; data: ArrayBuffer; weight: FontWeight }> | null =
  null

function loadFonts() {
  if (_fonts) return _fonts

  const geistRegular = readFileSync(
    join(process.cwd(), 'app/fonts/Geist-Regular.ttf'),
  )

  _fonts = [
    { name: 'Geist', data: geistRegular.buffer as ArrayBuffer, weight: 400 as FontWeight },
    { name: 'Geist', data: geistRegular.buffer as ArrayBuffer, weight: 700 as FontWeight },
  ]
  return _fonts
}

// ---------------------------------------------------------------------------
// The MUTX robot mark as an inline SVG data-URI
// We embed a simplified version of the mascot head — cyan eyes, red body.
// ---------------------------------------------------------------------------

const MUTX_MARK_SVG = `<svg width="56" height="56" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ogbody" x1="110" y1="80" x2="520" y2="540" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF4E4E"/>
      <stop offset="1" stop-color="#C92D2D"/>
    </linearGradient>
  </defs>
  <ellipse cx="320" cy="330" rx="244" ry="232" fill="url(#ogbody)"/>
  <circle cx="242" cy="240" r="38" fill="#06121F"/>
  <circle cx="398" cy="240" r="38" fill="#06121F"/>
  <circle cx="242" cy="240" r="16" fill="#19E0DA"/>
  <circle cx="398" cy="240" r="16" fill="#19E0DA"/>
</svg>`

const MUTX_MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(MUTX_MARK_SVG).toString('base64')}`

// ---------------------------------------------------------------------------
// JSX template
// ---------------------------------------------------------------------------

function OgCard({ title, description, tag, domain }: OgImageProps) {
  const displayTitle =
    title.length > 72 ? title.slice(0, 69) + '...' : title
  const displayDesc =
    description && description.length > 140
      ? description.slice(0, 137) + '...'
      : description

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#060810',
        fontFamily: 'Geist, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background gradient layers */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 15% 10%, rgba(113, 184, 255, 0.15), transparent 40%), radial-gradient(circle at 85% 15%, rgba(104, 225, 255, 0.12), transparent 35%), radial-gradient(circle at 50% 80%, rgba(12, 20, 32, 0.8), transparent 60%), linear-gradient(180deg, #080b13 0%, #09101a 50%, #060810 100%)',
        }}
      />

      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Accent border line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background:
            'linear-gradient(90deg, transparent, #68e1ff 20%, #19c8ff 50%, #71b8ff 80%, transparent)',
        }}
      />

      {/* Top bar — tag pill + logo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '48px 72px 0 72px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {tag ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: 'rgba(104, 225, 255, 0.08)',
              border: '1px solid rgba(104, 225, 255, 0.2)',
              borderRadius: 100,
              padding: '6px 18px',
            }}
          >
            <span
              style={{
                color: '#68e1ff',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {tag}
            </span>
          </div>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              color: 'rgba(221, 231, 240, 0.6)',
              fontSize: 16,
              fontWeight: 400,
              letterSpacing: '0.04em',
            }}
          >
            {domain || 'mutx.dev'}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          padding: '0 72px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            margin: 0,
            maxWidth: 1000,
          }}
        >
          {displayTitle}
        </h1>
        {displayDesc && (
          <p
            style={{
              color: 'rgba(221, 231, 240, 0.68)',
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.45,
              marginTop: 24,
              marginBottom: 0,
              maxWidth: 900,
            }}
          >
            {displayDesc}
          </p>
        )}
      </div>

      {/* Bottom bar — mark + tagline */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 72px 40px 72px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={MUTX_MARK_DATA_URI}
            width={36}
            height={36}
            alt=""
            style={{ borderRadius: 8 }}
          />
          <span
            style={{
              color: 'rgba(221, 231, 240, 0.5)',
              fontSize: 15,
              fontWeight: 400,
            }}
          >
            Open Control Plane for AI Agents
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(104, 225, 255, 0.5)',
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            mutx.dev
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export async function renderOgImage(props: OgImageProps): Promise<Buffer> {
  const fonts = loadFonts()

  const svg = await satori(<OgCard {...props} />, {
    width: 1200,
    height: 630,
    fonts,
  })

  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  return png
}
